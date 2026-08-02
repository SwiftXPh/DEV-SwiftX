using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using SwiftX.Models;
using System.Security.Claims;

namespace SwiftX.Controllers
{
    [AllowAnonymous]
    public class AuthController : Controller
    {
        private readonly AppDbContext _db;
        private readonly IPasswordHasher<UserModel> _passwordHasher;

        public AuthController(AppDbContext db, IPasswordHasher<UserModel> passwordHasher)
        {
            _db = db;
            _passwordHasher = passwordHasher;
        }

        [HttpPost]
        [EnableRateLimiting("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
            {
                return Json(new { success = false, message = "Username and password are required." });
            }

            var user = await _db.Users.FirstOrDefaultAsync(u => u.Username == request.Username && u.Role == "Customer" && u.IsActive);

            if (user != null)
            {
                if (user.LockoutEnd.HasValue && user.LockoutEnd.Value > DateTime.UtcNow)
                {
                    var waitMinutes = (int)Math.Ceiling((user.LockoutEnd.Value - DateTime.UtcNow).TotalMinutes);
                    return Json(new { success = false, message = $"Account temporarily locked. Try again in {waitMinutes} minute(s)." });
                }
            }

            // Guard: Google-only users (no local password) get a helpful message.
            if (user != null && string.IsNullOrEmpty(user.Password))
            {
                return Json(new { success = false, message = "This account uses Google sign-in. Please use the 'Continue with Google' button." });
            }

            var ok = user != null &&
                     _passwordHasher.VerifyHashedPassword(user, user.Password!, request.Password) != PasswordVerificationResult.Failed;

            if (!ok)
            {
                if (user != null && !string.IsNullOrEmpty(user.Password))
                {
                    user.FailedLoginAttempts++;
                    if (user.FailedLoginAttempts >= 5)
                    {
                        user.LockoutEnd = DateTime.UtcNow.AddMinutes(15);
                        await _db.SaveChangesAsync();
                        return Json(new { success = false, message = "Account temporarily locked due to too many failed attempts. Try again in 15 minutes." });
                    }
                    await _db.SaveChangesAsync();
                }
                return Json(new { success = false, message = "Invalid username or password." });
            }
            
            // Successful login, reset lockout
            if (user != null)
            {
                user.FailedLoginAttempts = 0;
                user.LockoutEnd = null;
                await _db.SaveChangesAsync();
            }

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user!.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, "Customer"),
                new Claim(ClaimTypes.GivenName, user.FirstName ?? ""),
                new Claim(ClaimTypes.Surname, user.LastName ?? "")
            };
            var identity = new ClaimsIdentity(claims, "CustomerScheme");
            await HttpContext.SignInAsync("CustomerScheme", new ClaimsPrincipal(identity));

            return Json(new { success = true, redirectUrl = "/Customer/CustomerHome" });
        }

        // ══════════════════════════════════════════════════════════
        // GOOGLE OAUTH
        // ══════════════════════════════════════════════════════════

        /// <summary>
        /// Initiates the Google OAuth challenge — redirects the browser to Google's consent screen.
        /// </summary>
        [HttpGet]
        public IActionResult GoogleLogin()
        {
            var properties = new AuthenticationProperties
            {
                RedirectUri = Url.Action("GoogleCallback", "Auth")
            };
            return Challenge(properties, "Google");
        }

        /// <summary>
        /// Receives the Google claims after consent, finds-or-creates the UserModel + Customer,
        /// issues the CustomerScheme cookie, and redirects to the customer home page.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GoogleCallback()
        {
            // The Google middleware already wrote a temporary cookie via SignInScheme.
            // Authenticate against CustomerScheme to read it.
            var result = await HttpContext.AuthenticateAsync("CustomerScheme");
            if (!result.Succeeded || result.Principal == null)
            {
                return RedirectToAction("UserLogin", "Customer");
            }

            var googleId = result.Principal.FindFirstValue(ClaimTypes.NameIdentifier);
            var email    = result.Principal.FindFirstValue(ClaimTypes.Email);
            var firstName = result.Principal.FindFirstValue(ClaimTypes.GivenName) ?? "";
            var lastName  = result.Principal.FindFirstValue(ClaimTypes.Surname) ?? "";

            if (string.IsNullOrEmpty(googleId) || string.IsNullOrEmpty(email))
            {
                return RedirectToAction("UserLogin", "Customer");
            }

            // 1. Look up by GoogleId (returning user).
            var user = await _db.Users.FirstOrDefaultAsync(u => u.GoogleId == googleId && u.IsActive);

            // 2. If not found, try account linking by email.
            if (user == null)
            {
                // Find ANY user with this email to avoid unique constraint violations
                var existingUser = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);
                if (existingUser != null)
                {
                    if (existingUser.Role != "Customer" || !existingUser.IsActive)
                    {
                        // The email belongs to a Merchant/Rider/Admin or an inactive account
                        TempData["ErrorMessage"] = "This email is associated with a non-customer or inactive account.";
                        return RedirectToAction("UserLogin", "Customer");
                    }
                    
                    // It is an active customer, so link the Google account
                    user = existingUser;
                    user.GoogleId = googleId;
                    await _db.SaveChangesAsync();
                }
            }

