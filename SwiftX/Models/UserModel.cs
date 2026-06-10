namespace SwiftX.Models
{
    public class UserModel
    {
        public int Id { get; set; }
        public string FirstName { get; set; }
        public string? MiddleName { get; set; }
        public string LastName { get; set; }
        public string Address { get; set; }
        public string Contact { get; set; }
        public string? BirthMonth { get; set; }
        public string? BirthDate { get; set; }
        public string? BirthYear { get; set; }
        public string Username { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }

        // Authorization role: "Customer" (default) or "Admin".
        public string Role { get; set; } = "Customer";
    }
}
