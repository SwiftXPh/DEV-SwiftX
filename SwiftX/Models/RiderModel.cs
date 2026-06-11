using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;
namespace SwiftX.Models
{
    public class RiderModel
    {
        public UserModel User { get; set; } = new UserModel();

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
