using System.Text.Json.Serialization;

namespace Learnst.Api.Models;

public class MailRuUserInfo
{
    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;
    
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;
    
    [JsonPropertyName("image")]
    public string Image { get; set; } = string.Empty;

    [JsonPropertyName("first_name")]
    public string FirstName { get; set; } = string.Empty;
    
    [JsonPropertyName("last_name")] 
    public string LastName { get; set; } = string.Empty;
    
    [JsonPropertyName("birthday")] 
    public string Birthday { get; set; } = string.Empty;
}
