using Learnst.Api.Models;
using Learnst.Dao;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.ComponentModel.DataAnnotations;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using bcrypt = BCrypt.Net.BCrypt;

namespace Learnst.Api.Controllers;

[ApiController]
[Route("[controller]")]
public class AccountController(ApplicationDbContext context, IOptions<JwtSettings> settings) : ControllerBase
{
    private readonly JwtSettings _settings = settings.Value;

    [HttpPost("login")]
    public async Task<IActionResult> Login([Required, FromForm] LoginRequest request)
    {
        var user = await context.Users.SingleOrDefaultAsync(u => u.Username == request.Username);
        if (user is null || !bcrypt.Verify(request.Password, user.PasswordHash))
            return Unauthorized("Неверный логин или пароль");

        List<Claim> claims =
        [
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(ClaimTypes.Name, user.Username),
            new(ClaimTypes.Role, user.Role.ToString())
        ];

        SymmetricSecurityKey key = new(Encoding.UTF8.GetBytes(_settings.Key));
        SigningCredentials creds = new(key, SecurityAlgorithms.HmacSha256);

        JwtSecurityToken token = new(
            issuer: _settings.Issuer,
            audience: _settings.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(12),
            signingCredentials: creds
        );

        // Устанавливаем токен в куки
        Response.Cookies.Append("access_token", new JwtSecurityTokenHandler().WriteToken(token), new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Lax,
            Expires = DateTimeOffset.UtcNow.AddMinutes(12)
        });

        return Ok(new { message = "Авторизация успешна" });
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        Response.Cookies.Delete("access_token");
        return Ok(new { message = "Выход выполнен" });
    }
}