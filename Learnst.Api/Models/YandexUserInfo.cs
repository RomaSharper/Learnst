using System.Text.Json.Serialization;

namespace Learnst.Api.Models;

public class YandexUserInfo
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;
    
    [JsonPropertyName("login")] 
    public string Login { get; set; } = string.Empty;
    
    [JsonPropertyName("default_email")] 
    public string DefaultEmail { get; set; } = string.Empty;
    
    [JsonPropertyName("default_avatar_id")] 
    public string DefaultAvatarId { get; set; } = string.Empty;
    
    [JsonPropertyName("first_name")] 
    public string FirstName { get; set; } = string.Empty;
    
    [JsonPropertyName("last_name")] 
    public string LastName { get; set; } = string.Empty;
}
