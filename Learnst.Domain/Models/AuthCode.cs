using System.ComponentModel.DataAnnotations;
using Learnst.Domain.Interfaces;
using Learnst.Domain.Services;

namespace Learnst.Domain.Models;

public class AuthCode : IBaseEntity<string>
{
    [Key, StringLength(450)] public string Code { get; set; } = AuthService.GenerateCodeSecure();
    
    [StringLength(450)] public string ClientId { get; set; } = string.Empty;
    
    public Application? Application { get; set; }
    
    public Guid UserId { get; set; }
    
    public User? User { get; set; }
    
    public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddMinutes(12);
    
    public List<string> Scopes { get; set; } = [];
    
    public string GetId() => Code;
}
