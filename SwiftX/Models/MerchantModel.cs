using Microsoft.AspNetCore.Http;

namespace SwiftX.Models
{
    public class MerchantModel
    {
        public UserModel User { get; set; } = new UserModel();
        public string BusinessName { get; set; }
        public string OwnerFirstName { get; set; }
        public string OwnerLastName { get; set; }
        public string BusinessAddress { get; set; }
        public string BusinessContact { get; set; }
        public string BusinessEmail { get; set; }
        public IFormFile BIRForm { get; set; }
        public IFormFile DTICertificate { get; set; }
        public IFormFile BarangayClearance { get; set; }
        public string GCContact { get; set; }
    }
}
