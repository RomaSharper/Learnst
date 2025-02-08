using System.Text.Json.Serialization;

namespace Learnst.Api.Models;

public class EpicGamesUserInfo
{
    [JsonPropertyName("accountId")] public string AccountId { get; set; } = string.Empty;
    [JsonPropertyName("displayName")] public string DisplayName { get; set; } = string.Empty;
    [JsonPropertyName("email")] public string Email { get; set; } = string.Empty;
}
