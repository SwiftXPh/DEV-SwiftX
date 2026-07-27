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
    [IgnoreAntiforgeryToken]
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

            var ok = user != null &&
                     _passwordHasher.VerifyHashedPassword(user, user.Password, request.Password) != PasswordVerificationResult.Failed;

            if (!ok)
            {
                return Json(new { success = false, message = "Invalid username or password." });
            }

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user!.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, "Customer")
            };
            var identity = new ClaimsIdentity(claims, "CustomerScheme");
            await HttpContext.SignInAsync("CustomerScheme", new ClaimsPrincipal(identity));

            return Json(new { success = true, redirectUrl = "/Customer/CustomerHome" });
        }

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
