namespace SwiftX.Models
{
    public class Merchant
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public UserModel User { get; set; }
        public string BusinessName { get; set; }
        public string OwnerFirstName { get; set; }
        public string OwnerLastName { get; set; }
        public string BusinessAddress { get; set; }
        public string BusinessContact { get; set; }
        public string BusinessEmail { get; set; }
        public string BIRFormPath { get; set; }
        public string DTICertificatePath { get; set; }
        public string BarangayClearancePath { get; set; }
        public string GCContact { get; set; }
    }
}
