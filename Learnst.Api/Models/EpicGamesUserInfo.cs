using System.Text.Json.Serialization;

namespace Learnst.Api.Models;

public class EpicGamesUserInfo
{
    [JsonPropertyName("sub")] public string Sub { get; set; } = string.Empty;
    [JsonPropertyName("email")] public string Email { get; set; } = string.Empty;
    [JsonPropertyName("preferred_username")] public string PreferredUsername { get; set; } = string.Empty;
    [JsonPropertyName("picture")] public string Picture { get; set; } = string.Empty;
}
