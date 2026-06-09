using Microsoft.AspNetCore.Http;
namespace SwiftX.Models
{
    public class RiderModel
    {
        public UserModel User { get; set; } = new UserModel();
        public IFormFile License { get; set; }
        public IFormFile ID { get; set; }
        public IFormFile ORCR { get; set; }
        public IFormFile Agreement { get; set; }
        public IFormFile Front_Vehicle { get; set; }
        public IFormFile Side_Vehicle { get; set; }
        public string PlateNumber { get; set; }
        public string GCContact { get; set; }
    }
}
