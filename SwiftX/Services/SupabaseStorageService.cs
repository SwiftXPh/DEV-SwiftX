using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Options;

namespace SwiftX.Services
{
    /// <summary>
    /// Talks to the Supabase Storage REST API with a typed <see cref="HttpClient"/>.
    /// Authenticates with the service-role key, so this must only run server-side.
    /// </summary>
    public class SupabaseStorageService : ISupabaseStorageService
    {
        private readonly HttpClient _http;
        private readonly SupabaseOptions _options;

        public SupabaseStorageService(HttpClient http, IOptions<SupabaseOptions> options)
        {
            _http = http;
            _options = options.Value;
        }

        public async Task<string> UploadAsync(IFormFile file, string bucket, string objectPath, CancellationToken ct = default)
        {
            if (file == null || file.Length == 0)
                return string.Empty;

            var url = $"{_options.Url}/storage/v1/object/{bucket}/{objectPath}";

            using var content = new StreamContent(file.OpenReadStream());
            content.Headers.ContentType = new MediaTypeHeaderValue(
                string.IsNullOrEmpty(file.ContentType) ? "application/octet-stream" : file.ContentType);

            using var req = new HttpRequestMessage(HttpMethod.Post, url) { Content = content };
            ApplyAuth(req);
            req.Headers.Add("x-upsert", "true");

            var res = await _http.SendAsync(req, ct);
            if (!res.IsSuccessStatusCode)
            {
                var error = await res.Content.ReadAsStringAsync(ct);
                throw new HttpRequestException(
                    $"Supabase upload to '{bucket}/{objectPath}' failed ({(int)res.StatusCode} {res.StatusCode}): {error}");
            }

            return objectPath;
        }

        public async Task<string?> CreateSignedUrlAsync(string bucket, string objectPath, int expiresInSeconds = 3600, CancellationToken ct = default)
        {
            if (string.IsNullOrEmpty(objectPath))
                return null;

            var url = $"{_options.Url}/storage/v1/object/sign/{bucket}/{objectPath}";

            using var req = new HttpRequestMessage(HttpMethod.Post, url)
            {
                Content = JsonContent.Create(new { expiresIn = expiresInSeconds })
            };
            ApplyAuth(req);

            var res = await _http.SendAsync(req, ct);
            if (!res.IsSuccessStatusCode)
                return null;

            await using var stream = await res.Content.ReadAsStreamAsync(ct);
            var body = await JsonSerializer.DeserializeAsync<SignedUrlResponse>(stream, cancellationToken: ct);
            if (string.IsNullOrEmpty(body?.SignedUrl))
                return null;

            // Supabase returns a relative URL like "/object/sign/{bucket}/{path}?token=..."
            return $"{_options.Url}/storage/v1{body.SignedUrl}";
        }

        public async Task<bool> DeleteAsync(string bucket, string objectPath, CancellationToken ct = default)
        {
            if (string.IsNullOrEmpty(objectPath))
                return false;

            var url = $"{_options.Url}/storage/v1/object/{bucket}/{objectPath}";

            using var req = new HttpRequestMessage(HttpMethod.Delete, url);
            ApplyAuth(req);

            var res = await _http.SendAsync(req, ct);
            return res.IsSuccessStatusCode;
        }

        private void ApplyAuth(HttpRequestMessage req)
        {
            req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.ServiceRoleKey);
            req.Headers.Add("apikey", _options.ServiceRoleKey);
        }

        private sealed class SignedUrlResponse
        {
            [JsonPropertyName("signedURL")]
            public string? SignedUrl { get; set; }
        }
    }
}
