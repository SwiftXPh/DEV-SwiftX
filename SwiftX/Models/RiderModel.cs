using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;
namespace SwiftX.Models
{
    public class RiderModel
    {
        // ── Personal info (previously nested in UserModel) ──
        [Required(ErrorMessage = "First name is required.")]
        public string FirstName { get; set; }

        public string? MiddleName { get; set; }

        [Required(ErrorMessage = "Last name is required.")]
        public string LastName { get; set; }

        [Required(ErrorMessage = "Address is required.")]
        public string Address { get; set; }

        [Required(ErrorMessage = "Contact number is required.")]
        public string Contact { get; set; }

        public string? Birthdate { get; set; }

        // ── Account credentials (previously nested in UserModel) ──
        [Required(ErrorMessage = "Username is required.")]
        public string Username { get; set; }

        [Required(ErrorMessage = "Email is required.")]
        [EmailAddress]
        public string Email { get; set; }

        [Required(ErrorMessage = "Password is required.")]
        public string Password { get; set; }

        [Required(ErrorMessage = "Driver's license is required.")]
        public IFormFile License { get; set; }

        [Required(ErrorMessage = "Government ID is required.")]
        public IFormFile ID { get; set; }

        [Required(ErrorMessage = "OR/CR is required.")]
        public IFormFile ORCR { get; set; }

        [Required(ErrorMessage = "Signed agreement is required.")]
        public IFormFile Agreement { get; set; }

        [Required(ErrorMessage = "Front vehicle photo is required.")]
        public IFormFile Front_Vehicle { get; set; }

        [Required(ErrorMessage = "Side vehicle photo is required.")]
        public IFormFile Side_Vehicle { get; set; }

        public string PlateNumber { get; set; }

        [Required(ErrorMessage = "GCash contact number is required.")]
        public string GCContact { get; set; }
    }
}
