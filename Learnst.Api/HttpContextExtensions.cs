using System.Net;

namespace Learnst.Api;

public static class HttpContextExtensions
{
    public static IPAddress? GetRemoteIPAddress(this HttpContext context, bool allowForwarded = true)
    {
        if (allowForwarded)
        {
            string? header = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();
            if (IPAddress.TryParse(header, out IPAddress? ip))
                return ip;
        }
        return context.Connection.RemoteIpAddress;
    }
}
