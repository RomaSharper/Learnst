using Swashbuckle.AspNetCore.Annotations;
using System.ComponentModel.DataAnnotations;

namespace Learnst.Api.Models;

public class TokenRequest
{
    [SwaggerSchema(Description = "Тип гранта, который может быть 'authorization' или 'refresh'.")]
    [RegularExpression("^(authorization|refresh)$", ErrorMessage = "Тип гранта должен быть 'authorization' или 'refresh'.")]
    public string GrantType { get; set; } = "authorization";

    public string Code { get; set; } = string.Empty;
    public string RedirectUri { get; set; } = string.Empty;
    public string ClientId { get; set; } = string.Empty;
    public string ClientSecret { get; set; } = string.Empty;
    public string? RefreshToken { get; set; }
    public string? State { get; set; }
}
