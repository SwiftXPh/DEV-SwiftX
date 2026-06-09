namespace SwiftX.Models
{
    public class Rider
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public UserModel User { get; set; }
        public string Status { get; set; } = "Active"; // Active, Inactive
        public string? PlateNumber { get; set; }
        public string LicensePath { get; set; }
        public string IDPath { get; set; }
        public string ORCRPath { get; set; }
        public string AgreementPath { get; set; }
        public string FrontVehiclePath { get; set; }
        public string SideVehiclePath { get; set; }
        public string GCContact { get; set; }
    }
}
