using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Learnst.Api.Models;
using Learnst.Infrastructure.Enums;
using Learnst.Infrastructure.Exceptions;
using Learnst.Infrastructure.Interfaces;
using Learnst.Infrastructure.Models;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace Learnst.Api.Services;

public class JwtService(IOptions<JwtSettings> jwtSettings, IAsyncRepository<User, Guid> usersRepository)
{
    private readonly JwtSettings _jwtSettings = jwtSettings.Value;
    
    public string GenerateToken(User user)
    {
        var now = DateTime.UtcNow;
        var expirationTime = now.AddMinutes(15);
        SymmetricSecurityKey securityKey = new(Encoding.UTF8.GetBytes(_jwtSettings.Key));
        SigningCredentials credentials = new(securityKey, SecurityAlgorithms.HmacSha256);

        Claim[] claims =
        [
            new("openid", user.Id.ToString()),
            new("username", user.Username),
            new("role", user.Role.ToString()),
            new("picture", user.AvatarUrl ?? string.Empty),
            new("exp", ((int)expirationTime.Subtract(new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc)).TotalSeconds).ToString())
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
    
    /// <summary>
    /// Генерирует новый JWT-токен для пользователя с помощью Id.
    /// </summary>
    public async Task<string> GenerateTokenAsync(Guid userId) =>
        GenerateToken(await usersRepository.GetByIdAsync(userId)
                      ?? throw new NotFoundException<User>(userId));

    public string GenerateToken(IEnumerable<Claim> claims)
    {
        SymmetricSecurityKey key = new(Encoding.UTF8.GetBytes(jwtSettings.Value.Key));
        SigningCredentials creds = new(key, SecurityAlgorithms.HmacSha256);

        JwtSecurityToken token = new(
            claims: claims,
            signingCredentials: creds,
            issuer: jwtSettings.Value.Issuer,
            expires: DateTime.UtcNow.AddDays(1),
            audience: jwtSettings.Value.Audience);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
    
    public string GenerateAccessToken(User user, List<string> scopes)
    {
        List<Claim> claims = [];
        foreach (var scope in scopes)
            switch (scope)
            {
                case "openid":
                    claims.Add(new Claim("openid", user.Id.ToString()));
                    break;
                case "email":
                    claims.Add(new Claim("email", user.EmailAddress ?? string.Empty));
                    break;
                case "fullname":
                    claims.Add(new Claim("fullname", user.FullName ?? string.Empty));
                    break;
                case "username":
                    claims.Add(new Claim("username", user.Username));
                    break;
                case "picture":
                    claims.Add(new Claim("picture", user.AvatarUrl ?? string.Empty));
                    break;
                case "role":
                    claims.Add(new Claim("role", user.Role switch
                    {
                        Role.Admin => "admin",
                        Role.Backup => "backup",
                        Role.Specialist => "specialist",
                        _ => "user"
                    }));
                    break;
            }

        return GenerateToken(claims);
    }
}