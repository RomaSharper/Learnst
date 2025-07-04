using DeviceDetectorNET;

namespace Learnst.Api.Services;

public static class DeviceService
{
    private static readonly Dictionary<string, string> OsNames = new()
    {
        { "iOS", "iOS" },
        { "Android", "Android" },
        { "Windows", "Windows" },
        { "Mac", "macOS" },
        { "Linux", "Linux" }
    };

    private static readonly Dictionary<string, string> WindowsVersions = new()
    {
        { "10", "Windows 10" },
        { "11", "Windows 11" },
        { "8.1", "Windows 8.1" },
        { "8", "Windows 8" },
        { "7", "Windows 7" },
        { "Vista", "Windows Vista" },
        { "XP", "Windows XP" }
    };

    public static DeviceInfo GetInfo(HttpContext context)
    {
        var userAgent = context.Request.Headers.UserAgent.ToString();
        DeviceDetector deviceDetector = new(userAgent);
        deviceDetector.Parse();

        var osInfo = deviceDetector.GetOs();
        var osName = osInfo.Match?.Name ?? "Неизвестная ОС";
        var osVersion = osInfo.Match?.Version ?? string.Empty;
        
        var browserInfo = deviceDetector.GetClient();
        var browserName = browserInfo.Match?.Name ?? "Неизвестный браузер";

        // Нормализация названий ОС
        foreach (var (key, value) in OsNames)
        {
            if (!osName.Contains(key))
                continue;
            osName = value;
            break;
        }

        if (osName == "Windows")
            foreach (var (version, name) in WindowsVersions)
            {
                if (!osVersion.StartsWith(version))
                    continue;
                osName = name;
                break;
            }

        if (osName == "macOS" && !string.IsNullOrEmpty(osVersion))
            osName = $"macOS {osVersion}";

        if (osName == "iOS" && !string.IsNullOrEmpty(osVersion))
            osName = $"iOS {osVersion.Split('.')[0]}";

        if (osName == "Android" && !string.IsNullOrEmpty(osVersion))
            osName = $"Android {osVersion.Split('.')[0]}";

        return new DeviceInfo(osName, browserName);
    }
    
    public record DeviceInfo(string Info, string BrowserName);
}