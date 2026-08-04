using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace SwiftX.Models
{
    public class MerchantModel
    {
        [Required(ErrorMessage = "Business name is required.")]
        public string BusinessName { get; set; }

        [Required(ErrorMessage = "Owner first name is required.")]
        public string OwnerFirstName { get; set; }

        [Required(ErrorMessage = "Owner last name is required.")]
        public string OwnerLastName { get; set; }

        [Required(ErrorMessage = "Business address is required.")]
        public string BusinessAddress { get; set; }

        [Required(ErrorMessage = "Business contact is required.")]
        public string BusinessContact { get; set; }

        [Required(ErrorMessage = "Business email is required.")]
        [EmailAddress]
        public string BusinessEmail { get; set; }

        [Required(ErrorMessage = "BIR form is required.")]
        public IFormFile BIRForm { get; set; }

        public IFormFile? DTICertificate { get; set; }

        [Required(ErrorMessage = "Barangay clearance is required.")]
        public IFormFile BarangayClearance { get; set; }

        [Required(ErrorMessage = "GCash contact number is required.")]
        public string GCContact { get; set; }

        // ── Account credentials (previously nested in UserModel) ──
        [Required(ErrorMessage = "Username is required.")]
        public string Username { get; set; }

        [Required(ErrorMessage = "Email is required.")]
        [EmailAddress]
        public string Email { get; set; }

        [Required(ErrorMessage = "Password is required.")]
        public string Password { get; set; }
    }
}
