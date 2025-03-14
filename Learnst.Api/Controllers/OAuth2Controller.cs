using System.Net.Http.Headers;
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
    IHttpClientFactory httpClientFactory,
    IOptions<SteamSettings> steamSettings,
    IOptions<GoogleSettings> googleSettings,
    IOptions<YandexSettings> yandexSettings,
    IOptions<GithubSettings> githubSettings,
    IOptions<TwitchSettings> twitchSettings,
    IOptions<DiscordSettings> discordSettings
) : ControllerBase
{
    private readonly VkSettings _vkSettings = vkSettings.Value;
    private readonly SteamSettings _steamSettings = steamSettings.Value;
    private readonly GithubSettings _githubSettings = githubSettings.Value;
    private readonly TwitchSettings _twitchSettings = twitchSettings.Value;
    private readonly GoogleSettings _googleSettings = googleSettings.Value;
    private readonly YandexSettings _yandexSettings = yandexSettings.Value;
    private readonly DiscordSettings _discordSettings = discordSettings.Value;

    #region Helpers

    private static string SanitizeUsername(string input) => SanitizedNameRegex().Replace(input, string.Empty);

    private async Task<User> FindOrCreateUser(
        string? email,
        string externalLoginId,
        SocialMediaPlatform SocialMediaPlatform,
        string? avatar = null,
        string? usernameBase = null,
        string? fullName = null,
        DateOnly? dateOfBirth = null)
    {
        var user = await context.Users.FirstOrDefaultAsync(u =>
            u.EmailAddress == email ||
            (u.ExternalLoginId == externalLoginId &&
            u.ExternalLoginType == SocialMediaPlatform));

        if (user is null)
        {
            user = new User
            {
                AvatarUrl = avatar,
                FullName = fullName,
                EmailAddress = email,
                DateOfBirth = dateOfBirth,
                ExternalLoginId = externalLoginId,
                ExternalLoginType = SocialMediaPlatform,
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

        throw new InvalidOperationException("Не удалось сгенерировать уникальное имя.");
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
        var state = $"{Guid.NewGuid():N}";
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
            ExternalLoginType = SocialMediaPlatform.Google,
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
            ?? throw new InvalidOperationException("Не удалось получить информацию о пользователе.");
    }
    #endregion

    #region Yandex
    [HttpGet("yandex/init")]
    public IActionResult InitYandexAuth()
    {
        var state = $"{Guid.NewGuid():N}";
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
            return BadRequest(new { message = "Неверный параметр состояния." });

        // Обмен кода на токен
        var tokenResponse = await GetYandexToken(code);
        if (!tokenResponse.IsSuccessStatusCode)
        {
            var errorContent = await tokenResponse.Content.ReadAsStringAsync();
            return BadRequest(new { message = $"Yandex ошибка авторизации: {errorContent}." });
        }

        var tokenData = await tokenResponse.Content.ReadFromJsonAsync<YandexTokenResponse>();
        if (string.IsNullOrEmpty(tokenData?.AccessToken))
            return BadRequest(new { message = "Не удалось получить токен." });

        // Получение данных пользователя
        var userInfo = await GetYandexUserInfo(tokenData.AccessToken);

        // Поиск/создание пользователя
        var user = await FindOrCreateUser(userInfo.DefaultEmail, userInfo.Id, SocialMediaPlatform.Google,
            $"https://avatars.yandex.net/get-yapic/{userInfo.DefaultAvatarId}/islands-200");

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
            ?? throw new InvalidOperationException("Не удалось получить информацию о пользователе.");
    }
    #endregion

    #region Vk

    [HttpGet("vk/init")]
    public IActionResult InitVkAuth()
    {
        var state = $"{Guid.NewGuid():N}";
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
            "&v=5.131" +
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
        if (state != expectedState) return BadRequest("Неверный параметр состояния");

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
            SocialMediaPlatform: SocialMediaPlatform.VK,
            avatar: userInfo?.Photo200,
            dateOfBirth: birthDate,
            fullName: $"{userInfo?.FirstName} {userInfo?.LastName}".Trim());

        return RedirectWithToken(user);
    }

    #endregion

    #region GitHub

    [HttpGet("github/init")]
    public IActionResult InitGitHubAuth()
    {
        var state = $"{Guid.NewGuid():N}";
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
        if (state != expectedState) return BadRequest("Неверный параметр состояния");

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
                return StatusCode(500, $"Ошибка получения токена: {errorContent}.");
            }

            var tokenData = await tokenResponse.Content.ReadFromJsonAsync<OAuthTokenResponse>();
            if (string.IsNullOrEmpty(tokenData?.AccessToken))
                return BadRequest("Не удалось получить токен.");

            // 3. Получение данных пользователя
            client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", tokenData.AccessToken);
            client.DefaultRequestHeaders.UserAgent.ParseAdd("Learnst Platform");

            var userResponse = await client.GetAsync("https://api.github.com/user");

            if (!userResponse.IsSuccessStatusCode)
            {
                var errorContent = await userResponse.Content.ReadAsStringAsync();
                return StatusCode(500, $"Не удалось получить информации о пользователе: {errorContent}.");
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
                SocialMediaPlatform: SocialMediaPlatform.Github,
                avatar: userInfo.AvatarUrl,
                fullName: userInfo.Name);

            return RedirectWithToken(user);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ErrorResponse(ex));
        }
    }

    #endregion

    #region Discord

    [HttpGet("discord/init")]
    public IActionResult InitDiscordAuth()
    {
        var state = $"{Guid.NewGuid():N}";
        Response.Cookies.Append("oauth_state", state, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Lax,
            Expires = DateTimeOffset.UtcNow.AddMinutes(5)
        });

        var authUrl = "https://discord.com/api/oauth2/authorize?" +
            $"client_id={_discordSettings.ClientId}" +
            $"&redirect_uri={Uri.EscapeDataString(_discordSettings.RedirectUri)}" +
            "&response_type=code" +
            "&scope=identify%20email" +
            "&prompt=consent" +
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
            return BadRequest("Неверный параметр состояния");

        try
        {
            // 1. Получение токена
            using var client = httpClientFactory.CreateClient();

            Dictionary<string, string> tokenContent = new()
            {
                {"client_id", _discordSettings.ClientId},
                {"client_secret", _discordSettings.ClientSecret},
                {"grant_type", "authorization_code"},
                {"code", code},
                {"redirect_uri", _discordSettings.RedirectUri},
                {"scope", "identify email"}
            };

            var tokenResponse = await client.PostAsync("https://discord.com/api/oauth2/token",
                new FormUrlEncodedContent(tokenContent));

            // 2. Обработка ошибок токена
            if (!tokenResponse.IsSuccessStatusCode)
            {
                var error = await tokenResponse.Content.ReadAsStringAsync();
                throw new Exception($"Ошибка получения токена {tokenResponse.StatusCode}: {error}.");
            }

            var tokenData = await tokenResponse.Content.ReadFromJsonAsync<OAuthTokenResponse>();

            // 3. Валидация токена
            if (string.IsNullOrEmpty(tokenData?.AccessToken))
                throw new Exception("Не удалось получить токен.");

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
                throw new Exception($"Ошибка получения информации о пользователе: {errorContent}.");
            }

            var userInfo = await userResponse.Content.ReadFromJsonAsync<DiscordUserInfo>();

            // 6. Валидация данных
            if (userInfo is null || string.IsNullOrEmpty(userInfo.Id))
                throw new Exception("Не удалось получить информацию о пользователе.");

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
                SocialMediaPlatform: SocialMediaPlatform.Discord,
                avatar: avatarUrl,
                fullName: $"{userInfo.Username}#{userInfo.Discriminator}");

            return RedirectWithToken(user);
        }
        catch (Exception ex)
        {
            // Логирование полной ошибки
            return StatusCode(500, new ErrorResponse(ex));
        }
    }

    #endregion

    #region Steam

    [HttpGet("steam/init")]
    public IActionResult InitSteamAuth()
    {
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
                SocialMediaPlatform: SocialMediaPlatform.Steam,
                usernameBase: SanitizeUsername(userInfo.PersonaName));

            return RedirectWithToken(user);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ErrorResponse(ex));
        }
    }

    private async Task<SteamUserInfo> GetSteamUserInfo(string steamId)
    {
        using var client = httpClientFactory.CreateClient();

        var response = await client.GetAsync(
            $"https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/" +
            $"?key={_steamSettings.ApiKey}" +
            $"&steamids={steamId}");

        if (!response.IsSuccessStatusCode)
        {
            var errorContent = await response.Content.ReadAsStringAsync();
            throw new HttpRequestException($"Steam API ошибка {response.StatusCode}: {errorContent}.");
        }

        var data = await response.Content.ReadFromJsonAsync<SteamResponse>();

        if (data?.Response.Players is null || data.Response.Players.Count == 0)
            throw new KeyNotFoundException("Пользователь Steam не найден.");

        return data.Response.Players.First();
    }

    #endregion

    #region Twitch

    [HttpGet("twitch/init")]
    public IActionResult InitTwitchAuth()
    {
        var state = $"{Guid.NewGuid():N}";
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
            return BadRequest("Код авторизации отсутствует.");

        // Проверка state
        var expectedState = Request.Cookies["oauth_state"];
        if (state != expectedState)
            return BadRequest("Неверный параметр состояния.");

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
                return StatusCode(500, $"Ошибка получения токена: {errorContent}");
            }

            var tokenData = await tokenResponse.Content.ReadFromJsonAsync<TwitchTokenResponse>();
            if (string.IsNullOrEmpty(tokenData?.AccessToken))
                return BadRequest("Не удалось получить токен.");

            // 2. Получение информации о пользователе
            var userRequest = new HttpRequestMessage(HttpMethod.Get, "https://api.twitch.tv/helix/users");
            userRequest.Headers.Add("Client-Id", _twitchSettings.ClientId);
            userRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", tokenData.AccessToken);

            var userResponse = await client.SendAsync(userRequest);
            if (!userResponse.IsSuccessStatusCode)
            {
                var errorContent = await userResponse.Content.ReadAsStringAsync();
                return BadRequest(
                    $"Произошла ошибка при получении информации о пользователе {userResponse.StatusCode}: {errorContent}.");
            }

            var userInfo = await userResponse.Content.ReadFromJsonAsync<TwitchUserResponse>();
            var userData = userInfo?.Data.FirstOrDefault();
            if (userData is null)
                return BadRequest("Не удалось получить данные пользователя.");

            // 3. Создание/обновление пользователя
            var user = await FindOrCreateUser(
                email: userData.Email,
                externalLoginId: userData.Id,
                SocialMediaPlatform: SocialMediaPlatform.Twitch,
                avatar: userData.ProfileImageUrl,
                fullName: userData.DisplayName,
                usernameBase: userData.Login);

            return RedirectWithToken(user);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ErrorResponse(ex));
        }
    }

    #endregion
}
