using Microsoft.AspNetCore.Mvc;
using SwiftX.Models;
using System.Diagnostics;


namespace SwiftX.Controllers
{
    public class SignUpController : Controller
    {
        
        public IActionResult Merchant()
        {
            return View();
        }
        public IActionResult Rider()
        {
            return View();
        }
        [HttpPost]
        public IActionResult SignUpRider(RiderModel rider)
        {
            Debug.WriteLine("System is running");
            
            return RedirectToAction("index", "Home");
        }

        [HttpPost]
        public IActionResult SignUpMerchant(MerchantModel merchant)
        {
            Debug.WriteLine("Merchant System is running");
            
            return RedirectToAction("index", "Home");
        }
    }
}
