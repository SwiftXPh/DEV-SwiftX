using Microsoft.AspNetCore.Mvc;
using SwiftX.Models;
using System.Diagnostics;


namespace SwiftX.Controllers
{
    public class SignUpController : Controller
    {
        private readonly AppDbContext _db;
        private readonly IWebHostEnvironment _env;

        public SignUpController(AppDbContext db, IWebHostEnvironment env)
        {
            _db = db;
            _env = env;
        }

        public IActionResult Merchant()
        {
            return View();
        }
        public IActionResult Rider()
        {
            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> SignUpRider(RiderModel rider)
        {
            Debug.WriteLine("Rider System is running");

            // 1. Save the user first to get the UserId
            var user = rider.User;
            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            // 2. Save uploaded files to wwwroot/uploads/riders/{userId}/
            var uploadsFolder = Path.Combine(_env.WebRootPath, "uploads", "riders", user.Id.ToString());
            Directory.CreateDirectory(uploadsFolder);

            // 3. Map form files to entity paths
            var riderEntity = new Rider
            {
                UserId = user.Id,
                LicensePath = await SaveFile(rider.License, uploadsFolder),
                IDPath = await SaveFile(rider.ID, uploadsFolder),
                ORCRPath = await SaveFile(rider.ORCR, uploadsFolder),
                AgreementPath = await SaveFile(rider.Agreement, uploadsFolder),
                FrontVehiclePath = await SaveFile(rider.Front_Vehicle, uploadsFolder),
                SideVehiclePath = await SaveFile(rider.Side_Vehicle, uploadsFolder),
                GCContact = rider.GCContact
            };

            // 4. Save rider entity to database
            _db.Riders.Add(riderEntity);
            await _db.SaveChangesAsync();

            return RedirectToAction("Index", "Home");
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> SignUpMerchant(MerchantModel merchant)
        {
            Debug.WriteLine("Merchant System is running");

            // 1. Save the user first to get the UserId
            var user = merchant.User;
            // Populate User fields from merchant form data (form doesn't bind these directly)
            user.FirstName = merchant.OwnerFirstName;
            user.LastName = merchant.OwnerLastName;
            user.Contact = merchant.BusinessContact;
            user.Address = merchant.BusinessAddress;
            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            // 2. Save uploaded files to wwwroot/uploads/merchants/{userId}/
            var uploadsFolder = Path.Combine(_env.WebRootPath, "uploads", "merchants", user.Id.ToString());
            Directory.CreateDirectory(uploadsFolder);

            // 3. Map form files to entity paths
            var merchantEntity = new Merchant
            {
                UserId = user.Id,
                BusinessName = merchant.BusinessName,
                OwnerFirstName = merchant.OwnerFirstName,
                OwnerLastName = merchant.OwnerLastName,
                BusinessAddress = merchant.BusinessAddress,
                BusinessContact = merchant.BusinessContact,
                BusinessEmail = merchant.BusinessEmail,
                BIRFormPath = await SaveFile(merchant.BIRForm, uploadsFolder),
                DTICertificatePath = await SaveFile(merchant.DTICertificate, uploadsFolder),
                BarangayClearancePath = await SaveFile(merchant.BarangayClearance, uploadsFolder),
                GCContact = merchant.GCContact
            };

            // 4. Save merchant entity to database
            _db.Merchants.Add(merchantEntity);
            await _db.SaveChangesAsync();

            return RedirectToAction("Index", "Home");
        }

        /// <summary>
        /// Saves an uploaded file to the specified folder and returns the relative path.
        /// </summary>
        private async Task<string> SaveFile(IFormFile file, string folder)
        {
            if (file == null || file.Length == 0)
                return string.Empty;

            // Create a unique filename to avoid collisions
            var fileName = Guid.NewGuid().ToString() + Path.GetExtension(file.FileName);
            var filePath = Path.Combine(folder, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Return a relative web path for serving the file later
            var relativePath = filePath.Replace(_env.WebRootPath, "").Replace("\\", "/");
            return relativePath;
        }
    }
}
