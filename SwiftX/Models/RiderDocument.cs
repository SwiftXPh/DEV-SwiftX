namespace SwiftX.Models
{
    public class RiderDocument
    {
        public int Id { get; set; }

        public int RiderId { get; set; }
        public Rider Rider { get; set; }

        public string DocumentType { get; set; } // License, ID, ORCR, Agreement, FrontVehicle, SideVehicle
        public string FilePath { get; set; }
        
        public string Status { get; set; } = "Pending"; // Pending, Approved, Rejected

        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
    }
}
