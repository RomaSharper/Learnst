using System.Text.Json.Serialization;

namespace Learnst.Api.Models;

public class EpicGamesTokenResponse
{
    [JsonPropertyName("access_token")] public string AccessToken { get; set; } = string.Empty;
    [JsonPropertyName("account_id")] public string AccountId { get; set; } = string.Empty;
    [JsonPropertyName("displayName")] public string DisplayName { get; set; } = string.Empty;
}
