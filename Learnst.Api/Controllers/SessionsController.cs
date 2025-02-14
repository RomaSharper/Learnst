using Microsoft.AspNetCore.Mvc;
using Learnst.Domain;
using Microsoft.EntityFrameworkCore;
using Learnst.Api.Models;
using Learnst.Api.Services;
using Learnst.Domain.Models;
using Learnst.Infrastructure;
using bcrypt = BCrypt.Net.BCrypt;

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
        User? user;
        var userId = HttpContext.Request.Cookies["openid"];

        if (!Guid.TryParse(userId, out var userGuid))
        {
            user = await context.Users.SingleOrDefaultAsync(
                u => u.Username == request.Username || u.EmailAddress == request.Username);

            if (user is null || !bcrypt.Verify(request.Password, user.PasswordHash))
                return Unauthorized(new { message = "Неверный логин или пароль" });

            return Ok(new { token = jwtService.GenerateToken(user) });
        }

        user = await context.Users.SingleOrDefaultAsync(u => u.Id == userGuid);
        if (user is null)
        {
            HttpContext.Response.Cookies.Delete("openid");
            return NotFound(new { message = "Пользователь с таким ID не найден" });
        }

        HttpContext.Response.Cookies.Append("openid", user.Id.ToString());
        return Ok(jwtService.GenerateToken(user));
    }

    [HttpGet("check")]
    public async Task<IActionResult> CheckSession()
    {
        var userId = HttpContext.Request.Cookies["openid"];
        if (string.IsNullOrEmpty(userId))
        {
            HttpContext.Response.Cookies.Delete("openid");
            return Unauthorized(new { message = "Ошибка авторизации" });
        }

        if (!Guid.TryParse(userId, out var userGuid))
        {
            HttpContext.Response.Cookies.Delete("openid");
            return BadRequest(new { message = "Неверный ID" });
        }

        var user = await context.Users.SingleOrDefaultAsync(u => u.Id == userGuid);
        if (user is null)
        {
            HttpContext.Response.Cookies.Delete("openid");
            return Unauthorized(new { message = "Ошибка авторизации" });
        }

        return Ok(new { userId = user.Id, username = user.Username, role = user.Role });
    }
}
