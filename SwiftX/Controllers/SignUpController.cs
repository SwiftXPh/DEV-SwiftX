using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using SwiftX.Models;
using SwiftX.Services;


namespace SwiftX.Controllers
{
    public class SignUpController : Controller
    {
        // Accepted document types and size cap for uploaded files.
        private static readonly string[] AllowedContentTypes =
            { "image/jpeg", "image/png", "image/webp", "application/pdf" };
        private const long MaxFileBytes = 5 * 1024 * 1024; // 5 MB

        private readonly AppDbContext _db;
        private readonly ISupabaseStorageService _storage;
        private readonly SupabaseOptions _supabase;
        private readonly IPasswordHasher<UserModel> _passwordHasher;

        public SignUpController(AppDbContext db, ISupabaseStorageService storage, IOptions<SupabaseOptions> supabase, IPasswordHasher<UserModel> passwordHasher)
        {
            _db = db;
            _storage = storage;
            _supabase = supabase.Value;
            _passwordHasher = passwordHasher;
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
            // Reject invalid input (missing fields, bad email, disallowed/oversized files)
            // before touching the database or storage.
            ValidateUpload(rider.License, nameof(rider.License));
            ValidateUpload(rider.ID, nameof(rider.ID));
            ValidateUpload(rider.ORCR, nameof(rider.ORCR));
            ValidateUpload(rider.Agreement, nameof(rider.Agreement));
            ValidateUpload(rider.Front_Vehicle, nameof(rider.Front_Vehicle));
            ValidateUpload(rider.Side_Vehicle, nameof(rider.Side_Vehicle));
            if (!ModelState.IsValid)
                return View("Rider", rider);

            // Wrap the whole signup in a transaction so a failed document upload
            // rolls back the User row instead of leaving an orphaned record.
            await using var transaction = await _db.Database.BeginTransactionAsync();
            var bucket = _supabase.RiderBucket;
            var uploaded = new List<string>();

            try
            {
                // 1. Save the user first to get the UserId (used for the storage folder)
                var user = rider.User;
                user.Role = "Customer";
                user.Password = _passwordHasher.HashPassword(user, user.Password);
                _db.Users.Add(user);
                await _db.SaveChangesAsync();

                // 2. Upload documents to the private Supabase rider bucket under {userId}/...
                var riderEntity = new Rider
                {
                    UserId = user.Id,
                    LicensePath = await UploadDoc(rider.License, bucket, user.Id, uploaded),
                    IDPath = await UploadDoc(rider.ID, bucket, user.Id, uploaded),
                    ORCRPath = await UploadDoc(rider.ORCR, bucket, user.Id, uploaded),
                    AgreementPath = await UploadDoc(rider.Agreement, bucket, user.Id, uploaded),
                    FrontVehiclePath = await UploadDoc(rider.Front_Vehicle, bucket, user.Id, uploaded),
                    SideVehiclePath = await UploadDoc(rider.Side_Vehicle, bucket, user.Id, uploaded),
                    GCContact = rider.GCContact,
                    PlateNumber = rider.PlateNumber
                };

                // 3. Save rider entity and commit.
                _db.Riders.Add(riderEntity);
                await _db.SaveChangesAsync();
                await transaction.CommitAsync();
            }
            catch
            {
                // Roll back the DB and remove any files already uploaded this attempt.
                await transaction.RollbackAsync();
                await CleanupUploads(bucket, uploaded);
                throw;
            }

            return RedirectToAction("Index", "Home");
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> SignUpMerchant(MerchantModel merchant)
        {
            // Reject invalid input before touching the database or storage.
            ValidateUpload(merchant.BIRForm, nameof(merchant.BIRForm));
            ValidateUpload(merchant.DTICertificate, nameof(merchant.DTICertificate));
            ValidateUpload(merchant.BarangayClearance, nameof(merchant.BarangayClearance));
            if (!ModelState.IsValid)
                return View("Merchant", merchant);

            // Wrap the whole signup in a transaction so a failed document upload
            // rolls back the User row instead of leaving an orphaned record.
            await using var transaction = await _db.Database.BeginTransactionAsync();
            var bucket = _supabase.MerchantBucket;
            var uploaded = new List<string>();

            try
            {
                // 1. Save the user first to get the UserId (used for the storage folder)
                var user = merchant.User;
                // Populate User fields from merchant form data (form doesn't bind these directly)
                user.FirstName = merchant.OwnerFirstName;
                user.LastName = merchant.OwnerLastName;
                user.Contact = merchant.BusinessContact;
                user.Address = merchant.BusinessAddress;
                user.Role = "Customer";
                user.Password = _passwordHasher.HashPassword(user, user.Password);
                _db.Users.Add(user);
                await _db.SaveChangesAsync();

                // 2. Upload documents to the private Supabase merchant bucket under {userId}/...
                var merchantEntity = new Merchant
                {
                    UserId = user.Id,
                    BusinessName = merchant.BusinessName,
                    OwnerFirstName = merchant.OwnerFirstName,
                    OwnerLastName = merchant.OwnerLastName,
                    BusinessAddress = merchant.BusinessAddress,
                    BusinessContact = merchant.BusinessContact,
                    BusinessEmail = merchant.BusinessEmail,
                    BIRFormPath = await UploadDoc(merchant.BIRForm, bucket, user.Id, uploaded),
                    DTICertificatePath = await UploadDoc(merchant.DTICertificate, bucket, user.Id, uploaded),
                    BarangayClearancePath = await UploadDoc(merchant.BarangayClearance, bucket, user.Id, uploaded),
                    GCContact = merchant.GCContact
                };

                // 3. Save merchant entity and commit.
                _db.Merchants.Add(merchantEntity);
                await _db.SaveChangesAsync();
                await transaction.CommitAsync();
            }
            catch
            {
                // Roll back the DB and remove any files already uploaded this attempt.
                await transaction.RollbackAsync();
                await CleanupUploads(bucket, uploaded);
                throw;
            }

            return RedirectToAction("Index", "Home");
        }

        /// <summary>
        /// Adds a ModelState error when an uploaded file is too large or of a disallowed
        /// type. Missing files are left to the model's [Required] validation.
        /// </summary>
        private void ValidateUpload(IFormFile? file, string field)
        {
            if (file == null || file.Length == 0)
                return;

            if (file.Length > MaxFileBytes)
                ModelState.AddModelError(field, "File exceeds the 5 MB limit.");

            if (!AllowedContentTypes.Contains(file.ContentType))
                ModelState.AddModelError(field, "Only JPG, PNG, WEBP, or PDF files are allowed.");
        }

        /// <summary>
        /// Uploads a file to the given Supabase bucket under {userId}/{guid}.{ext} and
        /// returns the stored object path (empty when no file was provided). Successful
        /// uploads are recorded in <paramref name="uploaded"/> so they can be cleaned up
        /// if a later step in the signup fails.
        /// </summary>
        private async Task<string> UploadDoc(IFormFile file, string bucket, int userId, List<string> uploaded)
        {
            if (file == null || file.Length == 0)
                return string.Empty;

            // Unique object path within the user's folder to avoid collisions
            var objectPath = $"{userId}/{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
            var stored = await _storage.UploadAsync(file, bucket, objectPath);
            if (!string.IsNullOrEmpty(stored))
                uploaded.Add(stored);
            return stored;
        }

        /// <summary>
        /// Best-effort removal of files uploaded during a signup attempt that failed.
        /// Swallows errors so cleanup never masks the original exception.
        /// </summary>
        private async Task CleanupUploads(string bucket, List<string> objectPaths)
        {
            foreach (var path in objectPaths)
            {
                try { await _storage.DeleteAsync(bucket, path); }
                catch { /* ignore — original error is rethrown by the caller */ }
            }
        }
    }
}
