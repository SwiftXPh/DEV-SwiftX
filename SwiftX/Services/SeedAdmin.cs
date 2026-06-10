using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SwiftX.Models;

namespace SwiftX.Services
{
    /// <summary>
    /// Ensures an admin account exists, using credentials from configuration
    /// (AdminSeed:Username / AdminSeed:Password — stored in user-secrets/env, never in git).
    /// Idempotent: creates the admin once, then keeps its hashed password in sync.
    /// </summary>
    public static class SeedAdmin
    {
        public static async Task RunAsync(IServiceProvider services)
        {
            using var scope = services.CreateScope();
            var sp = scope.ServiceProvider;

            var config = sp.GetRequiredService<IConfiguration>();
            var username = config["AdminSeed:Username"];
            var password = config["AdminSeed:Password"];

            // No credentials configured → nothing to seed (e.g. fresh checkout).
            if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
                return;

            var db = sp.GetRequiredService<AppDbContext>();
            var hasher = sp.GetRequiredService<IPasswordHasher<UserModel>>();

            var admin = await db.Users.FirstOrDefaultAsync(u => u.Username == username);
            if (admin == null)
            {
                admin = new UserModel
                {
                    Username = username,
                    Role = "Admin",
                    FirstName = "System",
                    LastName = "Administrator",
                    Email = config["AdminSeed:Email"] ?? "admin@swiftx.local",
                    Address = "—",
                    Contact = "—",
                    Password = hasher.HashPassword(null!, password)
                };
                db.Users.Add(admin);
            }
            else
            {
                // Keep role + password aligned with configured credentials.
                admin.Role = "Admin";
                admin.Password = hasher.HashPassword(admin, password);
            }

            await db.SaveChangesAsync();
        }
    }
}
