using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace Learnst.Api.Models;

public static class ClaimsPrincipalExtensions
{
    public static Guid GetUserId(this ClaimsPrincipal principal)
    {
        var claim = principal.FindFirst(JwtRegisteredClaimNames.Sub) 
            ?? principal.FindFirst(ClaimTypes.NameIdentifier);

        return claim is not null 
            ? Guid.Parse(claim.Value) 
            : throw new InvalidOperationException("User ID claim not found");
    }
}
