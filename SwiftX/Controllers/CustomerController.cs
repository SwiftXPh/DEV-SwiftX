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
        private readonly GoogleMapsOptions _googleMaps;

        public CustomerController(AppDbContext db, IPasswordHasher<UserModel> passwordHasher, ISupabaseStorageService storage, IOptions<SupabaseOptions> supabase, IOptions<GoogleMapsOptions> googleMaps)
        {
            _db = db;
            _passwordHasher = passwordHasher;
            _storage = storage;
            _supabase = supabase.Value;
            _googleMaps = googleMaps.Value;
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
        public async Task<IActionResult> CustomerHome()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!string.IsNullOrEmpty(userIdStr) && int.TryParse(userIdStr, out var userId))
            {
                var customer = await _db.Customers.Include(c => c.SavedAddresses).FirstOrDefaultAsync(c => c.UserId == userId);
                if (customer != null && !customer.SavedAddresses.Any())
                {
                    return RedirectToAction("CustomerReviewAddress", new { firstTime = true });
                }
            }
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

        // ══════════════════════════════════════════════════════════
        // FOODX STORE & MENU API ENDPOINTS
        // ══════════════════════════════════════════════════════════

        [HttpGet]
        public async Task<IActionResult> GetStores()
        {
            var stores = await _db.Stores
                .Where(s => s.Status == "Active")
                .OrderBy(s => s.BusinessName)
                .ToListAsync();

            var result = new List<object>();
            foreach (var store in stores)
            {
                string? logoUrl = null;
                if (!string.IsNullOrEmpty(store.LogoPath))
                    logoUrl = await _storage.CreateSignedUrlAsync(_supabase.MerchantBucket, store.LogoPath);

                string? coverUrl = null;
                if (!string.IsNullOrEmpty(store.CoverImagePath))
                    coverUrl = await _storage.CreateSignedUrlAsync(_supabase.MerchantBucket, store.CoverImagePath);

                result.Add(new
                {
                    id = store.Id,
                    name = store.BusinessName,
                    address = store.BusinessAddress,
                    category = store.Category ?? "",
                    logoUrl = logoUrl,
                    coverUrl = coverUrl,
                    lat = store.Latitude,
                    lng = store.Longitude
                });
            }

            return Json(result);
        }

        [HttpGet]
        public async Task<IActionResult> GetStoreMenu(int storeId)
        {
            var store = await _db.Stores
                .Include(s => s.Products.Where(p => p.IsAvailable))
                .FirstOrDefaultAsync(s => s.Id == storeId && s.Status == "Active");

            if (store == null) return NotFound();

            string? logoUrl = null;
            if (!string.IsNullOrEmpty(store.LogoPath))
                logoUrl = await _storage.CreateSignedUrlAsync(_supabase.MerchantBucket, store.LogoPath);

            string? coverUrl = null;
            if (!string.IsNullOrEmpty(store.CoverImagePath))
                coverUrl = await _storage.CreateSignedUrlAsync(_supabase.MerchantBucket, store.CoverImagePath);

            var products = new List<object>();
            var categories = new HashSet<string>();

            foreach (var p in store.Products)
            {
                string? imgUrl = null;
                if (!string.IsNullOrEmpty(p.ImagePath))
                    imgUrl = await _storage.CreateSignedUrlAsync(_supabase.MerchantBucket, p.ImagePath);

                var cat = string.IsNullOrWhiteSpace(p.Category) ? "Meals" : p.Category.Trim();
                categories.Add(cat);

                products.Add(new
                {
                    id = p.Id,
                    name = p.Name,
                    description = p.Description,
                    price = p.Price,
                    category = cat,
                    img = imgUrl
                });
            }

            return Json(new
            {
                store = new
                {
                    id = store.Id,
                    name = store.BusinessName,
                    address = store.BusinessAddress,
                    category = store.Category ?? "",
                    logoUrl = logoUrl,
                    coverUrl = coverUrl
                },
                products = products,
                categories = categories.ToList()
            });
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
            ViewBag.GoogleMapsApiKey = _googleMaps.ApiKey;
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
        public async Task<IActionResult> GetAddresses()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out var userId)) return Unauthorized();

            var customer = await _db.Customers.Include(c => c.SavedAddresses).FirstOrDefaultAsync(c => c.UserId == userId);
            if (customer == null) return NotFound();

            var addresses = customer.SavedAddresses.OrderByDescending(a => a.IsDefault).ThenByDescending(a => a.CreatedAt).Select(a => new
            {
                id = a.Id,
                label = a.Label,
                fullAddress = a.FullAddress,
                lat = a.Latitude,
                lng = a.Longitude,
                isDefault = a.IsDefault,
                unit = a.FloorUnit,
                name = a.ContactName,
                phone = a.ContactPhone,
                note = a.Notes
            });

            return Json(addresses);
        }

        [HttpGet]
        public async Task<IActionResult> GetDefaultAddress()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out var userId)) return Unauthorized();

            var customer = await _db.Customers.Include(c => c.SavedAddresses).FirstOrDefaultAsync(c => c.UserId == userId);
            if (customer == null) return NotFound();

            var defaultAddress = customer.SavedAddresses.FirstOrDefault(a => a.IsDefault) ?? customer.SavedAddresses.OrderByDescending(a => a.CreatedAt).FirstOrDefault();

            if (defaultAddress == null) return Json(null);

            return Json(new
            {
                id = defaultAddress.Id,
                label = defaultAddress.Label,
                fullAddress = defaultAddress.FullAddress,
                lat = defaultAddress.Latitude,
                lng = defaultAddress.Longitude,
                isDefault = defaultAddress.IsDefault,
                unit = defaultAddress.FloorUnit,
                name = defaultAddress.ContactName,
                phone = defaultAddress.ContactPhone,
                note = defaultAddress.Notes
            });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> SaveAddress([FromBody] SaveAddressRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.FullAddress)) return BadRequest();

            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out var userId)) return Unauthorized();

            var customer = await _db.Customers.Include(c => c.SavedAddresses).FirstOrDefaultAsync(c => c.UserId == userId);
            if (customer == null) return NotFound();

            CustomerAddress address;
            if (request.Id.HasValue && request.Id.Value > 0)
            {
                address = customer.SavedAddresses.FirstOrDefault(a => a.Id == request.Id.Value);
                if (address == null) return NotFound();
            }
            else
            {
                address = new CustomerAddress { CustomerId = customer.Id };
                // If it's the first address, make it default
                if (!customer.SavedAddresses.Any())
                {
                    address.IsDefault = true;
                }
                _db.CustomerAddresses.Add(address);
            }

            address.Label = request.Label ?? "Saved Location";
            address.FullAddress = request.FullAddress;
            address.Latitude = request.Lat;
            address.Longitude = request.Lng;
            address.FloorUnit = request.Unit;
            address.ContactName = request.Name;
            address.ContactPhone = request.Phone;
            address.Notes = request.Note;

            await _db.SaveChangesAsync();
            return Json(new { success = true, id = address.Id });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteAddress([FromBody] DeleteAddressRequest request)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out var userId)) return Unauthorized();

            var customer = await _db.Customers.Include(c => c.SavedAddresses).FirstOrDefaultAsync(c => c.UserId == userId);
            if (customer == null) return NotFound();

            var address = customer.SavedAddresses.FirstOrDefault(a => a.Id == request.Id);
            if (address == null) return NotFound();

            bool wasDefault = address.IsDefault;
            _db.CustomerAddresses.Remove(address);
            await _db.SaveChangesAsync();
            
            // If we deleted the default, set a new default if there are other addresses
            if (wasDefault)
            {
                var newDefault = await _db.CustomerAddresses
                    .Where(a => a.CustomerId == customer.Id)
                    .OrderByDescending(a => a.CreatedAt)
                    .FirstOrDefaultAsync();
                if (newDefault != null)
                {
                    newDefault.IsDefault = true;
                    await _db.SaveChangesAsync();
                }
            }

            return Json(new { success = true });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> SetDefaultAddress([FromBody] SetDefaultAddressRequest request)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out var userId)) return Unauthorized();

            var customer = await _db.Customers.Include(c => c.SavedAddresses).FirstOrDefaultAsync(c => c.UserId == userId);
            if (customer == null) return NotFound();

            var addressToSet = customer.SavedAddresses.FirstOrDefault(a => a.Id == request.Id);
            if (addressToSet == null) return NotFound();

            foreach (var addr in customer.SavedAddresses)
            {
                addr.IsDefault = (addr.Id == request.Id);
            }

            await _db.SaveChangesAsync();
            return Json(new { success = true });
        }

        [HttpGet]
        public async Task<IActionResult> HasAddresses()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out var userId)) return Unauthorized();

            var customer = await _db.Customers.Include(c => c.SavedAddresses).FirstOrDefaultAsync(c => c.UserId == userId);
            if (customer == null) return NotFound();

            return Json(new { hasAddresses = customer.SavedAddresses.Any() });
        }

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
                birthdate = user.DateOfBirth?.ToString("yyyy-MM-dd"),
                profileImageUrl = !string.IsNullOrEmpty(user.ProfileImagePath) 
                    ? await _storage.CreateSignedUrlAsync(_supabase.CustomerBucket, user.ProfileImagePath)
                    : null,
                isGoogleUser = !string.IsNullOrEmpty(user.GoogleId)
            });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
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
                user.DateOfBirth = dob;
            }

            await _db.SaveChangesAsync();
            return Json(new { success = true });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
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

            // Google-only users have no local password to verify.
            if (string.IsNullOrEmpty(user.Password))
            {
                return BadRequest(new { message = "Google-linked accounts cannot change email here. Please manage your email through Google." });
            }

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

            // Google-only users have no local password.
            if (string.IsNullOrEmpty(user.Password))
            {
                return BadRequest(new { message = "Google-linked accounts don't have a password. You sign in with Google." });
            }

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

            // Only verify password for non-Google users (Google users have no local password).
            if (!string.IsNullOrEmpty(user.Password))
            {
                if (string.IsNullOrEmpty(request.CurrentPassword) ||
                    _passwordHasher.VerifyHashedPassword(user, user.Password, request.CurrentPassword) == PasswordVerificationResult.Failed)
                {
                    return BadRequest(new { message = "Incorrect password." });
                }
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
        public string? NewPhone { get; set; }
        public string? CurrentPassword { get; set; }
    }

    public class SaveAddressRequest
    {
        public int? Id { get; set; }
        public string? Label { get; set; }
        public string? FullAddress { get; set; }
        public double? Lat { get; set; }
        public double? Lng { get; set; }
        public string? Unit { get; set; }
        public string? Name { get; set; }
        public string? Phone { get; set; }
        public string? Note { get; set; }
    }

    public class DeleteAddressRequest
    {
        public int Id { get; set; }
    }

    public class SetDefaultAddressRequest
    {
        public int Id { get; set; }
    }
}