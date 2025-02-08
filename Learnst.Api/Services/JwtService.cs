using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Learnst.Api.Models;
using Learnst.Dao.Models;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace Learnst.Api.Services;

public class JwtService(IOptions<JwtSettings> jwtSettings)
{
    private readonly JwtSettings _jwtSettings = jwtSettings.Value;
    public static readonly Dictionary<string, string> ScopeMappings = new()
    {
        { "openid", "sub" },
        { "profile", "name" },
        { "email", "email" },
        { "picture", "picture" }
    };
    
    public string GenerateToken(User user)
    {
        SymmetricSecurityKey securityKey = new(Encoding.UTF8.GetBytes(_jwtSettings.Key));
        SigningCredentials credentials = new(securityKey, SecurityAlgorithms.HmacSha256);

        Claim[] claims =
        [
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Role, user.Role.ToString())
        ];

        JwtSecurityToken token = new(
            claims: claims,
            issuer: _jwtSettings.Issuer,
            audience: _jwtSettings.Audience,
            signingCredentials: credentials,
            expires: DateTime.UtcNow.AddDays(1)
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string GenerateToken(IEnumerable<Claim> claims)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.Value.Key));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: jwtSettings.Value.Issuer,
            audience: jwtSettings.Value.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddDays(1),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
    
    public string GenerateAccessToken(User user, List<string> scopes)
    {
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new("scope", string.Join(' ', scopes))
        };

        foreach (var scope in scopes)
            if (ScopeMappings.TryGetValue(scope, out var field))
                switch (field)
                {
                    case "email":
                        claims.Add(new Claim(JwtRegisteredClaimNames.Email, user.EmailAddress ?? string.Empty));
                        break;
                    case "name":
                        claims.Add(new Claim(ClaimTypes.Name, user.FullName ?? string.Empty));
                        break;
                    case "picture":
                        claims.Add(new Claim("picture", user.AvatarUrl ?? string.Empty));
                        break;
                }

        return GenerateToken(claims);
    }
}