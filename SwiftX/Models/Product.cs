using System.ComponentModel.DataAnnotations.Schema;

namespace SwiftX.Models
{
    public class Product
    {
        public int Id { get; set; }

        public int StoreId { get; set; }
        public Store Store { get; set; }

        public string Name { get; set; }
        public string? Description { get; set; }
        public string? Category { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal Price { get; set; }

        public string? ImagePath { get; set; }
        
        public bool IsAvailable { get; set; } = true;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
