namespace Learnst.Api.Models;

public interface IOAuthSettings
{
    public string ClientId { get; set; }
    public string ClientSecret { get; set; }
    public string RedirectUri { get; set; }
}
