namespace SwiftX.Models
{
    public class Merchant
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public UserModel User { get; set; }
        public string Status { get; set; } = "Pending"; // Pending, Active, Inactive, Rejected
        public string? Category { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
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

        // Per-document review statuses
        public string BIRFormStatus { get; set; } = "Pending";
        public string DTICertificateStatus { get; set; } = "Pending";
        public string BarangayClearanceStatus { get; set; } = "Pending";

        // Operating details
        public string? OpeningTime { get; set; }
        public string? ClosingTime { get; set; }
        public string? LogoPath { get; set; }
        public string? CoverImagePath { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
    }
}

