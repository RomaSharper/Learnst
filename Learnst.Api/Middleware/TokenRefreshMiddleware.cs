using System.IdentityModel.Tokens.Jwt;
using Learnst.Api.Services;

namespace Learnst.Api.Middleware;

public class TokenRefreshMiddleware(JwtService jwtService) : IMiddleware
{
    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        var token = context.Request.Cookies["auth-token"];
        if (!string.IsNullOrEmpty(token) && token.StartsWith("Bearer "))
        {
            try
            {
                var handler = new JwtSecurityTokenHandler();
                var decodedToken = handler.ReadJwtToken(token);

                var expiryDateUnix = long.Parse(decodedToken.Claims.FirstOrDefault(c => c.Type == "exp")?.Value 
                                                ?? throw new InvalidOperationException("Токен не содержит времени истечения"));
                var expiryDateTimeUtc = new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc).AddSeconds(expiryDateUnix);

                if (expiryDateTimeUtc.Subtract(DateTime.UtcNow).TotalMinutes <= 15)
                {
                    var userIdClaim = decodedToken.Claims.FirstOrDefault(c => c.Type == "openid")?.Value;
                    if (Guid.TryParse(userIdClaim, out var userId))
                    {
                        var newToken = await jwtService.GenerateTokenAsync(userId);
                        context.Response.Cookies.Append(
                            "auth-token",
                            newToken,
                            new CookieOptions
                            {
                                Secure = true,
                                HttpOnly = true,
                                SameSite = SameSiteMode.Strict,
                                Expires = DateTime.UtcNow.AddHours(1)
                            });
                    }
                }
            }
            catch { /* Игнорируем ошибки */ }
        }

        await next(context);
    }
}
