using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Learnst.Dao;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Learnst.Api.Models;
using Learnst.Api.Services;

namespace Learnst.Api.Controllers;

[ApiController]
[Route("[controller]")]
public class SessionsController(
    JwtService jwtService,
    ApplicationDbContext context
) : ControllerBase
{
    [HttpPost("auth")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var user = await context.Users.FirstOrDefaultAsync(
            u => u.Username == request.Username || u.EmailAddress == request.Username);

        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return Unauthorized(new { message = "Неверный логин или пароль" });

        var token = jwtService.GenerateToken(user);

        return Ok(new { token });
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
