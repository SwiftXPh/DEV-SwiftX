using System.ComponentModel.DataAnnotations;

namespace SwiftX.Models
{
    public class UserModel
    {
        public int Id { get; set; }
        public string FirstName { get; set; }
        public string? MiddleName { get; set; }
        public string LastName { get; set; }
        public string Address { get; set; }
        public string Contact { get; set; }
        public string? BirthMonth { get; set; }
        public string? BirthDate { get; set; }
        public string? BirthYear { get; set; }

        // Login credentials — posted by every signup form, so safe to require here.
        [Required]
        public string Username { get; set; }

        [Required]
        [EmailAddress]
        public string Email { get; set; }

        [Required]
        public string Password { get; set; }

        // Authorization role: "Customer" (default), "Rider", "Merchant", or "Admin".
        public string Role { get; set; } = "Customer";

        public string? ProfileImagePath { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
