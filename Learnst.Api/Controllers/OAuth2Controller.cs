using System.Globalization;
using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using Learnst.Api.Models;
using Learnst.Api.Services;
using Learnst.Domain.Enums;
using Learnst.Infrastructure;
using Learnst.Infrastructure.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Learnst.Api.Controllers;

[ApiController]
[Route("[controller]")]
public partial class OAuth2Controller(
    JwtService jwtService,
    ApplicationDbContext context,
    IOptions<VkSettings> vkSettings,
    IOptions<SftpSettings> sftpSettings,
    IHttpClientFactory httpClientFactory,
    // IOptions<AppleSettings> appleSettings,
    IOptions<SteamSettings> steamSettings,
    IOptions<GoogleSettings> googleSettings,
    IOptions<YandexSettings> yandexSettings,
    IOptions<MailRuSettings> mailRuSettings,
    IOptions<GithubSettings> githubSettings,
    IOptions<TwitchSettings> twitchSettings,
    IOptions<TikTokSettings> tiktokSettings,
    IOptions<DiscordSettings> discordSettings,
    IOptions<FacebookSettings> facebookSettings,
    // IOptions<TelegramSettings> telegramSettings,
    IOptions<MicrosoftSettings> microsoftSettings,
    IOptions<EpicGamesSettings> epicGamesSettings
) : ControllerBase
{
    private readonly VkSettings _vkSettings = vkSettings.Value;
    private readonly SftpSettings _sftpSettings = sftpSettings.Value;
    // private readonly AppleSettings _appleSettings = appleSettings.Value;
    private readonly SteamSettings _steamSettings = steamSettings.Value;
    private readonly GithubSettings _githubSettings = githubSettings.Value;
    private readonly TwitchSettings _twitchSettings = twitchSettings.Value;
    private readonly TikTokSettings _tiktokSettings = tiktokSettings.Value;
    private readonly GoogleSettings _googleSettings = googleSettings.Value;
    private readonly YandexSettings _yandexSettings = yandexSettings.Value;
    private readonly MailRuSettings _mailRuSettings = mailRuSettings.Value;
    private readonly DiscordSettings _discordSettings = discordSettings.Value;
    private readonly FacebookSettings _facebookSettings = facebookSettings.Value;
    // private readonly TelegramSettings _telegramSettings = telegramSettings.Value;
    private readonly MicrosoftSettings _microsoftSettings = microsoftSettings.Value;
    private readonly EpicGamesSettings _epicGamesSettings = epicGamesSettings.Value;

    #region Helpers

    private static string SanitizeUsername(string input) => SanitizedNameRegex().Replace(input, string.Empty);

    private async Task<User> FindOrCreateUser(
        string? email,
        string externalLoginId,
        ExternalLoginType externalLoginType,
        string? avatar = null,
        string? usernameBase = null,
        string? fullName = null,
        DateOnly? dateOfBirth = null)
    {
        var user = await context.Users.FirstOrDefaultAsync(u =>
            u.EmailAddress == email ||
            (u.ExternalLoginId == externalLoginId &&
             u.ExternalLoginType == externalLoginType));

        if (user is null)
        {
            user = new User
            {
                AvatarUrl = avatar,
                FullName = fullName,
                EmailAddress = email,
                DateOfBirth = dateOfBirth,
                ExternalLoginId = externalLoginId,
                ExternalLoginType = externalLoginType,
                Username = usernameBase is null
                    ? await GenerateUniqueUsernameAsync()
                    : await GenerateUniqueUsernameAsync(usernameBase)
            };
            await context.Users.AddAsync(user);
        }
        else
        {
            user.AvatarUrl = avatar ?? user.AvatarUrl;
            user.FullName = fullName ?? user.FullName;
            user.DateOfBirth = dateOfBirth ?? user.DateOfBirth;
        }

        await context.SaveChangesAsync();
        return user;
    }

    private RedirectResult RedirectWithToken(User user)
    {
        var token = jwtService.GenerateToken(user);
        return Redirect($"https://learnst.runasp.net/auth/callback?token={token}");
    }

    private async Task<string> GenerateUniqueUsernameAsync()
    {
        const int maxAttempts = 5;
        Random random = new();

        for (var i = 0; i < maxAttempts; i++)
        {
            var username = GenerateUsernameCandidate(random);
            var exists = await context.Users.AnyAsync(u => u.Username == username);
            if (!exists) return username;
        }

        throw new InvalidOperationException("Не удалось создать уникальное имя пользователя");
    }

    private async Task<string> GenerateUniqueUsernameAsync(string baseName)
    {
        const int maxAttempts = 5;
        var random = new Random();

        for (var i = 0; i < maxAttempts; i++)
        {
            var username = string.IsNullOrEmpty(baseName)
                ? GenerateUsernameCandidate(random)
                : $"{baseName}_{GenerateUsernameCandidate(random, 20 - baseName.Length, false)}";
            var exists = await context.Users.AnyAsync(u => u.Username == username);
            if (!exists) return username;
        }

        throw new InvalidOperationException("Failed to generate unique username");
    }

    private static string GenerateUsernameCandidate(Random random, int maxLength = 20, bool allowUnderscore = true)
    {
        const string chars = "abcdefghijklmnopqrstuvwxyz0123456789";
        var length = random.Next(3, maxLength);
        StringBuilder username = new(length);
        var underscoreAdded = false;

        // Первый символ - буква
        username.Append(chars[random.Next(chars.Length)]);

        // Средние символы
        for (var i = 0; i < length; i++)
        {
            if (!underscoreAdded && allowUnderscore && random.NextDouble() < 0.1)
            {
                username.Append('_');
                underscoreAdded = true;
                continue;
            }
            username.Append(chars[random.Next(chars.Length - 1)]);
        }

        // Последний символ - буква или цифра
        if (length > 1)
            username.Append(chars[random.Next(36)]); // 26 букв + 10 цифр

        return username.ToString();
    }

    [GeneratedRegex(@"[^a-zA-Z0-9_\-]")]
    private static partial Regex SanitizedNameRegex();

    #endregion

    #region Google
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
            $"client_id={_googleSettings.ClientId}" +
            $"&redirect_uri={Uri.EscapeDataString(_googleSettings.RedirectUri)}" +
            $"&response_type=code" +
            $"&scope=openid%20email%20profile" +
            $"&state={state}" +
            "&access_type=offline";

        return Redirect(authUrl);
    }

    [HttpGet("google/callback")]
    public async Task<IActionResult> HandleGoogleCallback(
        [FromQuery] string code,
        [FromQuery] string state
    )
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
            return BadRequest(new { message = "Некорректный ответ от Google" });

        // Получение данных пользователя
        var userInfo = await GetUserInfo(tokenData.AccessToken);

        // Проверка подтвержденного email
        if (!userInfo.VerifiedEmail)
            return BadRequest(new { message = "Email не подтвержден Google" });

        // Поиск существующего пользователя
        var existingUser = await context.Users
            .FirstOrDefaultAsync(u => u.EmailAddress == userInfo.Email);

        // Если пользователь существует - авторизуем
        if (existingUser is not null)
            return RedirectWithToken(existingUser);

        // Создание нового пользователя
        User newUser = new()
        {
            Role = Role.User,
            AvatarUrl = userInfo.Picture,
            EmailAddress = userInfo.Email,
            ExternalLoginId = userInfo.Id,
            ExternalLoginType = ExternalLoginType.Google,
            Username = await GenerateUniqueUsernameAsync(),
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

        return RedirectWithToken(newUser);
    }

    private async Task<HttpResponseMessage> GetGoogleToken(string code)
    {
        using var client = httpClientFactory.CreateClient();

        Dictionary<string, string> requestData = new()
        {
            { "code", code },
            { "client_id", _googleSettings.ClientId },
            { "client_secret", _googleSettings.ClientSecret },
            { "redirect_uri", _googleSettings.RedirectUri },
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
    #endregion

    #region Yandex
    [HttpGet("yandex/init")]
    public IActionResult InitYandexAuth()
    {
        var state = Guid.NewGuid().ToString("N");
        Response.Cookies.Append("oauth_state", state, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Lax
        });

        var authUrl = "https://oauth.yandex.ru/authorize?" +
            $"client_id={_yandexSettings.ClientId}" +
            $"&redirect_uri={Uri.EscapeDataString(_yandexSettings.RedirectUri)}" +
            "&response_type=code" +
            $"&state={state}";

        return Redirect(authUrl);
    }

    [HttpGet("yandex/callback")]
    public async Task<IActionResult> HandleYandexCallback(
        [FromQuery] string code,
        [FromQuery] string state
    )
    {
        // Проверка state
        var expectedState = Request.Cookies["oauth_state"];
        if (state != expectedState)
            return BadRequest(new { message = "Invalid state parameter" });

        // Обмен кода на токен
        var tokenResponse = await GetYandexToken(code);
        if (!tokenResponse.IsSuccessStatusCode)
        {
            var errorContent = await tokenResponse.Content.ReadAsStringAsync();
            return BadRequest(new { message = $"Yandex auth error: {errorContent}" });
        }

        var tokenData = await tokenResponse.Content.ReadFromJsonAsync<YandexTokenResponse>();
        if (string.IsNullOrEmpty(tokenData?.AccessToken))
            return BadRequest(new { message = "Invalid Yandex response" });

        // Получение данных пользователя
        var userInfo = await GetYandexUserInfo(tokenData.AccessToken);

        // Поиск/создание пользователя
        var user = await FindOrCreateUser(userInfo.DefaultEmail, userInfo.Id, ExternalLoginType.Google, $"https://avatars.yandex.net/get-yapic/{userInfo.DefaultAvatarId}/islands-200");

        return RedirectWithToken(user);
    }

    private async Task<HttpResponseMessage> GetYandexToken(string code)
    {
        using var client = httpClientFactory.CreateClient();

        HttpRequestMessage request = new(HttpMethod.Post, "https://oauth.yandex.ru/token")
        {
            Content = new FormUrlEncodedContent(new Dictionary<string, string>
            {
                {"grant_type", "authorization_code"},
                {"code", code},
                {"client_id", _yandexSettings.ClientId},
                {"client_secret", _yandexSettings.ClientSecret}
            })
        };

        return await client.SendAsync(request);
    }

    private async Task<YandexUserInfo> GetYandexUserInfo(string accessToken)
    {
        using var client = httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("OAuth", accessToken);

        var response = await client.GetAsync("https://login.yandex.ru/info?format=json");
        response.EnsureSuccessStatusCode();

        return await response.Content.ReadFromJsonAsync<YandexUserInfo>()
            ?? throw new InvalidOperationException("Failed to parse Yandex user info");
    }
    #endregion

    #region Microsoft (Санкции)
    [HttpGet("microsoft/init")]
    public IActionResult InitMicrosoftAuth()
    {
        var state = Guid.NewGuid().ToString("N");
        Response.Cookies.Append("oauth_state", state, new CookieOptions
        {
            Secure = true,
            HttpOnly = true,
            SameSite = SameSiteMode.Lax
        });

        var authUrl = "https://login.live.com/oauth20_authorize.srf?" +
            $"client_id={_microsoftSettings.ClientId}" +
            $"&redirect_uri={Uri.EscapeDataString("https://api-learnst.runasp.net/oauth2/microsoft")}" +
            "&response_type=code" +
            "&scope=wl.emails%20wl.signin" + // Доступ к email и базовой информации
            $"&state={state}";

        return Redirect(authUrl);
    }

    [HttpGet("microsoft/callback")]
    public async Task<IActionResult> HandleMicrosoftCallback(
        [FromQuery] string code,
        [FromQuery] string state
    )
    {
        var expectedState = Request.Cookies["oauth_state"];
        if (state != expectedState)
            return BadRequest(new { message = "Неверный параметр состояния" });

        var tokenResponse = await GetMicrosoftToken(code);
        if (!tokenResponse.IsSuccessStatusCode)
        {
            var errorContent = await tokenResponse.Content.ReadAsStringAsync();
            return BadRequest(new { message = $"Ошибка авторизации Microsoft: {errorContent}" });
        }

        var tokenData = await tokenResponse.Content.ReadFromJsonAsync<MicrosoftTokenResponse>();
        if (tokenData?.AccessToken is null)
            return BadRequest(new { message = "Неверный ответ от Microsoft" });

        var userInfo = await GetMicrosoftUserInfo(tokenData.AccessToken);

        if (string.IsNullOrEmpty(userInfo.Mail) && string.IsNullOrEmpty(userInfo.UserPrincipalName))
            return BadRequest(new { message = "Почта не была поставлена от Microsoft" });

        var userPhoto = await GetMicrosoftUserPhoto(tokenData.AccessToken);
        var extension = userPhoto.ContentType!.Split('/').Last();
        var fileName = $"{Guid.NewGuid():N}.{extension}";

        var avatarUrl = FileService.Upload(userPhoto.Data!, userPhoto.ContentType, fileName, _sftpSettings);

        var existingUser = await context.Users.FirstOrDefaultAsync(u => u.EmailAddress == userInfo.Mail
            || u.ExternalLoginId == userInfo.Id
            && u.ExternalLoginType == ExternalLoginType.Microsoft);

        if (existingUser is not null)
            return RedirectWithToken(existingUser);

        var user = await FindOrCreateUser(userInfo.Mail, userInfo.Id, ExternalLoginType.Microsoft, avatarUrl);

        return RedirectWithToken(user);
    }

    private async Task<HttpResponseMessage> GetMicrosoftToken(string code)
    {
        using var client = httpClientFactory.CreateClient();

        Dictionary<string, string> requestData = new()
        {
            {"client_id", _microsoftSettings.ClientId},
            {"client_secret", _microsoftSettings.ClientSecret},
            {"code", code},
            {"redirect_uri", _microsoftSettings.RedirectUri},
            {"grant_type", "authorization_code"},
            {"scope", "openid email profile User.Read"}
        };

        return await client.PostAsync(
            "https://login.microsoftonline.com/common/oauth2/v2.0/token",
            new FormUrlEncodedContent(requestData));
    }

    private async Task<MicrosoftUserInfo> GetMicrosoftUserInfo(string accessToken)
    {
        using var client = httpClientFactory.CreateClient();

        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await client.GetAsync("https://graph.microsoft.com/v1.0/me");
        response.EnsureSuccessStatusCode();

        return await response.Content.ReadFromJsonAsync<MicrosoftUserInfo>()
            ?? throw new InvalidOperationException("Failed to parse Microsoft user info");
    }

    private async Task<MicrosoftUserPhoto> GetMicrosoftUserPhoto(string accessToken)
    {
        using var client = httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        try
        {
            var response = await client.GetAsync("https://graph.microsoft.com/v1.0/me/photo/$value");

            if (!response.IsSuccessStatusCode)
                return new MicrosoftUserPhoto();

            var contentType = response.Content.Headers.ContentType?.MediaType;
            var data = await response.Content.ReadAsByteArrayAsync();
            return new MicrosoftUserPhoto { Data = data, ContentType = contentType };
        }
        catch
        {
            return new MicrosoftUserPhoto();
        }
    }
    #endregion

    #region Vk

    [HttpGet("vk/init")]
    public IActionResult InitVkAuth()
    {
        var state = Guid.NewGuid().ToString("N");
        Response.Cookies.Append("oauth_state", state, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Lax
        });

        var authUrl = "https://oauth.vk.com/authorize?" +
            $"client_id={_vkSettings.ClientId}" +
            $"&redirect_uri={Uri.EscapeDataString(_vkSettings.RedirectUri)}" +
            "&response_type=code" +
            "&scope=email" +
            "&v=5.131" + // Версия API обязательна
            $"&state={state}";

        return Redirect(authUrl);
    }

    [HttpGet("vk/callback")]
    public async Task<IActionResult> HandleVkCallback(
        [FromQuery] string code,
        [FromQuery] string state)
    {
        // Проверка state
        var expectedState = Request.Cookies["oauth_state"];
        if (state != expectedState) return BadRequest("Invalid state");

        // Получение токена
        var tokenResponse = await httpClientFactory.CreateClient().GetAsync(
            "https://oauth.vk.com/access_token?" +
            $"client_id={_vkSettings.ClientId}" +
            $"&client_secret={_vkSettings.ClientSecret}" +
            $"&code={code}" +
            $"&redirect_uri={Uri.EscapeDataString(_vkSettings.RedirectUri)}");

        var tokenData = await tokenResponse.Content.ReadFromJsonAsync<VkTokenResponse>();
        if (tokenData?.AccessToken is null) return BadRequest("VK auth failed");

        // Получение данных пользователя
        var userInfoResponse = await httpClientFactory.CreateClient().GetAsync(
            "https://api.vk.com/method/users.get?" +
            $"user_ids={tokenData.UserId}" +
            "&fields=photo_200,has_email" +
            $"&access_token={tokenData.AccessToken}" +
            "&v=5.131");

        var userInfo = (await userInfoResponse.Content.ReadFromJsonAsync<VkUserResponse>())?.Response.FirstOrDefault();

        // Парсинг даты рождения
        DateOnly? birthDate = null;
        if (!string.IsNullOrEmpty(userInfo?.BirthDate) &&
            DateOnly.TryParseExact(userInfo.BirthDate, "dd.MM.yyyy", out var parsedDate))
            birthDate = parsedDate;

        // Обработка пользователя
        var user = await FindOrCreateUser(
            email: tokenData.Email,
            externalLoginId: tokenData.UserId.ToString(),
            externalLoginType: ExternalLoginType.Vk,
            avatar: userInfo?.Photo200,
            dateOfBirth: birthDate,
            fullName: $"{userInfo?.FirstName} {userInfo?.LastName}".Trim());

        return RedirectWithToken(user);
    }

    #endregion

    #region Mail.ru

    [HttpGet("mailru/init")]
    public IActionResult InitMailRuAuth()
    {
        var state = Guid.NewGuid().ToString("N");
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Lax,
            Expires = DateTime.UtcNow.AddMinutes(5)
        };
        
        Response.Cookies.Append("mailru_oauth_state", state, cookieOptions);

        var authUrl = new StringBuilder("https://oauth.mail.ru/login?")
            .Append($"client_id={Uri.EscapeDataString(_mailRuSettings.ClientId)}")
            .Append($"&redirect_uri={Uri.EscapeDataString(_mailRuSettings.RedirectUri)}")
            .Append("&response_type=code")
            .Append("&scope=userinfo.email+userinfo.name+userinfo.birthday+userinfo.avatar")
            .Append($"&state={state}")
            .ToString();

        return Redirect(authUrl);
    }

    [HttpGet("mailru/callback")]
    public async Task<IActionResult> HandleMailRuCallback(
        [FromQuery] string code,
        [FromQuery] string state)
    {
        try
        {
            // Validate state
            var expectedState = Request.Cookies["mailru_oauth_state"];
            if (state != expectedState)
                return BadRequest("Неверное состояние OAuth");

            // Get access token
            var tokenResponse = await httpClientFactory.CreateClient().PostAsync(
                "https://oauth.mail.ru/token",
                new FormUrlEncodedContent(new Dictionary<string, string>
                {
                    {"client_id", _mailRuSettings.ClientId},
                    {"client_secret", _mailRuSettings.ClientSecret},
                    {"code", code},
                    {"grant_type", "authorization_code"},
                    {"redirect_uri", _mailRuSettings.RedirectUri}
                }));

            if (!tokenResponse.IsSuccessStatusCode)
                return BadRequest("Не удалось получить токен доступа");

            var tokenData = await tokenResponse.Content.ReadFromJsonAsync<MailRuTokenResponse>();
            if (string.IsNullOrEmpty(tokenData?.AccessToken))
                return BadRequest("Неверный токен");

            // Get user info
            var userInfo = await GetMailRuUserInfo(tokenData.AccessToken);
            if (userInfo is null)
                return BadRequest("Не удалось получить информацию о пользователе");

            // Process user data
            var user = await FindOrCreateUser(
                userInfo.Email,
                userInfo.Id,
                ExternalLoginType.MailRu,
                avatar: string.IsNullOrEmpty(userInfo.Image)
                    ? $"https://avatar.mail.ru/{userInfo.Id}/{userInfo.DefaultAvatarId}"
                    : userInfo.Image,
                fullName: $"{userInfo.LastName} {userInfo.FirstName} {userInfo.Patronymic}",
                dateOfBirth: ParseBirthDate(userInfo.Birthday));
            
            var token = jwtService.GenerateToken(user);
            return Redirect($"/auth-complete?token={token}");
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Ошибка сервера: {ex.Message}");
        }
    }
    
    private static DateOnly? ParseBirthDate(string? dateStr)
    {
        if (string.IsNullOrEmpty(dateStr)) return null;

        var formats = new[] { "dd.MM.yyyy", "yyyy-MM-dd" };
        foreach (var format in formats)
        {
            if (DateOnly.TryParseExact(dateStr, format, 
                CultureInfo.InvariantCulture, 
                DateTimeStyles.None, 
                out var date))
            {
                return date;
            }
        }
        return null;
    }

    private async Task<MailRuUserInfo?> GetMailRuUserInfo(string accessToken)
    {
        var client = httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Authorization = 
            new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await client.GetAsync("https://oauth.mail.ru/userinfo");
        if (!response.IsSuccessStatusCode) return null;

        return await response.Content.ReadFromJsonAsync<MailRuUserInfo>();
    }

    #endregion

    #region Одноклассники (Не работает)
    [HttpGet("ok/init")]
    public IActionResult InitOkAuth()
    {
        var state = Guid.NewGuid().ToString("N");
        Response.Cookies.Append("oauth_state", state, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Lax
        });

        var authUrl = "https://connect.ok.ru/oauth/authorize?" +
            $"client_id={_vkSettings.ClientId}" +
            "&scope=VALUABLE_ACCESS;GET_EMAIL" +
            "&response_type=code" +
            $"&redirect_uri={Uri.EscapeDataString(_vkSettings.RedirectUri)}" +
            $"&state={state}";

        return Redirect(authUrl);
    }

    [HttpGet("ok/callback")]
    public async Task<IActionResult> HandleOkCallback(
        [FromQuery] string code,
        [FromQuery] string state)
    {
        // Проверка state
        var expectedState = Request.Cookies["oauth_state"];
        if (state != expectedState) return BadRequest("Invalid state");

        // Подпись запроса для OK API
        var sig = GenerateOkSignature(
            code: code,
            clientSecret: _vkSettings.ClientSecret);

        // Получение токена
        var tokenResponse = await httpClientFactory.CreateClient().GetAsync(
            "https://api.ok.ru/oauth/token.do?" +
            $"client_id={_vkSettings.ClientId}" +
            $"&client_secret={_vkSettings.ClientSecret}" +
            $"&code={code}" +
            "&grant_type=authorization_code" +
            $"&redirect_uri={Uri.EscapeDataString(_vkSettings.RedirectUri.Replace("/vk", "/ok"))}" +
            $"&sig={sig}");

        var tokenData = await tokenResponse.Content.ReadFromJsonAsync<OkTokenResponse>();
        if (tokenData?.AccessToken is null) return BadRequest("OK auth failed");

        // Получение данных пользователя
        var userInfo = await GetOkUserInfo(tokenData.AccessToken, _vkSettings);

        // Обработка пользователя
        var user = await FindOrCreateUser(
            email: userInfo?.Email,
            externalLoginId: userInfo?.Uid!,
            externalLoginType: ExternalLoginType.Ok,
            avatar: userInfo?.Pic1024x768);

        return RedirectWithToken(user);
    }

    private static string GenerateOkSignature(string code, string clientSecret)
    {
        var paramsStr = $"code={code}grant_type=authorization_code{clientSecret}";
        return Convert.ToHexStringLower(MD5.HashData(Encoding.UTF8.GetBytes(paramsStr)));
    }

    private async Task<OkUserInfo?> GetOkUserInfo(string accessToken, VkSettings settings)
    {
        var sig = GenerateOkMethodSignature(
            method: "users.getCurrentUser",
            accessToken: accessToken,
            clientSecret: settings.ClientSecret);

        return await httpClientFactory.CreateClient().GetFromJsonAsync<OkUserInfo>(
            "https://api.ok.ru/fb.do?" +
            $"application_key={settings.ClientId}" +
            "&format=json" +
            "&method=users.getCurrentUser" +
            $"&access_token={accessToken}" +
            $"&sig={sig}");
    }

    private static string GenerateOkMethodSignature(string method, string accessToken, string clientSecret)
    {
        var paramsStr = $"application_key={method}format=jsonmethod={method}{accessToken}{clientSecret}";
        return Convert.ToHexStringLower(MD5.HashData(Encoding.UTF8.GetBytes(paramsStr)));
    }

    #endregion

    #region Apple (99 баксов в год)

    /*[HttpGet("apple/init")]
    public IActionResult InitAppleAuth()
    {
        var state = Guid.NewGuid().ToString("N");
        var nonce = Guid.NewGuid().ToString("N");

        Response.Cookies.Append("oauth_state", state, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Lax
        });

        Response.Cookies.Append("apple_nonce", nonce, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Lax
        });

        var authUrl = "https://appleid.apple.com/auth/authorize?" +
            $"response_type=code" +
            $"&response_mode=form_post" +
            $"&client_id={_appleSettings.ClientId}" +
            $"&redirect_uri={Uri.EscapeDataString(_appleSettings.RedirectUri)}" +
            $"&state={state}" +
            $"&scope=name%20email" +
            $"&nonce={nonce}";

        return Redirect(authUrl);
    }

    [HttpPost("apple/callback")]
    public async Task<IActionResult> HandleAppleCallback([FromForm] AppleAuthResponse response)
    {
        // Проверка state
        var expectedState = Request.Cookies["oauth_state"];
        if (response.State != expectedState)
            return BadRequest("Invalid state");

        // Генерация JWT для запроса токена
        var clientSecret = GenerateAppleClientSecret();

        // Обмен кода на токен
        var tokenResponse = await httpClientFactory.CreateClient().PostAsync(
            "https://appleid.apple.com/auth/token",
            new FormUrlEncodedContent(new Dictionary<string, string>
            {
            {"client_id", _appleSettings.ClientId},
            {"client_secret", clientSecret},
            {"code", response.Code},
            {"grant_type", "authorization_code"},
            {"redirect_uri", _appleSettings.RedirectUri}
            }));

        var tokenData = await tokenResponse.Content.ReadFromJsonAsync<AppleTokenResponse>();
        if (tokenData?.IdToken is null) return BadRequest("Apple auth failed");

        // Декодирование JWT
        var handler = new JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(tokenData.IdToken);

        // Получение данных пользователя
        var email = jwt.Claims.FirstOrDefault(c => c.Type == "email")?.Value;
        var userId = jwt.Claims.FirstOrDefault(c => c.Type == "sub")?.Value;

        if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(userId))
            return BadRequest("Missing user data from Apple");

        // Обработка пользователя
        var user = await FindOrCreateUser(
            email: email,
            externalLoginId: userId,
            externalLoginType: ExternalLoginType.Apple);

        return RedirectWithToken(user);
    }

    private string GenerateAppleClientSecret()
    {
        var now = DateTimeOffset.UtcNow;
        var privateKey = System.IO.File.ReadAllText(_appleSettings.KeyPath);

        var payload = new Dictionary<string, object>
        {
            {"iss", _appleSettings.TeamId},
            {"iat", now.ToUnixTimeSeconds()},
            {"exp", now.AddMinutes(5).ToUnixTimeSeconds()},
            {"aud", "https://appleid.apple.com"},
            {"sub", _appleSettings.ClientId}
        };

        var header = new Dictionary<string, object>
        {
            {"alg", "ES256"},
            {"kid", _appleSettings.KeyId}
        };

        return JWT.Encode(
            payload,
            ECKey.CreateFromPem(privateKey),
            JwsAlgorithm.ES256,
            header);
    }*/

    #endregion

    #region Telegram (Не работает)

    /*[HttpGet("telegram/init")]
    public async Task<IActionResult> InitTelegramAuth()
    {
        try
        {
            var botTokenParts = _telegramSettings.BotToken.Split(':');
            if (botTokenParts.Length < 2)
                throw new ArgumentException("Invalid BotToken format");

            var botId = botTokenParts[0];
            var domain = new Uri(_telegramSettings.RedirectUri).Host;

            var authUrl = $"https://oauth.telegram.org/auth?" +
                $"bot_id={botId}" +
                $"&origin={Uri.EscapeDataString(domain)}" +
                $"&redirect_uri={_telegramSettings.RedirectUri}" +
                "&request_access=write";

            // Логирование для отладки
            await LogService.WriteLine($"Generated auth URL: {authUrl}");
            return Redirect(authUrl);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Error initializing Telegram auth: {ex.Message}");
        }
    }

    [HttpGet("telegram/callback")]
    public async Task<IActionResult> HandleTelegramCallback([FromQuery] TelegramAuthResponse response)
    {
        try
        {
            // 1. Проверка времени авторизации (максимум 1 день)
            if ((DateTimeOffset.UtcNow.ToUnixTimeSeconds() - response.AuthDate) > 86400)
                return BadRequest("Данные устарели");


            // 2. Проверка подписи
            var botId = _telegramSettings.BotToken.Split(':')[0];
            var dataCheckString = response.GetCheckString(botId);
            var secretKey = SHA256.HashData(Encoding.UTF8.GetBytes(_telegramSettings.BotToken));
            var computedHash = ComputeTelegramHash(dataCheckString, secretKey);

            if (response.Hash != computedHash)
                return BadRequest("Неверная подпись");

            // 3. Создание пользователя
            var user = await FindOrCreateUser(
                email: null,
                externalLoginId: response.Id.ToString(),
                externalLoginType: ExternalLoginType.Telegram,
                fullName: $"{response.FirstName} {response.LastName}".Trim(),
                avatar: response.PhotoUrl);

            await LogService.WriteLine($"Telegram response: {JsonSerializer.Serialize(response)}");
            await LogService.WriteLine($"Data check string: {dataCheckString}");
            await LogService.WriteLine($"Computed hash: {computedHash}");
            await LogService.WriteLine($"Expected hash: {response.Hash}");

            return RedirectWithToken(user);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                error = ex.Message,
                stackTrace = ex.StackTrace,
                message = "Ошибка аутентификации через Telegram"
            });
        }
    }

    private static string ComputeTelegramHash(string dataCheckString, byte[] secretKey)
    {
        using var hmac = new HMACSHA256(secretKey);
        var hashBytes = hmac.ComputeHash(Encoding.UTF8.GetBytes(dataCheckString));
        return Convert.ToHexStringLower(hashBytes);
    }

    private byte[] GetTelegramSecretKey()
    {
        using HMACSHA256 hmac = new(Encoding.UTF8.GetBytes(_telegramSettings.BotToken));
        return hmac.ComputeHash(Encoding.UTF8.GetBytes("WebAppData"));
    }*/

    #endregion

    #region GitHub

    [HttpGet("github/init")]
    public IActionResult InitGitHubAuth()
    {
        var state = Guid.NewGuid().ToString("N");
        Response.Cookies.Append("oauth_state", state, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Lax
        });

        var authUrl = "https://github.com/login/oauth/authorize?" +
            $"client_id={_githubSettings.ClientId}" +
            $"&redirect_uri={Uri.EscapeDataString(_githubSettings.RedirectUri)}" +
            $"&state={state}";

        return Redirect(authUrl);
    }

    [HttpGet("github/callback")]
    public async Task<IActionResult> HandleGitHubCallback(
        [FromQuery] string code,
        [FromQuery] string state
    )
    {
        var expectedState = Request.Cookies["oauth_state"];
        if (state != expectedState) return BadRequest("Invalid state");

        try
        {
            // 1. Получение токена
            using var client = httpClientFactory.CreateClient();

            // Добавляем заголовок Accept для GitHub API
            client.DefaultRequestHeaders.Accept.Add(
                new MediaTypeWithQualityHeaderValue("application/json"));

            var tokenResponse = await client.PostAsync(
                "https://github.com/login/oauth/access_token",
                new FormUrlEncodedContent(new Dictionary<string, string>
                {
                    {"client_id", _githubSettings.ClientId},
                    {"client_secret", _githubSettings.ClientSecret},
                    {"code", code},
                    {"redirect_uri", _githubSettings.RedirectUri}
                }));

            // 2. Обработка ошибок токена
            if (!tokenResponse.IsSuccessStatusCode)
            {
                var errorContent = await tokenResponse.Content.ReadAsStringAsync();
                return StatusCode(500, $"GitHub token error: {errorContent}");
            }

            var tokenData = await tokenResponse.Content.ReadFromJsonAsync<OAuthTokenResponse>();
            if (string.IsNullOrEmpty(tokenData?.AccessToken))
                return BadRequest("Failed to get access token");

            // 3. Получение данных пользователя
            client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", tokenData.AccessToken);
            client.DefaultRequestHeaders.UserAgent.ParseAdd("Learnst Platform"); // Требование GitHub API

            var userResponse = await client.GetAsync("https://api.github.com/user");

            if (!userResponse.IsSuccessStatusCode)
            {
                var errorContent = await userResponse.Content.ReadAsStringAsync();
                return StatusCode(500, $"GitHub user error: {errorContent}");
            }

            var userInfo = await userResponse.Content.ReadFromJsonAsync<GithubUserInfo>();

            // 4. Получение email (если не публичный)
            var email = userInfo?.Email;
            if (string.IsNullOrEmpty(email))
            {
                var emailsResponse = await client.GetAsync("https://api.github.com/user/emails");
                var emails = await emailsResponse.Content.ReadFromJsonAsync<List<GithubEmail>>();
                email = emails?.FirstOrDefault(e => e.Primary)?.Email;
            }

            // 5. Проверка обязательных данных
            if (userInfo?.Id is null || string.IsNullOrEmpty(userInfo.Login))
                return BadRequest("Invalid user data received");

            // 6. Создание пользователя
            var user = await FindOrCreateUser(
                email: email,
                externalLoginId: userInfo.Id.ToString(),
                externalLoginType: ExternalLoginType.Github,
                avatar: userInfo.AvatarUrl,
                fullName: userInfo.Name);

            return RedirectWithToken(user);
        }
        catch (Exception ex)
        {
            // Логирование ошибки
            return StatusCode(500, new
            {
                message = "GitHub authentication failed",
                error = ex.Message,
                stackTrace = ex.StackTrace
            });
        }
    }

    #endregion

    #region Discord

    [HttpGet("discord/init")]
    public IActionResult InitDiscordAuth()
    {
        var state = Guid.NewGuid().ToString("N");
        Response.Cookies.Append("oauth_state", state, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Lax,
            Expires = DateTimeOffset.UtcNow.AddMinutes(5)
        });

        var authUrl = "https://discord.com/api/oauth2/authorize?" +
            $"client_id={_discordSettings.ClientId}" +  // ← Исправлено ApplicationId → ClientId
            $"&redirect_uri={Uri.EscapeDataString(_discordSettings.RedirectUri)}" +
            "&response_type=code" +
            "&scope=identify%20email" +  // ← Убраны лишние scope
            "&prompt=consent" +  // ← Добавлено для гарантированного получения email
            $"&state={state}";

        return Redirect(authUrl);
    }

    [HttpGet("discord/callback")]
    public async Task<IActionResult> HandleDiscordCallback(
        [FromQuery] string code,
        [FromQuery] string state)
    {
        var expectedState = Request.Cookies["oauth_state"];
        if (state != expectedState)
            return BadRequest("Invalid state parameter");

        try
        {
            // 1. Получение токена
            using var client = httpClientFactory.CreateClient();

            var tokenContent = new Dictionary<string, string>
            {
                {"client_id", _discordSettings.ClientId},
                {"client_secret", _discordSettings.ClientSecret},
                {"grant_type", "authorization_code"},
                {"code", code},
                {"redirect_uri", _discordSettings.RedirectUri},
                {"scope", "identify email"} // Явное указание scope
            };

            var tokenResponse = await client.PostAsync(
                "https://discord.com/api/oauth2/token",
                new FormUrlEncodedContent(tokenContent));

            // 2. Обработка ошибок токена
            if (!tokenResponse.IsSuccessStatusCode)
            {
                var error = await tokenResponse.Content.ReadAsStringAsync();
                throw new Exception($"Token error: {tokenResponse.StatusCode} - {error}");
            }

            var tokenData = await tokenResponse.Content.ReadFromJsonAsync<OAuthTokenResponse>();

            // 3. Валидация токена
            if (string.IsNullOrEmpty(tokenData?.AccessToken))
                throw new Exception("Empty access token received");

            // 4. Запрос данных пользователя
            client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", tokenData.AccessToken.Trim());

            client.DefaultRequestHeaders.Add("User-Agent", "Learnst"); // Требуется Discord API

            var userResponse = await client.GetAsync(
                "https://discord.com/api/users/@me?with_usage=true");

            // 5. Обработка ответа
            if (!userResponse.IsSuccessStatusCode)
            {
                var errorContent = await userResponse.Content.ReadAsStringAsync();
                throw new Exception($"User info error: {errorContent}");
            }

            var userInfo = await userResponse.Content.ReadFromJsonAsync<DiscordUserInfo>();

            // 6. Валидация данных
            if (userInfo is null || string.IsNullOrEmpty(userInfo.Id))
                throw new Exception("Invalid user data received");

            // 7. Обработка дискриминатора
            var discriminator = int.TryParse(userInfo.Discriminator, out var disc)
                ? disc % 5
                : userInfo.Discriminator.Sum(c => c) % 5;

            var avatarUrl = !string.IsNullOrEmpty(userInfo.Avatar)
                ? $"https://cdn.discordapp.com/avatars/{userInfo.Id}/{userInfo.Avatar}.png"
                : $"https://cdn.discordapp.com/embed/avatars/{discriminator}.png";

            // 8. Создание пользователя
            var user = await FindOrCreateUser(
                email: userInfo.Email,
                externalLoginId: userInfo.Id,
                externalLoginType: ExternalLoginType.Discord,
                avatar: avatarUrl,
                fullName: $"{userInfo.Username}#{userInfo.Discriminator}");

            return RedirectWithToken(user);
        }
        catch (Exception ex)
        {
            // Логирование полной ошибки
            return StatusCode(500, new
            {
                message = "Discord authentication failed",
                error = ex.Message,
                stackTrace = ex.StackTrace
            });
        }
    }

    #endregion

    #region Steam

    [HttpGet("steam/init")]
    public IActionResult InitSteamAuth()
    {
        if (string.IsNullOrEmpty(_steamSettings.ApiKey))
            throw new InvalidOperationException("Steam API key is not configured");

        var returnTo = Uri.EscapeDataString(_steamSettings.RedirectUri);
        var authUrl = "https://steamcommunity.com/openid/login?" +
            "openid.ns=http://specs.openid.net/auth/2.0" +
            "&openid.mode=checkid_setup" +
            "&openid.return_to=" + returnTo +
            "&openid.realm=" + returnTo +
            "&openid.identity=http://specs.openid.net/auth/2.0/identifier_select" +
            "&openid.claimed_id=http://specs.openid.net/auth/2.0/identifier_select";

        return Redirect(authUrl);
    }

    [HttpGet("steam/callback")]
    public async Task<IActionResult> HandleSteamCallback()
    {
        try
        {
            // Получаем параметры напрямую из Query
            var query = HttpContext.Request.Query;

            // Проверка обязательных параметров
            var requiredParams = new[] {
                "openid.assoc_handle",
                "openid.signed",
                "openid.sig",
                "openid.claimed_id"
            };

            foreach (var param in requiredParams)
                if (!query.ContainsKey(param))
                    return BadRequest($"Missing required parameter: {param}");

            // Создаем словарь с учетом регистра
            var queryDict = query.Keys.ToDictionary(
                k => k,
                k => query[k].ToString(),
                StringComparer.OrdinalIgnoreCase);

            // Валидация подписи OpenID
            var assertion = new OpenIdAuthenticationRequest(
                queryDict["openid.assoc_handle"],
                queryDict["openid.signed"],
                queryDict["openid.sig"],
                queryDict);

            if (!await assertion.ValidateAsync())
                return BadRequest("Неверная подпись Steam");

            // Извлечение SteamID
            var claimedId = queryDict["openid.claimed_id"];
            var steamId = claimedId.Split('/')
                .LastOrDefault()
                ?.Trim();

            if (string.IsNullOrEmpty(steamId) || !ulong.TryParse(steamId, out _))
                return BadRequest("Неверный формат SteamID");

            // Получение данных пользователя
            var userInfo = await GetSteamUserInfo(steamId);

            // Создание/обновление пользователя
            var user = await FindOrCreateUser(
                email: null,
                externalLoginId: steamId,
                avatar: userInfo.AvatarFull,
                fullName: userInfo.PersonaName,
                externalLoginType: ExternalLoginType.Steam,
                usernameBase: SanitizeUsername(userInfo.PersonaName));

            return RedirectWithToken(user);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                message = "Ошибка аутентификации через Steam",
                error = ex.Message
            });
        }
    }

    private async Task<SteamUserInfo> GetSteamUserInfo(string steamId)
    {
        if (string.IsNullOrEmpty(_steamSettings.ApiKey))
            throw new InvalidOperationException("Steam API key is not configured");

        using var client = httpClientFactory.CreateClient();

        var response = await client.GetAsync(
            $"https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/" +
            $"?key={_steamSettings.ApiKey}" +
            $"&steamids={steamId}");

        if (!response.IsSuccessStatusCode)
        {
            var errorContent = await response.Content.ReadAsStringAsync();
            throw new HttpRequestException($"Steam API error: {response.StatusCode} - {errorContent}");
        }

        var data = await response.Content.ReadFromJsonAsync<SteamResponse>();

        if (data?.Response.Players is null || data.Response.Players.Count == 0)
            throw new KeyNotFoundException("Пользователь Steam не найден");

        return data.Response.Players.First();
    }

    #endregion

    #region Twitch

    [HttpGet("twitch/init")]
    public IActionResult InitTwitchAuth()
    {
        var state = Guid.NewGuid().ToString("N");
        Response.Cookies.Append("oauth_state", state, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Lax,
            Expires = DateTimeOffset.UtcNow.AddMinutes(5)
        });

        var authUrl = "https://id.twitch.tv/oauth2/authorize?" +
            $"client_id={_twitchSettings.ClientId}" +
            $"&redirect_uri={Uri.EscapeDataString(_twitchSettings.RedirectUri)}" +
            "&response_type=code" +
            "&scope=openid%20user:read:email" +
            $"&state={state}";

        return Redirect(authUrl);
    }

    [HttpGet("twitch/callback")]
    public async Task<IActionResult> HandleTwitchCallback(
        [FromQuery] string? code,
        [FromQuery] string state)
    {
        // Проверка наличия кода
        if (string.IsNullOrEmpty(code))
            return BadRequest("Authorization code is missing");

        // Проверка state
        var expectedState = Request.Cookies["oauth_state"];
        if (state != expectedState)
            return BadRequest("Invalid state");

        using var client = httpClientFactory.CreateClient();

        try
        {
            // 1. Обмен кода на токен
            var tokenResponse = await client.PostAsync(
                "https://id.twitch.tv/oauth2/token",
                new FormUrlEncodedContent(new Dictionary<string, string>
                {
                    {"client_id", _twitchSettings.ClientId},
                    {"client_secret", _twitchSettings.ClientSecret},
                    {"code", code},
                    {"grant_type", "authorization_code"},
                    {"redirect_uri", _twitchSettings.RedirectUri}
                }));

            if (!tokenResponse.IsSuccessStatusCode)
            {
                var errorContent = await tokenResponse.Content.ReadAsStringAsync();
                return StatusCode(500, $"Twitch token error: {errorContent}");
            }

            var tokenData = await tokenResponse.Content.ReadFromJsonAsync<TwitchTokenResponse>();
            if (tokenData?.AccessToken is null)
                return BadRequest("Invalid token response");

            // 2. Получение информации о пользователе
            var userRequest = new HttpRequestMessage(HttpMethod.Get, "https://api.twitch.tv/helix/users");
            userRequest.Headers.Add("Client-Id", _twitchSettings.ClientId);
            userRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", tokenData.AccessToken);

            var userResponse = await client.SendAsync(userRequest);
            if (!userResponse.IsSuccessStatusCode)
                return BadRequest("Failed to get user info");

            var userInfo = await userResponse.Content.ReadFromJsonAsync<TwitchUserResponse>();
            var userData = userInfo?.Data.FirstOrDefault();
            if (userData is null)
                return BadRequest("User data not found");

            // 3. Создание/обновление пользователя
            var user = await FindOrCreateUser(
                email: userData.Email,
                externalLoginId: userData.Id,
                externalLoginType: ExternalLoginType.Twitch,
                avatar: userData.ProfileImageUrl,
                fullName: userData.DisplayName,
                usernameBase: userData.Login);

            return RedirectWithToken(user);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                message = "Twitch authentication failed",
                error = ex.Message
            });
        }
    }

    #endregion

    #region EpicGames

    [HttpGet("epicgames/init")]
    public IActionResult InitEpicGamesAuth()
    {
        var state = Guid.NewGuid().ToString("N");
        Response.Cookies.Append("epic_state", state, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Lax,
            Expires = DateTime.UtcNow.AddMinutes(5)
        });

        var authUrl = "https://www.epicgames.com/id/authorize?" +
                      $"client_id={_epicGamesSettings.ClientId}" +
                      $"&redirect_uri={Uri.EscapeDataString(_epicGamesSettings.RedirectUri)}" +
                      "&response_type=code" +
                      "&scope=openid+profile+email" +
                      "&access_type=offline" +
                      $"&state={state}";

        return Redirect(authUrl);
    }

    [HttpGet("epicgames/callback")]
    public async Task<IActionResult> HandleEpicGamesCallback(
    [FromQuery] string code,
    [FromQuery] string state)
    {
        try
        {
            var expectedState = Request.Cookies["epic_state"];
            if (state != expectedState) return BadRequest("Invalid state");

            var httpClient = httpClientFactory.CreateClient();
            // Получение токена
            var tokenResponse = await httpClient.PostAsync(
                "https://api.epicgames.dev/epic/oauth/v2/token",
                new FormUrlEncodedContent(new Dictionary<string, string>
                {
                    {"client_id", _epicGamesSettings.ClientId},
                    {"client_secret", _epicGamesSettings.ClientSecret},
                    {"code", code},
                    {"grant_type", "authorization_code"},
                    {"redirect_uri", _epicGamesSettings.RedirectUri}
                }));

            var tokenData = await tokenResponse.Content.ReadFromJsonAsync<EpicGamesTokenResponse>();
            if (tokenData?.AccessToken is null) return BadRequest("Epic auth failed");

            // Получение данных пользователя
            using var userRequest = new HttpRequestMessage(HttpMethod.Get, "https://api.epicgames.dev/epic/oauth/v2/userInfo");
            userRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", tokenData.AccessToken);
    
            var userInfoResponse = await httpClient.SendAsync(userRequest);
            var userInfo = await userInfoResponse.Content.ReadFromJsonAsync<EpicGamesUserInfo>();

            // Обработка данных
            var user = await FindOrCreateUser(
                email: userInfo?.Email ?? $"{userInfo?.Sub}@epic.temp",
                externalLoginId: userInfo!.Sub,
                externalLoginType: ExternalLoginType.EpicGames,
                avatar: userInfo.Picture,
                fullName: userInfo.PreferredUsername);

            return RedirectWithToken(user);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Internal server error: {ex.Message}");
        }
    }

    #endregion

    #region Facebook (Нет учётной записи)

    [HttpGet("facebook/init")]
    public IActionResult InitFacebookAuth()
    {
        var state = Guid.NewGuid().ToString("N");
        Response.Cookies.Append("oauth_state", state, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Lax
        });

        var authUrl = "https://www.facebook.com/v12.0/dialog/oauth?" +
            $"client_id={_facebookSettings.ClientId}" +
            $"&redirect_uri={Uri.EscapeDataString(_facebookSettings.RedirectUri)}" +
            "&response_type=code" +
            "&scope=email,public_profile" +
            $"&state={state}";

        return Redirect(authUrl);
    }

    [HttpGet("facebook/callback")]
    public async Task<IActionResult> HandleFacebookCallback(
        [FromQuery] string code,
        [FromQuery] string state)
    {
        var expectedState = Request.Cookies["oauth_state"];
        if (state != expectedState)
            return BadRequest("Invalid state");

        // Exchange code for token
        var tokenResponse = await httpClientFactory.CreateClient().PostAsync(
            "https://graph.facebook.com/v12.0/oauth/access_token",
            new FormUrlEncodedContent(new Dictionary<string, string>
            {
                {"client_id", _facebookSettings.ClientId},
                {"client_secret", _facebookSettings.ClientSecret},
                {"code", code},
                {"redirect_uri", _facebookSettings.RedirectUri}
            }));

        if (!tokenResponse.IsSuccessStatusCode)
            return BadRequest("Failed to get token from Facebook");

        var tokenData = await tokenResponse.Content.ReadFromJsonAsync<OAuthTokenResponse>();
        if (tokenData?.AccessToken is null)
            return BadRequest("Invalid token response");

        // Get user info
        var userInfoResponse = await httpClientFactory.CreateClient().GetAsync(
            $"https://graph.facebook.com/v12.0/me?fields=id,name,email,picture&access_token={tokenData.AccessToken}");

        if (!userInfoResponse.IsSuccessStatusCode)
            return BadRequest("Failed to get user info from Facebook");

        var userInfo = await userInfoResponse.Content.ReadFromJsonAsync<FacebookUserInfo>();
        if (userInfo?.Id is null)
            return BadRequest("No user data found");

        // Create/update user
        var user = await FindOrCreateUser(
            email: userInfo.Email,
            externalLoginId: userInfo.Id,
            externalLoginType: ExternalLoginType.Facebook,
            avatar: userInfo.Picture.Data.Url,
            fullName: userInfo.Name);

        return RedirectWithToken(user);
    }

    #endregion

    #region TikTok

    [HttpGet("tiktok/init")]
    public IActionResult InitTikTokAuth()
    {
        var state = Guid.NewGuid().ToString("N");
        Response.Cookies.Append("oauth_state", state, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Lax
        });

        var authUrl = "https://www.tiktok.com/v2/auth/authorize/" +
            $"client_key={_tiktokSettings.ClientKey}" +
            $"&redirect_uri={Uri.EscapeDataString(_tiktokSettings.RedirectUri)}" +
            "&response_type=code" +
            "&scope=user.info.basic" +
            $"&state={state}";

        return Redirect(authUrl);
    }

    [HttpGet("tiktok/callback")]
    public async Task<IActionResult> HandleTikTokCallback(
        [FromQuery] string code,
        [FromQuery] string state)
    {
        var expectedState = Request.Cookies["oauth_state"];
        if (state != expectedState)
            return BadRequest("Invalid state");

        using var client = httpClientFactory.CreateClient();

        // Exchange code for token
        var tokenResponse = await client.PostAsync(
            "https://open.tiktokapis.com/v2/oauth/token/",
            new FormUrlEncodedContent(new Dictionary<string, string>
            {
                {"client_key", _tiktokSettings.ClientKey},
                {"client_secret", _tiktokSettings.ClientSecret},
                {"code", code},
                {"grant_type", "authorization_code"},
                {"redirect_uri", _tiktokSettings.RedirectUri}
            }));

        if (!tokenResponse.IsSuccessStatusCode)
            return BadRequest("Failed to get token from TikTok");

        var tokenData = await tokenResponse.Content.ReadFromJsonAsync<OAuthTokenResponse>();
        if (tokenData?.AccessToken is null)
            return BadRequest("Invalid token response");

        // Get user info
        var request = new HttpRequestMessage(HttpMethod.Post, "https://open.tiktokapis.com/v2/user/info/");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", tokenData.AccessToken);
        request.Content = new StringContent(
            "{\"fields\": [\"open_id\", \"display_name\", \"avatar_url\"]}",
            Encoding.UTF8,
            "application/json");

        var userInfoResponse = await client.SendAsync(request);

        if (!userInfoResponse.IsSuccessStatusCode)
            return BadRequest("Failed to get user info from TikTok");

        var userInfo = await userInfoResponse.Content.ReadFromJsonAsync<TikTokUserResponse>();
        if (userInfo?.Data.User is null)
            return BadRequest("No user data found");

        // Create/update user
        var user = await FindOrCreateUser(
            email: null, // TikTok не предоставляет email
            externalLoginId: userInfo.Data.User.OpenId,
            externalLoginType: ExternalLoginType.TikTok,
            avatar: userInfo.Data.User.AvatarUrl,
            fullName: userInfo.Data.User.DisplayName);

        return RedirectWithToken(user);
    }

    #endregion
}
