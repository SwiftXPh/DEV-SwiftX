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
        // Documents (License, ID, ORCR, Agreement, Vehicle photos)
        public List<RiderDocument> Documents { get; set; } = new();
        public string GCContact { get; set; }

        // Real-time operational fields
        public bool IsOnline { get; set; } = false;
        public double? CurrentLatitude { get; set; }
        public double? CurrentLongitude { get; set; }
        public string VehicleType { get; set; } = "Motorcycle"; // Motorcycle, Bicycle, Car

        // Navigation — orders assigned to this rider
        public List<Order> AssignedOrders { get; set; } = new();
    }
}

