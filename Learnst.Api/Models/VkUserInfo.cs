using System.Text.Json.Serialization;

namespace Learnst.Api.Models;

public class VkUserInfo
{
    [JsonPropertyName("id")]
    public long Id { get; set; }
    [JsonPropertyName("photo_200")]
    public string Photo200 { get; set; } = string.Empty;
    
    [JsonPropertyName("first_name")] 
    public string FirstName { get; set; } = string.Empty;
    
    [JsonPropertyName("last_name")] 
    public string LastName { get; set; } = string.Empty;
    
    [JsonPropertyName("bdate")] 
    public string BirthDate { get; set; } = string.Empty;
}
