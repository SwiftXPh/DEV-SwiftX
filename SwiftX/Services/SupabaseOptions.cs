namespace SwiftX.Services
{
    /// <summary>
    /// Strongly-typed Supabase configuration bound from the "Supabase" config section.
    /// The service-role key must only ever live in server-side config (user-secrets /
    /// appsettings.Development.json) — never send it to the browser.
    /// </summary>
    public class SupabaseOptions
    {
        public string Url { get; set; } = string.Empty;
        public string ServiceRoleKey { get; set; } = string.Empty;
        public string RiderBucket { get; set; } = "rider-documents";
        public string MerchantBucket { get; set; } = "merchant-documents";
    }
}
