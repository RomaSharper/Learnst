using System.Text.Json.Serialization;

namespace Learnst.Api.Models;

public class MailRuTokenResponse
{
    [JsonPropertyName("access_token")] public string AccessToken { get; set; } = string.Empty;
}
