namespace SwiftX.Services
{
    /// <summary>
    /// Uploads user documents to Supabase Storage and issues short-lived signed URLs
    /// for viewing them. Buckets are private, so files are never publicly reachable.
    /// </summary>
    public interface ISupabaseStorageService
    {
        /// <summary>
        /// Uploads a single form file to <paramref name="bucket"/> at <paramref name="objectPath"/>.
        /// Returns the stored object path (to persist in the database), or an empty string
        /// when the file is null/empty.
        /// </summary>
        Task<string> UploadAsync(IFormFile file, string bucket, string objectPath, CancellationToken ct = default);

        /// <summary>
        /// Creates a time-limited signed URL for an object in a private bucket.
        /// Returns null if the object cannot be signed (e.g. missing).
        /// </summary>
        Task<string?> CreateSignedUrlAsync(string bucket, string objectPath, int expiresInSeconds = 3600, CancellationToken ct = default);

        /// <summary>
        /// Best-effort delete of an object. Used to clean up files uploaded during a
        /// signup attempt that later failed. Returns true if the object was removed.
        /// </summary>
        Task<bool> DeleteAsync(string bucket, string objectPath, CancellationToken ct = default);
    }
}
