namespace Learnst.Api.Models;

public class ClientInfo
{
    public BrowserInfo? BrowserInfo { get; set; }
    public NetworkInfo? NetworkInfo { get; set; }
    public GeolocationInfo? GeolocationInfo { get; set; }
}
