namespace SwiftX.Models
{
    public class Customer
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public UserModel User { get; set; }

        // Preferences (Managed via CustomerAddress)

        // Timestamps
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public List<CustomerAddress> SavedAddresses { get; set; } = new();
    }
}
