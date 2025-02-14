using Learnst.Api.Models;
using Learnst.Api.Services;
using Learnst.Application.Extensions;
using Learnst.Application.Interfaces;
using Learnst.Domain.Exceptions;
using Learnst.Domain.Models;
using Learnst.Domain.Services;
using Microsoft.AspNetCore.Mvc;
using App = Learnst.Domain.Models.Application;

namespace Learnst.Api.Controllers;

[ApiController]
[Route("[controller]")]
public class AppsController(
    JwtService jwtService,
    IAsyncRepository<App, string> repository,
    IAsyncRepository<User, Guid> usersRepository,
    IAsyncRepository<AuthCode, string> codesRepository) : ControllerBase
{
    private readonly HashSet<string> _allowedScopes = ["openid", "username", "fullname", "email", "picture"];

    #region OAuth2 Provider Endpoints
    [HttpGet("{clientId}")]
    public async Task<ActionResult<App>> GetApplication(string clientId)
    {
        try
        {
            return Ok(await repository.GetByIdAsync(clientId)
                ?? throw new NotFoundException<App, string>(message: "Приложение с таким ID не найдено"));
        }
        catch (NotFoundException<App, string> nfe)
        {
            return NotFound(new ErrorResponse(nfe));
        }
        catch (Exception ex)
        {
            return BadRequest(new ErrorResponse(ex));
        }
    }

    [HttpGet("/Users/{userId:guid}/[controller]")]
    public async Task<ActionResult<App>> GetApplications(Guid userId)
    {
        try
        {
            return Ok(await repository.GetAsync(where: a => a.UserId == userId));
        }
        catch (Exception ex)
        {
            return BadRequest(new ErrorResponse(ex));
        }
    }

    [HttpPost("Create")]
    public async Task<ActionResult<App>> RegisterApplication([FromBody] ClientRegistrationRequest request)
    {
        try
        {
            var userExists = await usersRepository.ExistsAsync(u => u.Id == request.UserId);
            if (!userExists)
                throw new NotFoundException<User>(request.UserId);

            var appsCount = await repository.AggregateAsync<int>(
                EFHelper.AggregateFunction.Count,
                where: u => u.UserId == request.UserId);
            if (appsCount >= 5)
                throw new ArgumentOutOfRangeException(nameof(appsCount),
                    "Количество приложений не может быть больше 5.");

            var nameExists = await repository.ExistsAsync(a => a.Name == request.Name);
            if (nameExists)
                throw new DuplicateException($"Имя {request.Name} уже занято");
            
            var (invalidScopes, suggestions) = ValidateScopes(request.AllowedScopes);
            if (invalidScopes.Count > 0)
            {
                var invalidList = string.Join(", ", invalidScopes);
                var suggestionsList = suggestions.Count > 0 
                    ? $"Возможно, вы имели в виду: {string.Join(", ", suggestions)}?" 
                    : string.Empty;

                return BadRequest(new
                {
                    message = $"Следующие scopes неверные: {invalidList}. {suggestionsList}",
                    errors = invalidScopes,
                    suggestions
                });
            }

            // Создание приложения
            App client = new()
            {
                Name = request.Name,
                UserId = request.UserId,
                RedirectUri = request.RedirectUri,
                AllowedScopes = request.AllowedScopes
            };

            await repository.AddAsync(client);
            await repository.SaveAsync();
            
            return Ok(new
            {
                client.ClientId,
                client.ClientSecret,
                client.RedirectUri
            });
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

    [HttpPut("{clientId}")]
    public async Task<ActionResult<App>> UpdateApplication(string clientId, App application)
    {
        try
        {
            NotEqualsException.ThrowIfNotEquals(clientId, application.ClientId);
            var existingApplication = await repository.GetByIdAsync(clientId);

            if (existingApplication is null)
                throw new NotFoundException<App, string>(message: "Приложение с таким ClientId не найдено");

            if (await repository.ExistsAsync(a => a.Name == application.Name
                && a.ClientId != application.ClientId))
                throw new Exception("Это имя уже занято");

            var (invalidScopes, suggestions) = ValidateScopes(application.AllowedScopes);
            if (invalidScopes.Count > 0)
            {
                var invalidList = string.Join(", ", invalidScopes);
                var suggestionsList = suggestions.Count > 0 
                    ? $"Возможно, вы имели в виду: {string.Join(", ", suggestions)}?" 
                    : string.Empty;

                return BadRequest(new
                {
                    message = $"Следующие scopes неверные: {invalidList}. {suggestionsList}",
                    errors = invalidScopes,
                    suggestions
                });
            }

            /*existingApplication.Name = application.Name;
            existingApplication.RedirectUri = application.RedirectUri;
            existingApplication.AllowedScopes = application.AllowedScopes;*/

            repository.Update(existingApplication, application,
                "Name", "RedirectUri", "AllowedScopes");
            await repository.SaveAsync();

            return Ok(existingApplication);
        }
        catch (NotFoundException<App, string> nfe)
        {
            return NotFound(new { message = nfe.Message, exception = nfe.ToString() });
        }
        catch (Exception ex)
        {
            return BadRequest(new ErrorResponse(ex));
        }
    }

    [HttpDelete("{clientId}")]
    public async Task<ActionResult<App>> DeleteApplication(string clientId)
    {
        try
        {
            await repository.DeleteAsync(clientId);
            await repository.SaveAsync();
            return NoContent();
        }
        catch (NotFoundException<Activity, Guid> nfe)
        {
            return NotFound(new ErrorResponse(nfe));
        }
        catch (Exception ex)
        {
            return BadRequest(new ErrorResponse(ex));
        }
    }

    [HttpGet("authorize")]
    public async Task<IActionResult> Authorize(
        [FromQuery(Name = "client_id")] string clientId,
        [FromQuery(Name = "redirect_uri")] string redirectUri,
        [FromQuery(Name = "response_type")] string responseType,
        [FromQuery] string scope,
        [FromQuery] string? state)
    {
        // Validate app
        var app = await repository.GetByIdAsync(clientId);

        if (app is null)
            throw new NotFoundException<App, string>(clientId);

        // Validate redirect_uri
        if (!Uri.TryCreate(redirectUri, UriKind.Absolute, out _))
            return BadRequest("Неверный redirect_uri");

        if (!app.RedirectUri.Equals(redirectUri, StringComparison.Ordinal))
            return BadRequest("redirect_uri не совпадает с зарегистрированным URI");

        // Validate response_type
        if (responseType != "code")
            return BadRequest("Неподдерживаемый response_type");

        // Validate scopes
        var invalidScopes = scope.Split(' ')
            .Except(app.AllowedScopes)
            .ToList();

        if (invalidScopes.Count != 0)
            return BadRequest($"Запрещенные scopes: {string.Join(", ", invalidScopes)}");

        // Get user ID from JWT
        var userId = HttpContext.Request.Cookies["openid"];

        if (!Guid.TryParse(userId, out var userGuid))
            return Unauthorized(new { message = $"Ошибка авторизации: {(string.IsNullOrEmpty(userId) ? "Пользователь не авторизован" : $"Некорректный ID: {userId}")}" });

        var currentUser = await usersRepository.GetByIdAsync(userGuid);
        if (currentUser is null)
            return BadRequest("Пользователь не найден");

        // Generate authorization code
        AuthCode code = new()
        {
            Code = AuthService.GenerateCode(),
            ClientId = app.ClientId,
            UserId = currentUser.Id,
            Scopes = [.. scope.Split(' ')],
            ExpiresAt = DateTime.UtcNow.AddMinutes(12)
        };

        await codesRepository.AddAsync(code);
        await codesRepository.SaveAsync();

        // Return authorized code instead of redirect
        return Ok(new { code = code.Code, state });
    }

    [HttpPost("token")]
    public async Task<IActionResult> Token([FromForm] TokenRequest request)
    {
        if (request.GrantType is "authorization")
            return await HandleAuthorizationCode(request);

        return BadRequest("Неподдерживаемый тип токена");
    }

    [HttpGet("userinfo")]
    public async Task<IActionResult> GetUserInfo()
    {
        var userId = Guid.Parse(User.FindFirst("openid")?.Value!);
        var user = await usersRepository.GetByIdAsync(userId);

        if (user is null) return NotFound();

        var scopeClaim = User.FindFirst("scope")?.Value;
        var scopes = scopeClaim?.Split(' ').ToHashSet() ?? [];

        Dictionary<string, string> userInfo = [];

        foreach (var scope in scopes)
            userInfo[scope] = scope switch
            {
                "openid" => user.Id.ToString(),
                "username" => user.Username,
                "fullname" => user.FullName ?? string.Empty,
                "email" => user.EmailAddress ?? string.Empty,
                "picture" => user.AvatarUrl ?? "https://learnst.runasp.net/assets/icons/user.png",
                _ => string.Empty
            };

        return Ok(userInfo);
    }

    #endregion

    // Метод для вычисления расстояния Левенштейна
    private static int LevenshteinDistance(string a, string b)
    {
        var matrix = new int[a.Length + 1, b.Length + 1];

        for (var i = 0; i <= a.Length; i++) matrix[i, 0] = i;
        for (var j = 0; j <= b.Length; j++) matrix[0, j] = j;

        for (var i = 1; i <= a.Length; i++)
            for (var j = 1; j <= b.Length; j++)
            {
                var cost = a[i - 1] == b[j - 1] ? 0 : 1;
                matrix[i, j] = Math.Min(
                    Math.Min(matrix[i - 1, j] + 1, matrix[i, j - 1] + 1),
                    matrix[i - 1, j - 1] + cost);
            }

        return matrix[a.Length, b.Length];
    }

    // Метод проверки scope'ов
    private (List<string> InvalidScopes, List<string> Suggestions) ValidateScopes(List<string> inputScopes)
    {
        List<string> suggestions = [];
        HashSet<string> processed = [];
        List<string> invalidScopes = [];

        foreach (var scope in inputScopes.Where(scope => !_allowedScopes.Contains(scope)))
        {
            invalidScopes.Add(scope);

            var scope1 = scope;
            var bestCandidate = _allowedScopes
                .Select(s => new
                {
                    Scope = s,
                    Distance = LevenshteinDistance(scope1, s),
                    Contains = s.Contains(scope1) || scope1.Contains(s)
                })
                .OrderBy(x => x.Contains ? 0 : 1)
                .ThenBy(x => x.Distance)
                .Select(x => x.Scope)
                .FirstOrDefault();

            if (bestCandidate is null || processed.Contains(bestCandidate)) continue;
            suggestions.Add(bestCandidate);
            processed.Add(bestCandidate);
        }

        return (invalidScopes, suggestions);
    }

    private async Task<IActionResult> HandleAuthorizationCode(TokenRequest request)
    {
        try
        {
            var authCode = await codesRepository.GetByIdAsync(request.Code);
            if (authCode is null)
                throw new Exception("Неверный код");
            
            if (authCode.ExpiresAt < DateTime.UtcNow)
                throw new Exception("Недействительный код");

            var application = await repository.GetByIdAsync(authCode.ClientId);
            if (application is null)
                throw new AccessViolationException("Вы не авторизованы");

            // Ensure the user exists before generating tokens
            var user = await usersRepository.GetByIdAsync(application.UserId);
            if (user is null)
                throw new NotFoundException<User>(application.UserId);

            // Generate tokens
            var accessToken = await GenerateAccessToken(user.Id, authCode.Scopes);

            await codesRepository.DeleteAsync(request.Code);
            await codesRepository.SaveAsync();

            return RedirectPermanent($"{request.RedirectUri}?token={accessToken}");
        }
        catch (AccessViolationException)
        {
            return Unauthorized();
        }
        catch (Exception ex)
        {
            return BadRequest(new ErrorResponse(ex));
        }
    }

    private async Task<string> GenerateAccessToken(Guid userId, List<string> scopes)
    {
        try
        {
            return jwtService.GenerateAccessToken(
                await usersRepository.GetByIdAsync(userId) ?? throw new NotFoundException<User>(userId), scopes);
        }
        catch (Exception ex)
        {
            return ex.ToString();
        }
    }
}
