using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using SwiftX.Models;
using SwiftX.Services;
using System.Security.Claims;

namespace SwiftX.Controllers
{
    [Authorize(AuthenticationSchemes = "CustomerScheme", Roles = "Customer")]
    public class CustomerController : Controller
    {
        private readonly AppDbContext _db;
        private readonly IPasswordHasher<UserModel> _passwordHasher;
        private readonly ISupabaseStorageService _storage;
        private readonly SupabaseOptions _supabase;

        public CustomerController(AppDbContext db, IPasswordHasher<UserModel> passwordHasher, ISupabaseStorageService storage, IOptions<SupabaseOptions> supabase)
        {
            _db = db;
            _passwordHasher = passwordHasher;
            _storage = storage;
            _supabase = supabase.Value;
        }

        // AUTH LEVEL (Allow Anonymous)
        [AllowAnonymous]
        public IActionResult UserLogin()
        {
            return View("Auth/UserLogin");
        }
        [AllowAnonymous]
        public IActionResult CustomerSignup()
        {
            return View("Auth/CustomerSignup");
        }
        [AllowAnonymous]
        public IActionResult ForgotPasswordEmail()
        {
            return View("Auth/ForgotPasswordEmail");
        }
        [AllowAnonymous]
        public IActionResult ForgotPasswordOTP()
        {
            return View("Auth/ForgotPasswordOTP");
        }
        [AllowAnonymous]
        public IActionResult ChangePassword()
        {
            return View("Auth/ChangePassword");
        }

        // CUSTOMER MAIN
        public IActionResult CustomerHome()
        {
            return View("Main/CustomerHome");
        }

        public IActionResult CustomerOrderHistory()
        {
            return View("Main/CustomerOrderHistory");
        }
        

        // FOODX
        public IActionResult FoodXBrowse()
        {
            return View("FoodX/FoodXBrowse");
        }
        public IActionResult FoodXMenu()
        {
            return View("FoodX/FoodXMenu");
        }
        public IActionResult FoodXCart()
        {
            return View("FoodX/FoodXCart");
        }
        public IActionResult FoodXCheckOut()
        {
            return View("FoodX/FoodXCheckOut");
        }
        public IActionResult FoodXPayment()
        {
            return View("FoodX/FoodXPayment");
        }
        public IActionResult FoodXTracking()
        {
            return View("FoodX/FoodXTracking");
        }



        // ACCOUNT SETTINGS
        public IActionResult CustomerAccountInfo()
        {
            return View("Main/CustomerAccountInfo");
        }
        public IActionResult CustomerSecurity()
        {
            return View("Main/Settings/CustomerSecurity");
        }


        public IActionResult CustomerReviewAddress()
        {
            return View("Main/Settings/CustomerReviewAddress");

        }
        public IActionResult CustomerSavedAddresses()
        {
            return View("Main/Settings/CustomerSavedAddresses");
        }

        // ══════════════════════════════════════════════════════════
        // CUSTOMER API ENDPOINTS
        // ══════════════════════════════════════════════════════════

