
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
            var riders = _db.Riders.Include(r => r.User).ToList();
            return View(riders);
        }
        public IActionResult RiderApplications()
        {
            return View();
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
