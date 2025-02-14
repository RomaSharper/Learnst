using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using Learnst.Domain.Interfaces;
using Learnst.Domain.Services;

namespace Learnst.Domain.Models;

public class Application : IBaseEntity<string>
{
    [Key, StringLength(450)] public string ClientId { get; set; } = $"{Guid.NewGuid():N}";
    
    [StringLength(450)] public string ClientSecret { get; set; } = AuthService.GenerateCodeSecure();
    
    public Guid UserId { get; set; }
    
    [JsonIgnore] public User? User { get; set; }
    
    [StringLength(50)] public string Name { get; set; } = string.Empty;
    
    [StringLength(2048)] public string RedirectUri { get; set; } = string.Empty;
    
    public List<string> AllowedScopes { get; set; } = [];
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public string GetId() => ClientId;
}
