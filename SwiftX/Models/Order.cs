using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SwiftX.Models
{
    public class Order
    {
        public int Id { get; set; }

        // Relationships
        public int CustomerId { get; set; }
        public UserModel Customer { get; set; }

        public int? RiderId { get; set; }
        public Rider Rider { get; set; }

        public int MerchantId { get; set; }
        public Merchant Merchant { get; set; }

        // Order details
        public string Status { get; set; } // Pending, In Transit, Delivered, Cancelled

        [Column(TypeName = "decimal(10,2)")]
        public decimal Subtotal { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal DeliveryFee { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal Discount { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal TotalAmount { get; set; }

        public string PaymentMethod { get; set; } // GCash, Cash

        // Addresses
        public string DeliveryAddress { get; set; }
        public string CustomerContact { get; set; }

        // Timestamps
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? DeliveredAt { get; set; }
        public DateTime? CancelledAt { get; set; }

        // Navigation property for order items
        public List<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
    }
}
