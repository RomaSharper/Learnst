using Learnst.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace Learnst.Api.Controllers;

[ApiController]
[Route("[controller]")]
public class ClientController(
    IHttpClientFactory httpClientFactory
) : ControllerBase
{
    // POST: api/Client/GetInfo
    [HttpPost]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(ClientInfo))]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Get client information",
        Description = "Returns client information",
        OperationId = "GetInfo",
        Tags = ["Client"]
    )]
    public async Task<ActionResult<ClientInfo>> GetInfo()
    {
        ClientInfo systemInfo = new()
        {
            BrowserInfo = new BrowserInfo(),
            NetworkInfo = new NetworkInfo(),
            GeolocationInfo = new GeolocationInfo()
        };

        var userAgent = Request.Headers.UserAgent.ToString();
        systemInfo.BrowserInfo = GetBrowserInfo(userAgent);
        systemInfo.NetworkInfo = GetNetworkInfo();
        systemInfo.GeolocationInfo = await GetGeolocationInfo(systemInfo.NetworkInfo.LocalIP!);
        return Ok(systemInfo);
    }

    private static BrowserInfo GetBrowserInfo(string userAgent)
    {
        var browserInfo = new BrowserInfo
        {
            Name = "Неизвестно",
            UserAgent = userAgent,
            Version = "Неизвестно"
        };

        if (userAgent.Contains("Firefox"))
            browserInfo.Name = "Firefox";
        else if (userAgent.Contains("Chrome") && !userAgent.Contains("Edg"))
            browserInfo.Name = "Chrome";
        else if (userAgent.Contains("Safari") && !userAgent.Contains("Chrome"))
            browserInfo.Name = "Safari";
        else if (userAgent.Contains("Edg"))
            browserInfo.Name = "Edge";
        else if (userAgent.Contains("OPR") || userAgent.Contains("Opera"))
            browserInfo.Name = "Opera";
        else
            browserInfo.Name = "Unknown";

        // Извлекаем версию браузера (упрощенный пример)
        var versionMatch = System.Text.RegularExpressions.Regex.Match(userAgent, @"(?:" + browserInfo.Name + @")\/([\d.]+)");
        if (versionMatch.Success)
            browserInfo.Version = versionMatch.Groups[1].Value;

        return browserInfo;
    }

    private NetworkInfo GetNetworkInfo()
    {
        NetworkInfo networkInfo = new()
        {
            LocalIP = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Не найден"
        };
        return networkInfo;
    }

    private async Task<GeolocationInfo> GetGeolocationInfo(string ipAddress)
    {
        GeolocationInfo geolocationInfo = new()
        {
            Country = "Неизвестно",
            Region = "Неизвестно",
            City = "Неизвестно",
            Zip = "Неизвестно",
            Lat = 0.0,
            Lon = 0.0
        };

        using var client = httpClientFactory.CreateClient();
        var response = await client.GetFromJsonAsync<GeolocationInfo>($"http://ip-api.com/json/{ipAddress}?lang=ru");
        if (response is not null)
            geolocationInfo = response;
        return geolocationInfo;
    }
}
