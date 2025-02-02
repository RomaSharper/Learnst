using Learnst.Api.Services;
using Learnst.Dao;
using Learnst.Dao.Enums;
using Learnst.Dao.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json.Serialization;

namespace Learnst.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OAuth2Controller(
    ApplicationDbContext context,
    IConfiguration config,
    IHttpClientFactory httpClientFactory
) : ControllerBase
{
    [HttpGet("google/init")]
    public IActionResult InitGoogleAuth()
    {
        var state = Guid.NewGuid().ToString("N");
        Response.Cookies.Append("oauth_state", state, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Lax
        });

        var authUrl = $"https://accounts.google.com/o/oauth2/v2/auth?" +
            $"client_id={config["Google:ClientId"]}" +
            $"&redirect_uri={Uri.EscapeDataString("https://api-learnst.runasp.net/api/oauth2/google")}" +
            $"&response_type=code" +
            $"&scope=openid%20email%20profile" +
            $"&state={state}" +
            "&access_type=offline";

        return Redirect(authUrl);
    }

    [HttpGet("google")]
    public async Task<IActionResult> HandleGoogleCallback(
    [FromQuery] string code,
    [FromQuery] string state)
    {
        // Проверка state
        var expectedState = Request.Cookies["oauth_state"];
        if (state != expectedState)
            return BadRequest(new { message = "Некорректный параметр state" });

        // Обмен кода на токен
        var tokenResponse = await GetGoogleToken(code);
        if (!tokenResponse.IsSuccessStatusCode)
        {
            var errorContent = await tokenResponse.Content.ReadAsStringAsync();
            return BadRequest(new { message = $"Ошибка аутентификации через Google: {errorContent}" });
        }

        var tokenData = await tokenResponse.Content.ReadFromJsonAsync<GoogleTokenResponse>();
        if (tokenData?.AccessToken is null)
        {
            return BadRequest(new { message = "Некорректный ответ от Google" });
        }

        // Получение данных пользователя
        var userInfo = await GetUserInfo(tokenData.AccessToken);

        // Проверка подтвержденного email
        if (!userInfo.VerifiedEmail)
        {
            return BadRequest(new { message = "Email не подтвержден Google" });
        }

        // Поиск существующего пользователя
        var existingUser = await context.Users
            .FirstOrDefaultAsync(u => u.EmailAddress == userInfo.Email);

        // Если пользователь существует - авторизуем
        if (existingUser is not null)
        {
            var token = JwtService.GenerateToken(existingUser, config);
            return Redirect($"https://learnst.runasp.net/auth/callback?token={token}");
        }

        // Создание нового пользователя
        var newUser = new User
        {
            GoogleId = userInfo.Id,
            EmailAddress = userInfo.Email,
            Username = await GenerateUniqueUsernameAsync(),
            AvatarUrl = userInfo.Picture,
            Role = Role.User // Устанавливаем роль по умолчанию
        };

        try
        {
            await context.Users.AddAsync(newUser);
            await context.SaveChangesAsync();
        }
        catch (DbUpdateException ex)
        {
            // Логирование ошибки
            return StatusCode(500, new { message = "Ошибка при создании пользователя", stack_trace = ex.ToString() });
        }

        // Генерация токена
        var newToken = JwtService.GenerateToken(newUser, config);
        return Redirect($"https://learnst.runasp.net/auth/callback?token={newToken}");
    }

    private async Task<string> GenerateUniqueUsernameAsync()
    {
        const int maxAttempts = 5;
        Random random = new();

        for (int i = 0; i < maxAttempts; i++)
        {
            var username = GenerateUsernameCandidate(random);
            var exists = await context.Users.AnyAsync(u => u.Username == username);

            if (!exists) return username;
        }

        throw new InvalidOperationException("Не удалось создать уникальное имя пользователя");
    }

    private static string GenerateUsernameCandidate(Random random)
    {
        const string chars = "abcdefghijklmnopqrstuvwxyz0123456789_";
        var length = random.Next(3, 21);
        StringBuilder username = new(length);
        var underscoreAdded = false;

        // Первый символ - буква
        username.Append(chars[random.Next(26)]);

        // Средние символы
        for (int i = 1; i < length - 1; i++)
        {
            if (!underscoreAdded && random.NextDouble() < 0.1)
            {
                username.Append('_');
                underscoreAdded = true;
            }
            else
            {
                username.Append(chars[random.Next(chars.Length - 1)]);
            }
        }

        // Последний символ - буква или цифра
        if (length > 1)
        {
            username.Append(chars[random.Next(36)]); // 26 букв + 10 цифр
        }

        return username.ToString();
    }

    private async Task<HttpResponseMessage> GetGoogleToken(string code)
    {
        using var client = httpClientFactory.CreateClient();

        Dictionary<string, string> requestData = new()
        {
            { "code", code },
            { "client_id", config["Google:ClientId"]! },
            { "client_secret", config["Google:ClientSecret"]! },
            { "redirect_uri", "https://api-learnst.runasp.net/api/oauth2/google" },
            { "grant_type", "authorization_code" }
        };

        return await client.PostAsync("https://oauth2.googleapis.com/token", new FormUrlEncodedContent(requestData));
    }

    private async Task<GoogleUserInfo> GetUserInfo(string accessToken)
    {
        using var client = httpClientFactory.CreateClient();

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await client.GetAsync("https://www.googleapis.com/oauth2/v3/userinfo");

        response.EnsureSuccessStatusCode();

        return await response.Content.ReadFromJsonAsync<GoogleUserInfo>()
            ?? throw new InvalidOperationException("Failed to parse user info");
    }
}
