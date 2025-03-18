namespace Learnst.Api.Models;

public class ClientRegistrationRequest
{
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string RedirectUri { get; set; } = string.Empty;
    public List<string> AllowedScopes { get; set; } = [];
}
