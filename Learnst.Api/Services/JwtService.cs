using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Learnst.Dao.Models;
using Microsoft.IdentityModel.Tokens;

namespace Learnst.Api.Services;

public static class JwtService
{
    public static string GenerateToken(User user, IConfiguration configuration)
    {
        SymmetricSecurityKey securityKey = new(Encoding.UTF8.GetBytes(configuration["Jwt:Key"]!));
        SigningCredentials credentials = new(securityKey, SecurityAlgorithms.HmacSha256);

        Claim[] claims =
        [
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Role, user.Role.ToString())
        ];

        JwtSecurityToken token = new(
            issuer: configuration["Jwt:Issuer"],
            audience: configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddDays(1), // Время жизни токена
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}