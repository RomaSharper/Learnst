using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Learnst.Dao;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Learnst.Api.Services;

namespace Learnst.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SessionsController(ApplicationDbContext context, IConfiguration configuration) : ControllerBase
{
    [HttpPost("auth")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var user = await context.Users
            .FirstOrDefaultAsync(u => u.Username == request.Login || u.EmailAddress == request.Login);

        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            return Unauthorized(new { message = "Неверный логин или пароль" });
        }

        var token = JwtService.GenerateToken(user, configuration);

        return Ok(new { token });
    }

    [HttpPost("logout")]
    [Authorize] // Только для авторизованных пользователей
    public IActionResult Logout()
    {
        // В JWT нет необходимости очищать токен на сервере, так как он хранится на клиенте
        return Ok(new { success = true });
    }

    [HttpGet("session")]
    [Authorize] // Только для авторизованных пользователей
    public IActionResult CheckSession()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var username = User.FindFirst(ClaimTypes.Name)?.Value;
        var role = User.FindFirst(ClaimTypes.Role)?.Value;

        if (string.IsNullOrEmpty(userId))
            return Unauthorized(new { message = "Ошибка авторизации" });

        return Ok(new { userId, username, role });
    }
}

public class LoginRequest
{
    public string Login { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}
