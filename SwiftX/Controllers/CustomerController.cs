using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SwiftX.Models; // 🌟 

namespace SwiftX.Controllers { 

public class CustomerController : Controller
{
        public IActionResult UserLogin()
        {
            return View("Auth/UserLogin");
        }
        public IActionResult CustomerSignup()
        {
            return View("Auth/CustomerSignup");
        }
        public IActionResult CPPostOTP()
        {
            return View("Auth/CPPostOTP");
        }
        public IActionResult CustomerChangePass()
        {
            return View("Auth/CustomerChangePass");
        }
        public IActionResult ChangePassEnterEmail()
        {
            return View("Auth/ChangePassEnterEmail");
        }
        public IActionResult ChangePassVerifyEmail()
        {
            return View("Auth/ChangePassVerifyEmail");
        }

        public IActionResult CustomerHome()
        {
            var model = new CustomerHomeViewModel
            {
                // User data (loaded after login)
                FirstName = string.Empty,
                FullName = string.Empty,
                ProfileImage = string.Empty,

                // Application data
                Services = new List<ServiceViewModel>
        {
            new()
            {
                Name = "FoodX",
                Icon = "ph ph-hamburger",
                Enabled = true
            },
            new()
            {
                Name = "ItemX",
                Icon = "ph ph-package",
                Enabled = true
            },
            new()
            {
                Name = "MotoX",
                Icon = "ph ph-motorcycle",
                Enabled = false
            },
            new()
            {
                Name = "CarX",
                Icon = "ph ph-car",
                Enabled = false
            }
        },

                // Empty until backend/database is connected
                Featured = new List<FeaturedBannerViewModel>(),
                ComingSoon = new List<FeaturedBannerViewModel>()
            };

            return View("Main/CustomerHome", model);
        }

        // 🌟 REVISED: Kailangan nitong magpasa ng List<MerchantViewModel> para sa binuo nating CSHTML loop
        public IActionResult CustomerFoodXHome()
        {
            // Sa produksyon, dito mo kukunin ang totoong data mula sa iyong DB Context
            // Halimbawa: var merchants = _context.Merchants.ToList();

            var mockMerchants = new List<MerchantViewModel>
            {
                new MerchantViewModel
                {
                    Id = 1,
                    Name = "Jollibee - Don Carlos",
                    ImageUrl = "https://via.placeholder.com/400x140",
                    RestaurantType = "Fast Food",
                    Rating = 4.7,
                    Distance = "1.2 km" // Gagamitin ng bagong dynamic distance implementation natin
                },
                new MerchantViewModel
                {
                    Id = 2,
                    Name = "McDonald's - Bukidnon Highway",
                    ImageUrl = "https://via.placeholder.com/400x140",
                    RestaurantType = "Burgers & Fries",
                    Rating = 4.5,
                    Distance = "2.5 km"
                },
                new MerchantViewModel
                {
                    Id = 3,
                    Name = "Chowking - Poblacion",
                    ImageUrl = "https://via.placeholder.com/400x140",
                    RestaurantType = "Chinese Fast Food",
                    Rating = 4.2,
                    Distance = "0.8 km"
                }
            };

            return View("FoodX/CustomerFoodXHome", mockMerchants);
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
            return View("Main/CustomerAccountInfo");
        }
        public IActionResult CustomerSecurity()
        {
            return View("Main/CustomerSecurity");
        }

        public IActionResult CustomerReviewAddress(string returnTo, int? addressId, string fullAddress)
        {
            ViewBag.ReturnTo = returnTo;
            return View("Main/CustomerReviewAddress");
        }

        public IActionResult CustomerOrderHistory()
        {
            return View("Main/CustomerOrderHistory");
        }

        public IActionResult CustomerSavedAddresses(string mode)
        {
            ViewBag.IsCheckoutMode = (mode == "checkout");
            return View("Main/CustomerSavedAddresses");
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