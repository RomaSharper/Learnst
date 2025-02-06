using System.Text.Json.Serialization;

namespace Learnst.Api.Models;

public class OkUserInfo
{
    [JsonPropertyName("uid")]
    public string Uid { get; set; } = string.Empty;
    
    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;
    
    [JsonPropertyName("pic1024x768")]
    public string Pic1024x768 { get; set; } = string.Empty;
}