        [HttpGet]
        public async Task<IActionResult> GetProfile()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out var userId)) return Unauthorized();

            var user = await _db.Users.FindAsync(userId);
            if (user == null) return NotFound();

            return Json(new
            {
                username = user.Username,
                fullName = $"{user.FirstName} {user.LastName}".Trim(),
                email = user.Email,
                phone = user.Contact,
                gender = user.Gender,
                birthdate = (!string.IsNullOrEmpty(user.BirthYear) && !string.IsNullOrEmpty(user.BirthMonth) && !string.IsNullOrEmpty(user.BirthDate))
                            ? $"{user.BirthYear}-{user.BirthMonth.PadLeft(2, '0')}-{user.BirthDate.PadLeft(2, '0')}"
                            : null,
                profileImageUrl = !string.IsNullOrEmpty(user.ProfileImagePath) 
                    ? await _storage.CreateSignedUrlAsync(_supabase.CustomerBucket, user.ProfileImagePath)
                    : null
            });
        }

        [HttpPost]
        [IgnoreAntiforgeryToken] // If the JS frontend doesn't send CSRF tokens yet
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
        {
            if (request == null) return BadRequest();

            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out var userId)) return Unauthorized();

            var user = await _db.Users.FindAsync(userId);
            if (user == null) return NotFound();

            user.Username = request.Username;
            
            if (!string.IsNullOrWhiteSpace(request.FullName))
            {
                var parts = request.FullName.Trim().Split(' ', 2);
                user.FirstName = parts[0];
                user.LastName = parts.Length > 1 ? parts[1] : "";
            }

            user.Gender = request.Gender;
            
            if (!string.IsNullOrWhiteSpace(request.Birthdate) && DateTime.TryParse(request.Birthdate, out var dob))
            {
                user.BirthYear = dob.Year.ToString();
                user.BirthMonth = dob.Month.ToString();
                user.BirthDate = dob.Day.ToString();
            }

            await _db.SaveChangesAsync();
            return Json(new { success = true });
        }

        [HttpPost]
        [IgnoreAntiforgeryToken]
        public async Task<IActionResult> UploadProfileImage(IFormFile file)
        {
            if (file == null || file.Length == 0) return BadRequest(new { success = false, message = "No file uploaded." });

            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out var userId)) return Unauthorized();

            var user = await _db.Users.FindAsync(userId);
            if (user == null) return NotFound();

            var bucket = _supabase.CustomerBucket;
            if (string.IsNullOrEmpty(bucket)) return BadRequest(new { success = false, message = "Storage not configured." });

            var objectPath = $"{userId}/{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
            var storedPath = await _storage.UploadAsync(file, bucket, objectPath);

            if (!string.IsNullOrEmpty(storedPath))
            {
                // Delete old if exists
                if (!string.IsNullOrEmpty(user.ProfileImagePath))
                {
                    try { await _storage.DeleteAsync(bucket, user.ProfileImagePath); } catch { }
                }

                user.ProfileImagePath = storedPath;
                await _db.SaveChangesAsync();
                
                var url = await _storage.CreateSignedUrlAsync(bucket, storedPath);
                return Json(new { success = true, url });
            }

            return Json(new { success = false, message = "Upload failed." });
        }

        [HttpPost]
        [ValidateAntiForgeryToken] // The CustomerSecurity page has antiforgery tokens generated
        public async Task<IActionResult> UpdateEmail([FromBody] UpdateEmailRequest request)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out var userId)) return Unauthorized();

            var user = await _db.Users.FindAsync(userId);
            if (user == null) return NotFound();

            if (_passwordHasher.VerifyHashedPassword(user, user.Password, request.CurrentPassword) == PasswordVerificationResult.Failed)
            {
                return BadRequest(new { message = "Incorrect password." });
            }

            if (await _db.Users.AnyAsync(u => u.Email == request.NewEmail && u.Id != userId))
            {
                return BadRequest(new { message = "Email is already taken." });
            }

            user.Email = request.NewEmail;
            await _db.SaveChangesAsync();
            return Json(new { success = true });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> UpdatePassword([FromBody] UpdatePasswordRequest request)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out var userId)) return Unauthorized();

            var user = await _db.Users.FindAsync(userId);
            if (user == null) return NotFound();

            if (_passwordHasher.VerifyHashedPassword(user, user.Password, request.CurrentPassword) == PasswordVerificationResult.Failed)
            {
                return BadRequest(new { message = "Incorrect current password." });
            }

            user.Password = _passwordHasher.HashPassword(user, request.NewPassword);
            await _db.SaveChangesAsync();
            return Json(new { success = true });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> UpdatePhone([FromBody] UpdatePhoneRequest request)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out var userId)) return Unauthorized();

            var user = await _db.Users.FindAsync(userId);
            if (user == null) return NotFound();

            if (_passwordHasher.VerifyHashedPassword(user, user.Password, request.CurrentPassword) == PasswordVerificationResult.Failed)
            {
                return BadRequest(new { message = "Incorrect password." });
            }

            user.Contact = request.NewPhone;
            await _db.SaveChangesAsync();
            return Json(new { success = true });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteAccount()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out var userId)) return Unauthorized();

            var user = await _db.Users.FindAsync(userId);
            if (user == null) return NotFound();

            user.IsActive = false; // Soft delete
            await _db.SaveChangesAsync();

            await HttpContext.SignOutAsync("CustomerScheme");
            
            return Json(new { success = true });
        }
    }

    public class UpdateProfileRequest
    {
        public string Username { get; set; }
        public string FullName { get; set; }
        public string Gender { get; set; }
        public string Birthdate { get; set; }
    }

    public class UpdateEmailRequest
    {
        public string NewEmail { get; set; }
        public string CurrentPassword { get; set; }
    }

    public class UpdatePasswordRequest
    {
        public string CurrentPassword { get; set; }
        public string NewPassword { get; set; }
    }

    public class UpdatePhoneRequest
    {
        public string NewPhone { get; set; }
        public string CurrentPassword { get; set; }
    }
}