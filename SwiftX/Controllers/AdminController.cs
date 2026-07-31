
using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using SwiftX.Models;
using SwiftX.Services;

namespace SwiftX.Controllers
{
    [Authorize(AuthenticationSchemes = "AdminScheme", Roles = "Admin")]
    public class AdminController : Controller
    {
        private readonly AppDbContext _db;
        private readonly ISupabaseStorageService _storage;
        private readonly SupabaseOptions _supabase;
        private readonly IPasswordHasher<UserModel> _passwordHasher;

        public AdminController(AppDbContext db, ISupabaseStorageService storage, IOptions<SupabaseOptions> supabase, IPasswordHasher<UserModel> passwordHasher)
        {
            _db = db;
            _storage = storage;
            _supabase = supabase.Value;
            _passwordHasher = passwordHasher;
        }

        /// <summary>
        /// Issues a short-lived signed URL for a document stored in a private Supabase bucket.
        /// The browser never sees the service key — it only requests a URL by bucket + object path.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> DocumentUrl(string bucket, string path)
        {
            if (string.IsNullOrWhiteSpace(path))
                return BadRequest();

            var bucketName = bucket switch
            {
                "rider" => _supabase.RiderBucket,
                "merchant" => _supabase.MerchantBucket,
                _ => null
            };
            if (bucketName == null)
                return BadRequest();

            var url = await _storage.CreateSignedUrlAsync(bucketName, path);
            if (url == null)
                return NotFound();

            return Json(new { url });
        }

        [AllowAnonymous]
        public IActionResult Index()
        {
            // Already signed in → skip the login page.
            if (User.Identity?.IsAuthenticated == true)
                return RedirectToAction(nameof(Dashboard));
            return View();
        }

        [HttpPost]
        [AllowAnonymous]
        [EnableRateLimiting("login")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Login(string username, string password, string? returnUrl = null)
        {
            var user = await _db.Users.FirstOrDefaultAsync(u => u.Username == username && u.Role == "Admin");

            // Verify against the hashed password; uniform failure message avoids leaking which part was wrong.
            var ok = user != null &&
                     _passwordHasher.VerifyHashedPassword(user, user.Password, password) != PasswordVerificationResult.Failed;

            if (!ok)
            {
                ViewBag.LoginError = "Invalid username or password.";
                return View(nameof(Index));
            }

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user!.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Role, "Admin")
            };
            var identity = new ClaimsIdentity(claims, "AdminScheme");
            await HttpContext.SignInAsync("AdminScheme", new ClaimsPrincipal(identity));

            if (!string.IsNullOrEmpty(returnUrl) && Url.IsLocalUrl(returnUrl))
                return Redirect(returnUrl);
            return RedirectToAction(nameof(Dashboard));
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Logout()
        {
            await HttpContext.SignOutAsync("AdminScheme");
            return RedirectToAction(nameof(Index));
        }

