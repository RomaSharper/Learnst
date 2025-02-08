using Learnst.Api.Models;
using Learnst.Api.Services;
using Learnst.Dao;
using Learnst.Dao.Models;
using Learnst.Dao.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace Learnst.Api.Controllers;

[ApiController]
[Route("[controller]")]
public class AppsController(
    JwtService jwtService,
    ApplicationDbContext context
) : ControllerBase
{
    #region OAuth2 Provider Endpoints
    [HttpGet("{clientId}")]
    public async Task<ActionResult<Application>> GetApplication(string clientId)
    {
        var app = await context.Applications.FindAsync(clientId);
        return app is null ? NotFound(new { message = "Приложение с таким ID не найдено" }) : Ok(app);
    }
    
    [HttpGet("/users/{userId:guid}/apps")]
    public async Task<ActionResult<Application>> GetApplications(Guid userId)
    {
        var apps = await context.Applications.AsNoTracking()
            .Where(a => a.UserId == userId)
            .ToListAsync();
        return Ok(apps);
    }

    [HttpPost("create")]
    public async Task<ActionResult<Application>> RegisterApplication(
        [FromBody] ClientRegistrationRequest request
    )
    {
        var user = await context.Users.Include(u => u.Applications)
            .SingleOrDefaultAsync(u => u.Id == request.UserId);

        if (user is null)
            return BadRequest(new { message = "Пользователь с таким ID не найден" });

        if (user.Applications.Count >= 5)
            return BadRequest(new { message = "Пользователь не может иметь более 5 привязанных приложений" });

        Application client = new()
        {
            Name = request.Name,
            UserId = request.UserId,
            RedirectUri = request.RedirectUri,
            AllowedScopes = request.AllowedScopes
        };

        await context.Applications.AddAsync(client);
        await context.SaveChangesAsync();

        return Ok(new
        {
            client.ClientId,
            client.ClientSecret,
            client.RedirectUri
        });
    }
    
    [HttpDelete("delete/{clientId}")]
    public async Task<ActionResult<Application>> DeleteApplication(string clientId)
    {
        var application = await context.Applications.FindAsync(clientId);

        if (application is null)
            return BadRequest(new { message = "Приложение с таким ID не найдено" });

        context.Applications.Remove(application);
        await context.SaveChangesAsync();

        return NoContent();
    }

    [Authorize]
    [HttpGet("authorize")]
    public async Task<IActionResult> Authorize(
        [FromQuery] string client_id,
        [FromQuery] string redirect_uri,
        [FromQuery] string response_type,
        [FromQuery] string scope,
        [FromQuery] string state)
    {
        // Validate client
        var client = await context.Applications
            .FirstOrDefaultAsync(c => c.ClientId == client_id);

        if (client is null)
            return BadRequest("Неверный клиент");

        // Validate redirect_uri
        if (!Uri.TryCreate(redirect_uri, UriKind.Absolute, out _))
            return BadRequest("Неверный redirect_uri");

        if (!client.RedirectUri.Equals(redirect_uri, StringComparison.Ordinal))
            return BadRequest("redirect_uri не совпадает с зарегистрированным URI");

        // Validate response_type
        if (response_type != "code")
            return BadRequest("Неподдерживаемый response_type");

        // Validate scopes
        var invalidScopes = scope.Split(' ')
            .Except(client.AllowedScopes)
            .ToList();

        if (invalidScopes.Count != 0)
            return BadRequest($"Запрещенные scopes: {string.Join(", ", invalidScopes)}");

        // Get user ID from JWT
        var authHeader = Request.Headers.Authorization.ToString();
        if (!authHeader.StartsWith("Bearer "))
            return BadRequest("Неподдерживаемый формат авторизации");

        var token = authHeader["Bearer ".Length..].Trim();
        var handler = new JwtSecurityTokenHandler();

        // Validate token and extract claims
        if (handler.ReadToken(token) is not JwtSecurityToken jwtToken)
            return BadRequest("Неподдерживаемый формат токена");

        var userIdClaim = jwtToken.Claims.FirstOrDefault(c => c.Type is JwtRegisteredClaimNames.Sub);
        if (userIdClaim is null || !Guid.TryParse(userIdClaim.Value, out var userGuid))
            return BadRequest($"Неверный код пользователя: {userIdClaim}");

        // Generate authorization code
        AuthCode code = new()
        {
            Code = AuthService.GenerateCode(),
            ApplicationId = client.ClientId,
            UserId = userGuid,
            Scopes = [.. scope.Split(' ')],
            ExpiresAt = DateTime.UtcNow.AddMinutes(12)
        };

        await context.AuthCodes.AddAsync(code);
        await context.SaveChangesAsync();

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

    [Authorize]
    [HttpGet("userinfo")]
    public async Task<IActionResult> GetUserInfo()
    {
        var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value!);
        var user = await context.Users.FindAsync(userId);

        if (user is null) return NotFound();

        var scopeClaim = User.FindFirst("scope")?.Value;
        var scopes = scopeClaim?.Split(' ').ToHashSet() ?? [];

        Dictionary<string, string> userInfo = [];

        foreach (var scope in scopes)
            if (JwtService.ScopeMappings.TryGetValue(scope, out var field))
                userInfo[field] = field switch
                {
                    "sub" => user.Id.ToString(),
                    "name" => user.FullName ?? string.Empty,
                    "email" => user.EmailAddress ?? string.Empty,
                    "picture" => user.AvatarUrl ?? string.Empty,
                    _ => string.Empty
                };

        return Ok(userInfo);
    }

    #endregion

    private async Task<IActionResult> HandleAuthorizationCode(TokenRequest request)
    {
        var authCode = await context.AuthCodes.FindAsync(request.Code);
        if (authCode is null) return BadRequest("Неверный код");
        if (authCode.ExpiresAt < DateTime.UtcNow) return BadRequest("Недействительный код");

        var application = await context.Applications.FindAsync(authCode.ApplicationId);
        if (application is null) return Unauthorized();

        // Ensure the user exists before generating tokens
        var user = await context.Users.FindAsync(authCode.UserId);
        if (user is null) return BadRequest("Пользователь не найден");

        // Generate tokens
        var accessToken = await GenerateAccessToken(user.Id, authCode.Scopes);

        context.AuthCodes.Remove(authCode);
        await context.SaveChangesAsync();

        return RedirectPermanent($"{request.RedirectUri}?token={accessToken}");
    }

    private async Task<string> GenerateAccessToken(Guid userId, List<string> scopes)
    {
        var user = await context.Users.SingleOrDefaultAsync(u => u.Id == userId)
            ?? throw new Exception("Пользователь не найден");

        return jwtService.GenerateAccessToken(user, scopes);
    }
}
