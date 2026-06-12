using Microsoft.AspNetCore.Mvc;

namespace SwiftX.Controllers
{
    public class CustomerController : Controller
    {
        public IActionResult UserLogin()
        {
            return View();
        }
        public IActionResult CustomerSignup()
        {
            return View();
        }
    }
}
