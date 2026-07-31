namespace SwiftX.Models
{
    public class Store
    {
        public int Id { get; set; }
        public string BusinessName { get; set; }
        public string BusinessAddress { get; set; }
        public string? Category { get; set; }       // Restaurant, Cafe, Fastfood
        public string? LogoPath { get; set; }
        public string Status { get; set; } = "Unassigned"; // Unassigned, Active, Inactive
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
