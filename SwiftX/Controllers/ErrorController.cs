using Microsoft.AspNetCore.Mvc;

namespace SwiftX.Controllers
{
    public class ErrorController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }

        /// <summary>
        /// Entry point for UseStatusCodePagesWithReExecute — picks the branded view by
        /// status code and preserves the original status code on the response.
        /// </summary>
        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Status(int code)
        {
            Response.StatusCode = code;
            ViewBag.StatusCode = code;
            return View(code >= 500 ? "Error5xx" : "Error4xx");
        }

        public IActionResult Error4xx()
            {
                return View();
            }
        public IActionResult Error5xx()
        {
            return View();
        }
        public IActionResult Maintenance()
        {
            return View();
        }
    }
}