            // 3. If still not found, auto-register.
            if (user == null)
            {
                await using var transaction = await _db.Database.BeginTransactionAsync();
                try
                {
                    var username = await GenerateUniqueUsernameAsync(email);

                    user = new UserModel
                    {
                        Username  = username,
                        FirstName = firstName,
                        LastName  = lastName,
                        Email     = email,
                        Contact   = "",
                        Address   = "—",
                        Role      = "Customer",
                        GoogleId  = googleId,
                        Password  = null  // No local password for Google-only users
                    };

                    _db.Users.Add(user);
                    await _db.SaveChangesAsync();

                    _db.Customers.Add(new Customer { UserId = user.Id });
                    await _db.SaveChangesAsync();

                    await transaction.CommitAsync();
                }
                catch
                {
                    await transaction.RollbackAsync();
                    return RedirectToAction("UserLogin", "Customer");
                }
            }

            // 4. Build the standard claims and sign in.
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, "Customer"),
                new Claim(ClaimTypes.GivenName, user.FirstName ?? ""),
                new Claim(ClaimTypes.Surname, user.LastName ?? "")
            };
            var identity = new ClaimsIdentity(claims, "CustomerScheme");
            await HttpContext.SignInAsync("CustomerScheme", new ClaimsPrincipal(identity));

            return Redirect("/Customer/CustomerHome");
        }

        /// <summary>
        /// Generates a username from the email prefix, appending a random suffix if taken.
        /// E.g. "john.doe@gmail.com" → "john.doe" or "john.doe_4a7f".
        /// </summary>
        private async Task<string> GenerateUniqueUsernameAsync(string email)
        {
            var prefix = email.Split('@')[0].ToLowerInvariant();
            // Sanitize: keep only letters, digits, dots, underscores
            prefix = new string(prefix.Where(c => char.IsLetterOrDigit(c) || c == '.' || c == '_').ToArray());
            if (string.IsNullOrEmpty(prefix)) prefix = "user";

            var candidate = prefix;
            while (await _db.Users.AnyAsync(u => u.Username == candidate))
            {
                candidate = $"{prefix}_{Guid.NewGuid().ToString("N")[..4]}";
            }

            return candidate;
        }

        // ══════════════════════════════════════════════════════════

        [HttpPost]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            if (request == null || !ModelState.IsValid)
            {
                return Json(new { success = false, message = "Invalid registration data." });
            }

            if (await _db.Users.AnyAsync(u => u.Username == request.Username))
            {
                return Json(new { success = false, message = "Username is already taken." });
            }
            if (await _db.Users.AnyAsync(u => u.Email == request.Email))
            {
                return Json(new { success = false, message = "Email is already registered." });
            }

            await using var transaction = await _db.Database.BeginTransactionAsync();
            try
            {
                var user = new UserModel
                {
                    Username = request.Username,
                    FirstName = request.FullName ?? "",
                    LastName = "",
                    Email = request.Email,
                    Contact = request.PhoneNumber,
                    Gender = request.Gender,
                    Role = "Customer",
                    Address = "—" // Required in UserModel
                };

                if (!string.IsNullOrWhiteSpace(request.FullName))
                {
                    var parts = request.FullName.Trim().Split(' ', 2);
                    user.FirstName = parts[0];
                    if (parts.Length > 1) user.LastName = parts[1];
                }

                if (!string.IsNullOrWhiteSpace(request.Birthdate) && DateTime.TryParse(request.Birthdate, out var dob))
                {
                    user.BirthYear = dob.Year.ToString();
                    user.BirthMonth = dob.Month.ToString();
                    user.BirthDate = dob.Day.ToString();
                }

                user.Password = _passwordHasher.HashPassword(user, request.Password);
                
                _db.Users.Add(user);
                await _db.SaveChangesAsync();

                var customer = new Customer
                {
                    UserId = user.Id
                };
                
                _db.Customers.Add(customer);
                await _db.SaveChangesAsync();
                
                await transaction.CommitAsync();

                return Json(new { success = true, redirectUrl = "/Customer/UserLogin" });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return Json(new { success = false, message = "Registration failed due to a server error." });
            }
        }

        [HttpPost]
        public async Task<IActionResult> Logout()
        {
            await HttpContext.SignOutAsync("CustomerScheme");
            return Json(new { success = true });
        }
    }

    public class LoginRequest
    {
        public string Username { get; set; }
        public string Password { get; set; }
    }

    public class RegisterRequest
    {
        public string Username { get; set; }
        public string FullName { get; set; }
        public string PhoneNumber { get; set; }
        public string Email { get; set; }
        public string Gender { get; set; }
        public string Birthdate { get; set; }
        public string Password { get; set; }
    }
}
