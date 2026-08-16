namespace SwiftX.Models
{
    public class Store
    {
        public int Id { get; set; }
        
        public int? MerchantId { get; set; }
        public Merchant? Merchant { get; set; }

        public string BusinessName { get; set; }
        public string BusinessAddress { get; set; }
        public string? Category { get; set; }       // Restaurant, Cafe, Fastfood
        public string? LogoPath { get; set; }
        public string? CoverImagePath { get; set; }
        public string? OpeningTime { get; set; }
        public string? ClosingTime { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }

        public string Status { get; set; } = "Unassigned"; // Unassigned, Active, Inactive
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public List<Product> Products { get; set; } = new();
    }
}
