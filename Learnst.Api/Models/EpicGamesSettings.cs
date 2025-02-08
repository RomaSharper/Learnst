namespace Learnst.Api.Models;

public class EpicGamesSettings : IOAuthSettings
{
    public string ClientId { get; set; } = string.Empty;
    public string ClientSecret { get; set; } = string.Empty;
    public string DeploymentId { get; set; } = string.Empty;
    public string RedirectUri { get; set; } = string.Empty;
}
