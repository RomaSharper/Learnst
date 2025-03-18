namespace Learnst.Api.Models;

public class DiscordSettings
{
    public string ClientId { get; set; } = string.Empty;
    public string ClientSecret { get; set; } = string.Empty;
    public string PublicKey { get; set; } = string.Empty;
    public string RedirectUri { get; set; } = string.Empty;
}
