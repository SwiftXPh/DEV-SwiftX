
using System.Security.Claims;
using System.Security.Cryptography;
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
using Microsoft.Extensions.Configuration;

namespace SwiftX.Controllers
{
    [Authorize(AuthenticationSchemes = "AdminScheme", Roles = "Admin")]
    public class AdminController : Controller
    {
        private readonly AppDbContext _db;
        private readonly ISupabaseStorageService _storage;
        private readonly SupabaseOptions _supabase;
        private readonly IPasswordHasher<UserModel> _passwordHasher;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly GoogleMapsOptions _googleMaps;
        private readonly IAuditLogger _auditLogger;

        public AdminController(AppDbContext db, ISupabaseStorageService storage, IOptions<SupabaseOptions> supabase, IPasswordHasher<UserModel> passwordHasher, IHttpClientFactory httpClientFactory, IOptions<GoogleMapsOptions> googleMaps, IAuditLogger auditLogger)
        {
            _db = db;
            _storage = storage;
            _supabase = supabase.Value;
            _passwordHasher = passwordHasher;
            _httpClientFactory = httpClientFactory;
            _googleMaps = googleMaps.Value;
            _auditLogger = auditLogger;
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
        public async Task<IActionResult> Login(string username, string password, [FromServices] IConfiguration config, string? returnUrl = null)
        {
            var envUsername = config["AdminSeed:Username"];
            var envPassword = config["AdminSeed:Password"];

            // Verify against environment variables. If they aren't set, login fails.
            var ok = !string.IsNullOrWhiteSpace(envUsername) && 
                     !string.IsNullOrWhiteSpace(envPassword) &&
                     !string.IsNullOrWhiteSpace(username) &&
                     !string.IsNullOrWhiteSpace(password) &&
                     CryptographicOperations.FixedTimeEquals(
                         System.Text.Encoding.UTF8.GetBytes(username),
                         System.Text.Encoding.UTF8.GetBytes(envUsername)) &&
                     CryptographicOperations.FixedTimeEquals(
                         System.Text.Encoding.UTF8.GetBytes(password),
                         System.Text.Encoding.UTF8.GetBytes(envPassword));

            if (!ok)
            {
                _auditLogger.LogAuthEvent("ADMIN_LOGIN", null, username, HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown", false);
                ViewBag.LoginError = "Invalid username or password.";
                return View(nameof(Index));
            }

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, "env-admin"),
                new Claim(ClaimTypes.Name, username),
                new Claim(ClaimTypes.Role, "Admin")
            };
            var identity = new ClaimsIdentity(claims, "AdminScheme");
            await HttpContext.SignInAsync("AdminScheme", new ClaimsPrincipal(identity));

            _auditLogger.LogAuthEvent("ADMIN_LOGIN", null, username, HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown", true);

            if (!string.IsNullOrEmpty(returnUrl) && Url.IsLocalUrl(returnUrl))
                return Redirect(returnUrl);
            return RedirectToAction(nameof(Dashboard));
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Logout()
        {
            var username = User.FindFirstValue(ClaimTypes.Name);
            _auditLogger.LogAuthEvent("ADMIN_LOGOUT", null, username, HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown", true);
            
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
                _auditLogger.LogAdminAction("APPROVE_RIDER", User.Identity?.Name ?? "unknown", "Rider", id);
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
                _auditLogger.LogAdminAction("REJECT_RIDER", User.Identity?.Name ?? "unknown", "Rider", id);
            }
            return RedirectToAction("RiderApplications");
        }

        public IActionResult Merchant()
        {
            var merchants = _db.Merchants
                .Include(m => m.User)
                .Where(m => m.Status == "Active" || m.Status == "Inactive")
                .ToList();
            
            ViewBag.GoogleMapsApiKey = _googleMaps.ApiKey;
            
            return View(merchants);
        }

        public IActionResult ManualMerchants()
        {
            var stores = _db.Stores
                .Include(s => s.Merchant)
                .OrderByDescending(s => s.CreatedAt)
                .ToList();

            ViewBag.ApprovedMerchants = _db.Merchants
                .Where(m => m.Status == "Active")
                .OrderBy(m => m.BusinessName)
                .ToList();

            ViewBag.GoogleMapsApiKey = _googleMaps.ApiKey;
            return View("ManualMerchants", stores);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> AddMerchant(
            int? MerchantId,
            string BusinessName,
            string BusinessLocation,
            string BusinessCategory,
            double? Latitude,
            double? Longitude,
            IFormFile? BusinessLogo)
        {
            if (string.IsNullOrWhiteSpace(BusinessName) || string.IsNullOrWhiteSpace(BusinessLocation) || string.IsNullOrWhiteSpace(BusinessCategory))
            {
                TempData["Error"] = "Please fill in all required fields.";
                return RedirectToAction("ManualMerchants");
            }

            var store = new Store
            {
                MerchantId = MerchantId,
                BusinessName = BusinessName,
                BusinessAddress = BusinessLocation,
                Category = BusinessCategory,
                Latitude = Latitude,
                Longitude = Longitude,
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

            _auditLogger.LogAdminAction("ADD_STORE", User.Identity?.Name ?? "unknown", "Store", store.Id);

            TempData["Success"] = "Store successfully created! It is currently Unassigned.";
            return RedirectToAction("ManualMerchants");
        }

        [HttpGet]
        public async Task<IActionResult> PlacesAutocomplete(string input)
        {
            if (string.IsNullOrWhiteSpace(input) || string.IsNullOrWhiteSpace(_googleMaps.ApiKey))
                return Json(new { suggestions = Array.Empty<object>() });

            var client = _httpClientFactory.CreateClient("GoogleMaps");
            var requestBody = new
            {
                input = input,
                locationRestriction = new
                {
                    rectangle = new
                    {
                        low = new { latitude = 7.3912, longitude = 124.5126 },
                        high = new { latitude = 8.5615, longitude = 125.4660 }
                    }
                }
            };
            
            var request = new HttpRequestMessage(HttpMethod.Post, "https://places.googleapis.com/v1/places:autocomplete");
            request.Headers.Add("X-Goog-Api-Key", _googleMaps.ApiKey);
            request.Content = new StringContent(System.Text.Json.JsonSerializer.Serialize(requestBody), System.Text.Encoding.UTF8, "application/json");

            var response = await client.SendAsync(request);
            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                return Content(content, "application/json");
            }
            
            return Json(new { suggestions = Array.Empty<object>() });
        }

        [HttpGet]
        public async Task<IActionResult> PlaceDetails(string placeId)
        {
            if (string.IsNullOrWhiteSpace(placeId) || string.IsNullOrWhiteSpace(_googleMaps.ApiKey))
                return BadRequest();

            var client = _httpClientFactory.CreateClient("GoogleMaps");
            var request = new HttpRequestMessage(HttpMethod.Get, $"https://places.googleapis.com/v1/places/{placeId}?fields=formattedAddress,location");
            request.Headers.Add("X-Goog-Api-Key", _googleMaps.ApiKey);

            var response = await client.SendAsync(request);
            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                return Content(content, "application/json");
            }

            return BadRequest();
        }

        public IActionResult MenuInfo(int id)
        {
            var store = _db.Stores
                .Include(s => s.Products)
                .FirstOrDefault(s => s.Id == id);

            if (store == null) return RedirectToAction("ManualMerchants");

            return View(store);
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
                _auditLogger.LogAdminAction("APPROVE_MERCHANT", User.Identity?.Name ?? "unknown", "Merchant", id);
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
                _auditLogger.LogAdminAction("REJECT_MERCHANT", User.Identity?.Name ?? "unknown", "Merchant", id);
            }
            return RedirectToAction("MerchantApplications");
        }

        [HttpGet]
        public IActionResult GetRiderJson(int id)
        {
            var rider = _db.Riders.Include(r => r.User).Include(r => r.Documents).FirstOrDefault(r => r.Id == id);
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
                licensePath = rider.Documents.FirstOrDefault(d => d.DocumentType == "License")?.FilePath,
                idPath = rider.Documents.FirstOrDefault(d => d.DocumentType == "ID")?.FilePath,
                orcrPath = rider.Documents.FirstOrDefault(d => d.DocumentType == "ORCR")?.FilePath,
                agreementPath = rider.Documents.FirstOrDefault(d => d.DocumentType == "Agreement")?.FilePath,
                frontVehiclePath = rider.Documents.FirstOrDefault(d => d.DocumentType == "FrontVehicle")?.FilePath,
                sideVehiclePath = rider.Documents.FirstOrDefault(d => d.DocumentType == "SideVehicle")?.FilePath,
                // Document review statuses
                licenseStatus = rider.Documents.FirstOrDefault(d => d.DocumentType == "License")?.Status,
                idStatus = rider.Documents.FirstOrDefault(d => d.DocumentType == "ID")?.Status,
                orcrStatus = rider.Documents.FirstOrDefault(d => d.DocumentType == "ORCR")?.Status,
                agreementStatus = rider.Documents.FirstOrDefault(d => d.DocumentType == "Agreement")?.Status,
                frontVehicleStatus = rider.Documents.FirstOrDefault(d => d.DocumentType == "FrontVehicle")?.Status,
                sideVehicleStatus = rider.Documents.FirstOrDefault(d => d.DocumentType == "SideVehicle")?.Status
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
                _auditLogger.LogAdminAction("UPDATE_RIDER", User.Identity?.Name ?? "unknown", "Rider", Id);
            }
            return RedirectToAction("Rider");
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public IActionResult UpdateDocStatus(int id, string docType, string status)
        {
            var rider = _db.Riders.Include(r => r.Documents).FirstOrDefault(r => r.Id == id);
            if (rider == null) return NotFound();

            string mappedDocType = docType switch
            {
                "license" => "License",
                "id" => "ID",
                "orcr" => "ORCR",
                "agreement" => "Agreement",
                "front" => "FrontVehicle",
                "side" => "SideVehicle",
                _ => null
            };
            if (mappedDocType == null) return BadRequest();

            var doc = rider.Documents.FirstOrDefault(d => d.DocumentType == mappedDocType);
            if (doc != null) { doc.Status = status; }

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

        [HttpGet]
        public async Task<IActionResult> GetStoreJson(int id)
        {
            var store = _db.Stores.Include(s => s.Merchant).FirstOrDefault(s => s.Id == id);
            if (store == null) return NotFound();

            string? logoUrl = null;
            if (!string.IsNullOrEmpty(store.LogoPath))
                logoUrl = await _storage.CreateSignedUrlAsync(_supabase.MerchantBucket, store.LogoPath);

            string? coverUrl = null;
            if (!string.IsNullOrEmpty(store.CoverImagePath))
                coverUrl = await _storage.CreateSignedUrlAsync(_supabase.MerchantBucket, store.CoverImagePath);

            return Json(new
            {
                id = store.Id,
                storeId = $"STR-{store.Id:D3}",
                merchantId = store.MerchantId,
                merchantName = store.Merchant?.BusinessName ?? "Admin Managed",
                businessName = store.BusinessName,
                businessAddress = store.BusinessAddress,
                category = store.Category ?? "—",
                status = store.Status,
                openingTime = store.OpeningTime ?? "—",
                closingTime = store.ClosingTime ?? "—",
                latitude = store.Latitude,
                longitude = store.Longitude,
                logoUrl = logoUrl,
                coverUrl = coverUrl,
                createdAt = store.CreatedAt.ToString("MMMM dd, yyyy"),
                productCount = _db.Products.Count(p => p.StoreId == store.Id)
            });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> UpdateStore(int Id, int? MerchantId, string BusinessName, string BusinessAddress, string? Category, string? OpeningTime, string? ClosingTime, double? Latitude, double? Longitude, IFormFile? LogoFile, IFormFile? CoverFile)
        {
            var store = _db.Stores.Find(Id);
            if (store == null) return NotFound();

            store.MerchantId = MerchantId;
            store.BusinessName = BusinessName;
            store.BusinessAddress = BusinessAddress;
            store.Category = Category;
            store.OpeningTime = OpeningTime;
            store.ClosingTime = ClosingTime;
            store.Latitude = Latitude;
            store.Longitude = Longitude;

            if (LogoFile != null && LogoFile.Length > 0)
            {
                if (!string.IsNullOrEmpty(store.LogoPath))
                    try { await _storage.DeleteAsync(_supabase.MerchantBucket, store.LogoPath); } catch { }

                var logoPath = $"stores/{store.Id}/logo/{Guid.NewGuid()}{Path.GetExtension(LogoFile.FileName)}";
                store.LogoPath = await _storage.UploadAsync(LogoFile, _supabase.MerchantBucket, logoPath);
            }

            if (CoverFile != null && CoverFile.Length > 0)
            {
                if (!string.IsNullOrEmpty(store.CoverImagePath))
                    try { await _storage.DeleteAsync(_supabase.MerchantBucket, store.CoverImagePath); } catch { }

                var coverPath = $"stores/{store.Id}/cover/{Guid.NewGuid()}{Path.GetExtension(CoverFile.FileName)}";
                store.CoverImagePath = await _storage.UploadAsync(CoverFile, _supabase.MerchantBucket, coverPath);
            }

            await _db.SaveChangesAsync();
            _auditLogger.LogAdminAction("UPDATE_STORE", User.Identity?.Name ?? "unknown", "Store", Id);
            TempData["Success"] = "Store updated successfully.";
            return RedirectToAction("ManualMerchants");
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteStore(int id)
        {
            var store = _db.Stores.Include(s => s.Products).FirstOrDefault(s => s.Id == id);
            if (store == null) return NotFound();

            foreach (var product in store.Products)
            {
                if (!string.IsNullOrEmpty(product.ImagePath))
                    try { await _storage.DeleteAsync(_supabase.MerchantBucket, product.ImagePath); } catch { }
            }

            if (!string.IsNullOrEmpty(store.LogoPath))
                try { await _storage.DeleteAsync(_supabase.MerchantBucket, store.LogoPath); } catch { }
            if (!string.IsNullOrEmpty(store.CoverImagePath))
                try { await _storage.DeleteAsync(_supabase.MerchantBucket, store.CoverImagePath); } catch { }

            _db.Stores.Remove(store);
            await _db.SaveChangesAsync();

            _auditLogger.LogAdminAction("DELETE_STORE", User.Identity?.Name ?? "unknown", "Store", id);

            TempData["Success"] = "Store deleted successfully.";
            return RedirectToAction("ManualMerchants");
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public IActionResult ToggleStoreStatus(int id)
        {
            var store = _db.Stores.Find(id);
            if (store == null) return NotFound();

            store.Status = store.Status == "Active" ? "Inactive" : "Active";
            _db.SaveChanges();

            return RedirectToAction("ManualMerchants");
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> AddProduct(int StoreId, string Name, string? Description, decimal Price, string? Category, IFormFile? Image)
        {
            var store = _db.Stores.Find(StoreId);
            if (store == null) return NotFound();

            var product = new Product
            {
                StoreId = StoreId,
                Name = Name,
                Description = Description,
                Price = Price,
                Category = Category,
                IsAvailable = true
            };

            if (Image != null && Image.Length > 0)
            {
                var objectPath = $"stores/{StoreId}/products/{Guid.NewGuid()}{Path.GetExtension(Image.FileName)}";
                product.ImagePath = await _storage.UploadAsync(Image, _supabase.MerchantBucket, objectPath);
            }

            _db.Products.Add(product);
            await _db.SaveChangesAsync();

            TempData["Success"] = "Product added successfully.";
            return RedirectToAction("MenuInfo", new { id = StoreId });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> UpdateProduct(int Id, int StoreId, string Name, string? Description, decimal Price, string? Category, bool IsAvailable, IFormFile? Image)
        {
            var product = _db.Products.Find(Id);
            if (product == null) return NotFound();

            product.Name = Name;
            product.Description = Description;
            product.Price = Price;
            product.Category = Category;
            product.IsAvailable = IsAvailable;

            if (Image != null && Image.Length > 0)
            {
                if (!string.IsNullOrEmpty(product.ImagePath))
                    try { await _storage.DeleteAsync(_supabase.MerchantBucket, product.ImagePath); } catch { }

                var objectPath = $"stores/{StoreId}/products/{Guid.NewGuid()}{Path.GetExtension(Image.FileName)}";
                product.ImagePath = await _storage.UploadAsync(Image, _supabase.MerchantBucket, objectPath);
            }

            await _db.SaveChangesAsync();
            TempData["Success"] = "Product updated successfully.";
            return RedirectToAction("MenuInfo", new { id = StoreId });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteProduct(int id, int storeId)
        {
            var product = _db.Products.Find(id);
            if (product == null) return NotFound();

            if (!string.IsNullOrEmpty(product.ImagePath))
                try { await _storage.DeleteAsync(_supabase.MerchantBucket, product.ImagePath); } catch { }

            _db.Products.Remove(product);
            await _db.SaveChangesAsync();

            TempData["Success"] = "Product deleted successfully.";
            return RedirectToAction("MenuInfo", new { id = storeId });
        }

        [HttpGet]
        public async Task<IActionResult> GetProductJson(int id)
        {
            var product = _db.Products.Find(id);
            if (product == null) return NotFound();

            string? imageUrl = null;
            if (!string.IsNullOrEmpty(product.ImagePath))
                imageUrl = await _storage.CreateSignedUrlAsync(_supabase.MerchantBucket, product.ImagePath);

            return Json(new
            {
                id = product.Id,
                storeId = product.StoreId,
                name = product.Name,
                description = product.Description,
                price = product.Price,
                category = product.Category,
                isAvailable = product.IsAvailable,
                imageUrl = imageUrl
            });
        }

    }
}
