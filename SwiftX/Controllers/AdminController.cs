
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SwiftX.Models;

namespace SwiftX.Controllers
{
    public class AdminController : Controller
    {
        private readonly AppDbContext _db;

        public AdminController(AppDbContext db)
        {
            _db = db;
        }

        public IActionResult Index()
        {
            return View();
        }
        public IActionResult Dashboard()
        {
            ViewBag.PendingRiders = _db.Riders.Count(r => r.Status == "Pending");
            ViewBag.PendingMerchants = _db.Merchants.Count(m => m.Status == "Pending");
            ViewBag.ActiveRiders = _db.Riders.Count(r => r.Status == "Active");
            ViewBag.ActiveMerchants = _db.Merchants.Count(m => m.Status == "Active");
            ViewBag.RecentOrders = _db.Orders
                .Include(o => o.Customer)
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
            return View();
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
