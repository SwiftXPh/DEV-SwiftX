namespace SwiftX.Models
{
    public class Customer
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public UserModel User { get; set; }

        // Preferences
        public string? DefaultDeliveryAddress { get; set; }
        public double? DefaultLatitude { get; set; }
        public double? DefaultLongitude { get; set; }

        // Timestamps
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public List<CustomerAddress> SavedAddresses { get; set; } = new();
    }
}
