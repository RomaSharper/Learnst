using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Mvc;
using Learnst.Api.Models;
using Learnst.Api.Services;
using Learnst.Infrastructure.Exceptions;
using Learnst.Infrastructure.Interfaces;
using Learnst.Infrastructure.Models;
using AccessViolationException = System.AccessViolationException;
using bcrypt = BCrypt.Net.BCrypt;

namespace Learnst.Api.Controllers;

[ApiController]
[Route("[controller]")]
public class SessionsController(
    JwtService jwtService,
    IAsyncRepository<User, Guid> usersRepository
) : ControllerBase
{
    [HttpPost("Auth")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        try
        {
            // Ищем пользователя по username/email
            var user = await usersRepository.GetFirstAsync(
                where: u => u.Username == request.Login || u.EmailAddress == request.Login);

            if (!bcrypt.Verify(request.Password, user.PasswordHash))
                throw new AccessViolationException("Неверный логин или пароль");

            // Генерируем JWT-токен
            var token = jwtService.GenerateToken(user);

            Response.Cookies.Append(
                "auth-token",
                token,
                new CookieOptions
                {
                    Secure = true, // Кука отправляется только через HTTPS
                    HttpOnly = true, // Защита от доступа через JavaScript
                    SameSite = SameSiteMode.Strict, // Защита от CSRF
                    Expires = DateTime.UtcNow.AddHours(1)
                });

            return Ok(new { token }); // Токен также можно вернуть в теле ответа для удобства клиента
        }
        catch (AccessViolationException ave)
        {
            return Unauthorized(new ErrorResponse(ave));
        }
        catch (NotFoundException<User> nfe)
        {
            return NotFound(new ErrorResponse(nfe));
        }
        catch (Exception ex)
        {
            return BadRequest(new ErrorResponse(ex));
        }
    }

    [HttpGet("Check")]
public async Task<IActionResult> CheckSession()
{
    try
    {
        // Извлекаем куку "auth-token"
        var authCookie = HttpContext.Request.Cookies["auth-token"];
        if (string.IsNullOrEmpty(authCookie))
            throw new UnauthorizedAccessException("Токен отсутствует");

        // Проверяем валидность токена
        JwtSecurityTokenHandler handler = new();
        var decodedToken = handler.ReadJwtToken(authCookie);

        // Извлекаем userId из токена
        var openidClaim = decodedToken.Claims.FirstOrDefault(c => c.Type == "openid")?.Value;
        if (string.IsNullOrEmpty(openidClaim) || !Guid.TryParse(openidClaim, out var userId))
            throw new NotFoundException<User>("OpenID не найден");

        // Получаем пользователя из базы данных
        var user = await usersRepository.GetByIdAsync(userId);
        if (user is null)
            throw new NotFoundException<User>(userId);

        // Проверяем время истечения токена
        var expiryDateUnix = long.Parse(decodedToken.Claims.FirstOrDefault(c => c.Type == "exp")?.Value 
            ?? throw new InvalidOperationException("Токен не содержит времени истечения"));
        var expiryDateTimeUtc = new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc).AddSeconds(expiryDateUnix);

        if (expiryDateTimeUtc >= DateTime.UtcNow)
            return Ok(new { token = authCookie });
        
        // Если токен истёк, генерируем новый
        var newToken = jwtService.GenerateToken(user);

        // Обновляем куку "auth-token"
        Response.Cookies.Append(
            "auth-token",
            newToken,
            new CookieOptions
            {
                Secure = true, // Кука отправляется только через HTTPS
                HttpOnly = true, // Защита от доступа через JavaScript
                Domain = ".runasp.net", // Видимость куки на всех поддоменах *.runasp.net
                SameSite = SameSiteMode.Strict, // Защита от CSRF
                Expires = DateTime.UtcNow.AddHours(1) // Обновляем срок действия куки
            });

        return Ok(new { token = newToken });
    }
    catch (NotFoundException<User> nfe)
    {
        // Удаляем куку при ошибке поиска пользователя
        Response.Cookies.Delete("auth-token");
        return Unauthorized(new ErrorResponse(nfe));
    }
    catch (UnauthorizedAccessException uae)
    {
        // Удаляем куку при отсутствии токена
        Response.Cookies.Delete("auth-token");
        return Unauthorized(new ErrorResponse(uae));
    }
    catch (Exception ex)
    {
        // Удаляем куку при любой другой ошибке
        Response.Cookies.Delete("auth-token");
        return BadRequest(new ErrorResponse(ex));
    }
}

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        // Удаляем куку Authorization
        Response.Cookies.Delete("auth-token");
        return Ok(new { message = "Выход выполнен успешно." });
    }
}
