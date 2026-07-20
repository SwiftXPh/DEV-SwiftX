namespace SwiftX.Models
{
    public class Rider
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public UserModel User { get; set; }
        public string Status { get; set; } = "Pending"; // Pending, Active, Inactive, Rejected
        public string? PlateNumber { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public string LicensePath { get; set; }
        public string IDPath { get; set; }
        public string ORCRPath { get; set; }
        public string AgreementPath { get; set; }
        public string FrontVehiclePath { get; set; }
        public string SideVehiclePath { get; set; }
        public string GCContact { get; set; }

        // Per-document review statuses
        public string LicenseStatus { get; set; } = "Pending";
        public string IDStatus { get; set; } = "Pending";
        public string ORCRStatus { get; set; } = "Pending";
        public string AgreementStatus { get; set; } = "Pending";
        public string FrontVehicleStatus { get; set; } = "Pending";
        public string SideVehicleStatus { get; set; } = "Pending";

        // Real-time operational fields
        public bool IsOnline { get; set; } = false;
        public double? CurrentLatitude { get; set; }
        public double? CurrentLongitude { get; set; }
        public string VehicleType { get; set; } = "Motorcycle"; // Motorcycle, Bicycle, Car

        // Navigation — orders assigned to this rider
        public List<Order> AssignedOrders { get; set; } = new();
    }
}

