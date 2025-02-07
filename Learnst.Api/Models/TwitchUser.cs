using System.Text.Json.Serialization;

namespace Learnst.Api.Models;

public class TwitchUser
{
    public string Id { get; set; } = string.Empty;
    public string Login { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    [JsonPropertyName("profile_image_url")] public string ProfileImageUrl { get; set; } = string.Empty;
}
