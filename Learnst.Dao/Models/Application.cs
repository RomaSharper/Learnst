using Learnst.Dao.Services;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Learnst.Dao.Models;

public class Application
{
    [Key, StringLength(100)] public string ClientId { get; set; } = $"{Guid.NewGuid():N}";
    
    [StringLength(100)] public string ClientSecret { get; set; } = AuthService.GenerateCodeSecure();
    
    public Guid UserId { get; set; }
    
    [JsonIgnore] public User? User { get; set; }
    
    [StringLength(50)] public string Name { get; set; } = string.Empty;
    
    [StringLength(2048)] public string RedirectUri { get; set; } = string.Empty;
    
    public List<string> AllowedScopes { get; set; } = [];
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