        public IActionResult Dashboard()
        {
            ViewBag.PendingRiders = _db.Riders.Count(r => r.Status == "Pending");
            ViewBag.PendingMerchants = _db.Merchants.Count(m => m.Status == "Pending");
            ViewBag.ActiveRiders = _db.Riders.Count(r => r.Status == "Active");
            ViewBag.ActiveMerchants = _db.Merchants.Count(m => m.Status == "Active");
            ViewBag.TotalOrders = _db.Orders.Count();

            // Revenue for the current month from delivered orders. Adjust this definition
            // (e.g. delivery fees or platform commission only) once billing is finalized.
            var monthStart = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            ViewBag.MonthlyRevenue = _db.Orders
                .Where(o => o.Status == "Delivered" && o.CreatedAt >= monthStart)
                .Sum(o => (decimal?)o.TotalAmount) ?? 0m;

            ViewBag.RecentOrders = _db.Orders
                .Include(o => o.Customer).ThenInclude(c => c.User)
                .Include(o => o.Merchant)
                .OrderByDescending(o => o.CreatedAt)
                .Take(5)
                .ToList();

            // Build recent activity from riders and merchants
            var activities = new List<dynamic>();

            var recentRiders = _db.Riders.Include(r => r.User)
                .OrderByDescending(r => r.CreatedAt).Take(10).ToList();
            foreach (var r in recentRiders)
            {
                var name = $"{r.User.FirstName} {r.User.LastName}";
                if (r.Status == "Pending")
                    activities.Add(new { Type = "rider", Icon = "ph-motorcycle", DotClass = "dash-activity-dot--rider", Name = name, Text = "submitted a rider application.", Date = r.CreatedAt });
                else if (r.Status == "Active")
                    activities.Add(new { Type = "rider", Icon = "ph-check-circle", DotClass = "dash-activity-dot--rider", Name = name, Text = "was approved as a rider.", Date = r.CreatedAt });
                else if (r.Status == "Rejected")
                    activities.Add(new { Type = "rider", Icon = "ph-x-circle", DotClass = "dash-activity-dot--system", Name = name, Text = "rider application was rejected.", Date = r.CreatedAt });
            }

            var recentMerchants = _db.Merchants.Include(m => m.User)
                .OrderByDescending(m => m.CreatedAt).Take(10).ToList();
            foreach (var m in recentMerchants)
            {
                var name = m.BusinessName;
                if (m.Status == "Pending")
                    activities.Add(new { Type = "merchant", Icon = "ph-storefront", DotClass = "dash-activity-dot--merchant", Name = name, Text = "submitted a merchant application.", Date = m.CreatedAt });
                else if (m.Status == "Active")
                    activities.Add(new { Type = "merchant", Icon = "ph-check-circle", DotClass = "dash-activity-dot--merchant", Name = name, Text = "was approved as a merchant partner.", Date = m.CreatedAt });
                else if (m.Status == "Rejected")
                    activities.Add(new { Type = "merchant", Icon = "ph-x-circle", DotClass = "dash-activity-dot--system", Name = name, Text = "merchant application was rejected.", Date = m.CreatedAt });
            }

            ViewBag.RecentActivities = activities
                .OrderByDescending(a => (DateTime)a.Date)
                .Take(5)
                .ToList();

            return View();
        }
        public IActionResult Orders()
        {
            // Data-driven order list. Empty until the ordering flow is integrated.
            var orders = _db.Orders
                .Include(o => o.Customer).ThenInclude(c => c.User)
                .Include(o => o.Merchant)
                .Include(o => o.Rider).ThenInclude(r => r.User)
                .OrderByDescending(o => o.CreatedAt)
                .ToList();

            return View(orders);
        }
        public IActionResult Rider()
        {
            // Only show approved riders (Active/Inactive) — not Pending or Rejected
            var riders = _db.Riders
                .Include(r => r.User)
                .Where(r => r.Status == "Active" || r.Status == "Inactive")
                .ToList();

            // Pending rider applications for the ops sidebar
            var pendingApplications = _db.Riders
                .Include(r => r.User)
                .Where(r => r.Status == "Pending")
                .OrderByDescending(r => r.CreatedAt)
                .ToList();

            ViewBag.PendingApplicationCount = pendingApplications.Count;
            ViewBag.PendingApplications = pendingApplications.Take(5).ToList();

            return View(riders);
        }
        public IActionResult RiderApplications()
        {
            var riders = _db.Riders.Include(r => r.User).ToList();
            return View(riders);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public IActionResult ApproveRider(int id)
        {
            var rider = _db.Riders.Find(id);
            if (rider != null)
            {
                rider.Status = "Active";
                _db.SaveChanges();
            }
            return RedirectToAction("RiderApplications");
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public IActionResult RejectRider(int id)
        {
            var rider = _db.Riders.Find(id);
            if (rider != null)
            {
                rider.Status = "Rejected";
                _db.SaveChanges();
            }
            return RedirectToAction("RiderApplications");
        }

        public IActionResult Merchant()
        {
            var merchants = _db.Merchants
                .Include(m => m.User)
                .Where(m => m.Status == "Active" || m.Status == "Inactive")
                .ToList();
            return View(merchants);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> AddMerchant(
            string BusinessName,
            string BusinessLocation,
            string BusinessCategory,
            IFormFile? BusinessLogo)
        {
            if (string.IsNullOrWhiteSpace(BusinessName) || string.IsNullOrWhiteSpace(BusinessLocation) || string.IsNullOrWhiteSpace(BusinessCategory))
            {
                TempData["Error"] = "Please fill in all required fields.";
                return RedirectToAction("Merchant");
            }

            var store = new Store
            {
                BusinessName = BusinessName,
                BusinessAddress = BusinessLocation,
                Category = BusinessCategory,
                Status = "Unassigned"
            };

            if (BusinessLogo != null && BusinessLogo.Length > 0)
            {
                var fileName = $"{Guid.NewGuid()}_{BusinessLogo.FileName}";
                var path = await _storage.UploadAsync(BusinessLogo, _supabase.MerchantBucket, fileName);
                store.LogoPath = path;
            }

            _db.Stores.Add(store);
            await _db.SaveChangesAsync();

            TempData["Success"] = "Store successfully created! It is currently Unassigned.";
            return RedirectToAction("Merchant");
        }
        public IActionResult MenuInfo()
        {
            return View();
        }
        public IActionResult MerchantApplications()
        {
            var merchants = _db.Merchants.Include(m => m.User).ToList();
            return View(merchants);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public IActionResult ApproveMerchant(int id)
        {
            var merchant = _db.Merchants.Find(id);
            if (merchant != null)
            {
                merchant.Status = "Active";
                _db.SaveChanges();
            }
            return RedirectToAction("MerchantApplications");
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public IActionResult RejectMerchant(int id)
        {
            var merchant = _db.Merchants.Find(id);
            if (merchant != null)
            {
                merchant.Status = "Rejected";
                _db.SaveChanges();
            }
            return RedirectToAction("MerchantApplications");
        }

        [HttpGet]
        public IActionResult GetRiderJson(int id)
        {
            var rider = _db.Riders.Include(r => r.User).FirstOrDefault(r => r.Id == id);
            if (rider == null) return NotFound();

            return Json(new
            {
                id = rider.Id,
                riderId = $"Rider-{rider.Id:D3}",
                fullName = $"{rider.User.FirstName} {rider.User.LastName}",
                status = rider.Status,
                phone = rider.User.Contact,
                email = rider.User.Email,
                address = rider.User.Address,
                plateNumber = rider.PlateNumber ?? "—",
                gcContact = rider.GCContact,
                createdAt = rider.CreatedAt.ToString("MMMM dd, yyyy"),
                licensePath = rider.LicensePath,
                idPath = rider.IDPath,
                orcrPath = rider.ORCRPath,
                agreementPath = rider.AgreementPath,
                frontVehiclePath = rider.FrontVehiclePath,
                sideVehiclePath = rider.SideVehiclePath,
                // Document review statuses
                licenseStatus = rider.LicenseStatus,
                idStatus = rider.IDStatus,
                orcrStatus = rider.ORCRStatus,
                agreementStatus = rider.AgreementStatus,
                frontVehicleStatus = rider.FrontVehicleStatus,
                sideVehicleStatus = rider.SideVehicleStatus
            });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public IActionResult UpdateRider(int Id, string FirstName, string LastName, string Phone, string Email, string Address, string PlateNumber, string GCContact, string Status)
        {
            var rider = _db.Riders.Include(r => r.User).FirstOrDefault(r => r.Id == Id);
            if (rider != null)
            {
                // Update user fields
                rider.User.FirstName = FirstName;
                rider.User.LastName = LastName;
                rider.User.Contact = Phone;
                rider.User.Email = Email;
                rider.User.Address = Address;

                // Update rider fields
                rider.PlateNumber = PlateNumber;
                rider.GCContact = GCContact;
                rider.Status = Status;

                _db.SaveChanges();
            }
            return RedirectToAction("Rider");
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public IActionResult UpdateDocStatus(int id, string docType, string status)
        {
            var rider = _db.Riders.Find(id);
            if (rider == null) return NotFound();

            switch (docType)
            {
                case "license": rider.LicenseStatus = status; break;
                case "id": rider.IDStatus = status; break;
                case "orcr": rider.ORCRStatus = status; break;
                case "agreement": rider.AgreementStatus = status; break;
                case "front": rider.FrontVehicleStatus = status; break;
                case "side": rider.SideVehicleStatus = status; break;
                default: return BadRequest();
            }

            _db.SaveChanges();
            return Ok();
        }

        [HttpGet]
        public IActionResult GetMerchantJson(int id)
        {
            var merchant = _db.Merchants.Include(m => m.User).FirstOrDefault(m => m.Id == id);
            if (merchant == null) return NotFound();

            return Json(new
            {
                id = merchant.Id,
                merchantId = $"MAPP-{merchant.Id:D3}",
                businessName = merchant.BusinessName,
                ownerName = $"{merchant.OwnerFirstName} {merchant.OwnerLastName}",
                status = merchant.Status,
                category = merchant.Category ?? "—",
                businessContact = merchant.BusinessContact,
                businessEmail = merchant.BusinessEmail,
                businessAddress = merchant.BusinessAddress,
                gcContact = merchant.GCContact,
                createdAt = merchant.CreatedAt.ToString("MMMM dd, yyyy"),
                birFormPath = merchant.BIRFormPath,
                dtiCertificatePath = merchant.DTICertificatePath,
                barangayClearancePath = merchant.BarangayClearancePath,
                // Document review statuses
                birFormStatus = merchant.BIRFormStatus,
                dtiCertificateStatus = merchant.DTICertificateStatus,
                barangayClearanceStatus = merchant.BarangayClearanceStatus
            });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public IActionResult UpdateMerchantDocStatus(int id, string docType, string status)
        {
            var merchant = _db.Merchants.Find(id);
            if (merchant == null) return NotFound();

            switch (docType)
            {
                case "bir": merchant.BIRFormStatus = status; break;
                case "dti": merchant.DTICertificateStatus = status; break;
                case "barangay": merchant.BarangayClearanceStatus = status; break;
                default: return BadRequest();
            }

            _db.SaveChanges();
            return Ok();
        }

    }
}
