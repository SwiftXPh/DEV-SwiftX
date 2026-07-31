using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using SwiftX.Models;
namespace SwiftX
{
    
    public class AppDbContext : DbContext
    {
        public DbSet<UserModel> Users { get; set; }
        public DbSet<Rider> Riders { get; set; }
        public DbSet<Merchant> Merchants { get; set; }
        public DbSet<Store> Stores { get; set; }
        public DbSet<Customer> Customers { get; set; }
        public DbSet<CustomerAddress> CustomerAddresses { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderItem> OrderItems { get; set; }

        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // ── Unique constraints ──────────────────────────────────────
            modelBuilder.Entity<UserModel>()
                .HasIndex(u => u.Username).IsUnique();
            modelBuilder.Entity<UserModel>()
                .HasIndex(u => u.Email).IsUnique();
            modelBuilder.Entity<UserModel>()
                .HasIndex(u => u.GoogleId).IsUnique()
                .HasFilter("\"GoogleId\" IS NOT NULL");

            // One User → One profile (1:1 enforcement)
            modelBuilder.Entity<Rider>()
                .HasIndex(r => r.UserId).IsUnique();
            modelBuilder.Entity<Merchant>()
                .HasIndex(m => m.UserId).IsUnique();
            modelBuilder.Entity<Customer>()
                .HasIndex(c => c.UserId).IsUnique();

            // ── Relationships ───────────────────────────────────────────

            // Order → Customer (references Customer table, not Users)
            modelBuilder.Entity<Order>()
                .HasOne(o => o.Customer)
                .WithMany()
                .HasForeignKey(o => o.CustomerId)
                .OnDelete(DeleteBehavior.Cascade);

            // Order → Rider (optional)
            modelBuilder.Entity<Order>()
                .HasOne(o => o.Rider)
                .WithMany(r => r.AssignedOrders)
                .HasForeignKey(o => o.RiderId)
                .OnDelete(DeleteBehavior.SetNull);

            // Order → Merchant
            modelBuilder.Entity<Order>()
                .HasOne(o => o.Merchant)
                .WithMany()
                .HasForeignKey(o => o.MerchantId)
                .OnDelete(DeleteBehavior.Cascade);

            // CustomerAddress → Customer
            modelBuilder.Entity<CustomerAddress>()
                .HasOne(ca => ca.Customer)
                .WithMany(c => c.SavedAddresses)
                .HasForeignKey(ca => ca.CustomerId)
                .OnDelete(DeleteBehavior.Cascade);

            // Rider → User (1:1)
            modelBuilder.Entity<Rider>()
                .HasOne(r => r.User)
                .WithMany()
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Merchant → User (1:1)
            modelBuilder.Entity<Merchant>()
                .HasOne(m => m.User)
                .WithMany()
                .HasForeignKey(m => m.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Customer → User (1:1)
            modelBuilder.Entity<Customer>()
                .HasOne(c => c.User)
                .WithMany()
                .HasForeignKey(c => c.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}

