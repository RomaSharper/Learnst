using System.Text.Json.Serialization;

namespace Learnst.Api.Models;

public class EpicGamesTokenResponse
{
    [JsonPropertyName("access_token")] public string AccessToken { get; set; } = string.Empty;
    [JsonPropertyName("expires_in")] public int ExpiresIn { get; set; }
}
