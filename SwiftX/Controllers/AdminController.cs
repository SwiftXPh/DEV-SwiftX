
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

    }
}
