using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Learnst.Api.Models;
using Learnst.Dao.Models;
using Microsoft.IdentityModel.Tokens;

namespace Learnst.Api.Services;

public static class JwtService
{
    public static string GenerateToken(User user, JwtSettings jwtSettings)
    {
        SymmetricSecurityKey securityKey = new(Encoding.UTF8.GetBytes(jwtSettings.Key));
        SigningCredentials credentials = new(securityKey, SecurityAlgorithms.HmacSha256);

        Claim[] claims =
        [
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Role, user.Role.ToString())
        ];

        JwtSecurityToken token = new(
            claims: claims,
            issuer: jwtSettings.Issuer,
            audience: jwtSettings.Audience,
            signingCredentials: credentials,
            expires: DateTime.UtcNow.AddDays(1)
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}