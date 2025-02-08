using Learnst.Dao.Services;
using System.ComponentModel.DataAnnotations;

namespace Learnst.Dao.Models;

public class AuthCode
{
    [Key, StringLength(100)] public string Code { get; set; } = AuthService.GenerateCodeSecure();
    
    [StringLength(100)] public string ApplicationId { get; set; } = string.Empty;
    
    public Application? Application { get; set; }
    
    public Guid UserId { get; set; }
    
    public User? User { get; set; }
    
    public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddMinutes(12);
    
    public List<string> Scopes { get; set; } = [];
}
