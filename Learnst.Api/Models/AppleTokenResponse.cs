using System.Text.Json.Serialization;

namespace Learnst.Api.Models;

public class AppleTokenResponse
{
    [JsonPropertyName("access_token")] 
    public string AccessToken { get; set; } = string.Empty;
    
    [JsonPropertyName("id_token")] 
    public string IdToken { get; set; } = string.Empty;
}
