using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SwiftX.Models;

namespace SwiftX.Controllers
{

    public class CustomerController : Controller
    {

        // AUTH LEVEL
        public IActionResult UserLogin()
        {
            return View("Auth/UserLogin");
        }
        public IActionResult CustomerSignup()
        {
            return View("Auth/CustomerSignup");
        }
        public IActionResult ForgotPasswordEmail()
        {
            return View("Auth/ForgotPasswordEmail");
        }
        public IActionResult ForgotPasswordOTP()
        {
            return View("Auth/ForgotPasswordOTP");
        }
        public IActionResult ChangePassword()
        {
            return View("Auth/ChangePassword");
        }

        // CUSTOMER MAIN
        public IActionResult CustomerHome()
        {
            return View("Main/CustomerHome");
        }

        public IActionResult CustomerOrderHistory()
        {
            return View("Main/CustomerOrderHistory");
        }
        

        // FOODX
        public IActionResult FoodXBrowse()
        {
            return View("Main/FoodXBrowse");
        }
        public IActionResult FoodXMenu()
        {
            return View("Main/FoodXMenu");
        }
        public IActionResult FoodXCart()
        {
            return View("Main/FoodXCart");
        }
        public IActionResult FoodXCheckOut()
        {
            return View("Main/FoodXCheckOut");
        }
        public IActionResult FoodXPayment()
        {
            return View("Main/FoodXPayment");
        }
        public IActionResult FoodXTracking()
        {
            return View("Main/FoodXTracking");
        }



        // ACCOUNT SETTINGS

        public IActionResult CustomerAccountInfo()
        {
            return View("Main/CustomerAccountInfo");
        }
        public IActionResult CustomerSecurity()
        {
            return View("Main/Settings/CustomerSecurity");
        }


        public IActionResult CustomerReviewAddress()
        {
            return View("Main/Settings/CustomerReviewAddress");

        }
        public IActionResult CustomerSavedAddresses()
        {
            return View("Main/Settings/CustomerSavedAddresses");
        }






    }
}