using Microsoft.AspNetCore.Mvc;

namespace SwiftX.Controllers
{
    public class CustomerController : Controller
    {
        public IActionResult UserLogin()
        {
            return View("CustomerAuth/UserLogin");
        }
        public IActionResult CustomerSignup()
        {
            return View("CustomerAuth/CustomerSignup");
        }
        public IActionResult CPPostOTP()
        {
            return View("CustomerAuth/CPPostOTP");
        }
        public IActionResult CustomerChangePass()
        {
            return View("CustomerAuth/CustomerChangePass");
        }
        public IActionResult ChangePassEnterEmail()
        {
            return View("CustomerAuth/ChangePassEnterEmail");
        }
        public IActionResult ChangePassVerifyEmail()
        {
            return View("CustomerAuth/ChangePassVerifyEmail");
        }


        public IActionResult CustomerHome()
        {
            return View("CustomerHome/CustomerHome");
        }



        public IActionResult CustomerFoodXHome()
        {
            return View("FoodX/CustomerFoodXHome");
        }
        public IActionResult FoodXRestaurant()
        {
            return View("FoodX/FoodXRestaurant");
        }



        public IActionResult CustomerItemXHome()
        {
            return View("ItemX/CustomerItemXHome");
        }
        public IActionResult ItemXPickUp()
        {
            return View("ItemX/ItemXPickUp");
        }
        public IActionResult ItemXDropOff()
        {
            return View("ItemX/ItemXDropOff");
        }
        public IActionResult ItemXReviewOrder()
        {
            return View("ItemX/ItemXReviewOrder");
        }
        public IActionResult ItemXCheckOut()
        {
            return View("ItemX/ItemXCheckOut");
        }
        public IActionResult ItemXOrder()
        {
            return View("ItemX/ItemXOrder");
        }



        public IActionResult CustomerAccountInfo()
        {
            return View("CustomerHome/CustomerAccountInfo");
        }
        public IActionResult CustomerSecurity()
        {
            return View("CustomerHome/CustomerSecurity");
        }

        // 🎯 REVISED: Captures 'returnTo' flow tracking parameter from query queries
        public IActionResult CustomerReviewAddress(string returnTo, int? addressId, string fullAddress)
        {
            ViewBag.ReturnTo = returnTo;
            return View("CustomerHome/CustomerReviewAddress");
        }

        public IActionResult CustomerOrderHistory()
        {
            return View("CustomerHome/CustomerOrderHistory");
        }

        // 🎯 REVISED: Explicitly maps the incoming 'mode' string into ViewBag context
        public IActionResult CustomerSavedAddresses(string mode)
        {
            ViewBag.IsCheckoutMode = (mode == "checkout");
            return View("CustomerHome/CustomerSavedAddresses");
        }

        public IActionResult CustomerFoodXCart()
        {
            return View("FoodX/CustomerFoodXCart");
        }
        public IActionResult FoodXCheckOut()
        {
            return View("FoodX/FoodXCheckOut");
        }
        public IActionResult FoodXPaymentAndAddress()
        {
            return View("FoodX/FoodXPaymentAndAddress");
        }
        public IActionResult FoodXTracking()
        {
            return View("FoodX/FoodXTracking");
        }
    }
}