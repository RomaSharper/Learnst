using System.Text.Json.Serialization;

namespace Learnst.Api.Models;

public class TikTokUser
{
    [JsonPropertyName("open_id")] public string OpenId { get; set; } = string.Empty;
    [JsonPropertyName("display_name")] public string DisplayName { get; set; } = string.Empty;
    [JsonPropertyName("avatar_url")] public string AvatarUrl { get; set; } = string.Empty;
}
