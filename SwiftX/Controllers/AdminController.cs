
using Microsoft.AspNetCore.Mvc;
using SwiftX.Models;

namespace SwiftX.Controllers
{
    public class AdminController : Controller
    {
        public List<UserModel> userModels = new List<UserModel>();
        public List<RiderModel> riderModels = new List<RiderModel>();
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
            return View();
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
