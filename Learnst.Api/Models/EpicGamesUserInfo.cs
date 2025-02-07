using System.Text.Json.Serialization;

namespace Learnst.Api.Models;

public class EpicGamesUserInfo
{
    [JsonPropertyName("account_id")] public string AccountId { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    [JsonPropertyName("display_name")] public string DisplayName { get; set; } = string.Empty;
    [JsonPropertyName("preferred_username")] public string PreferredUsername { get; set; } = string.Empty;
}
