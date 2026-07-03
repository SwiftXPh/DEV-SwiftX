namespace SwiftX.Models;

public class CustomerHomeViewModel
{
    public string FirstName { get; set; } = "";
    public string FullName { get; set; } = "";
    public string ProfileImage { get; set; } = "";

    public List<ServiceViewModel> Services { get; set; } = new();

    public List<FeaturedBannerViewModel> Featured { get; set; } = new();

    public List<FeaturedBannerViewModel> ComingSoon { get; set; } = new();
}