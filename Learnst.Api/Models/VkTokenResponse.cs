using System.Text.Json.Serialization;

namespace Learnst.Api.Models;

public class VkTokenResponse
{
    [JsonPropertyName("access_token")]
    public string AccessToken { get; set; } = string.Empty;
    
    [JsonPropertyName("user_id")]
    public long UserId { get; set; }
    
    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;
}
