
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
            return View();
        }
        public IActionResult MerchantApplications()
        {
            return View();
        }

    }
}
