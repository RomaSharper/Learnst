using Microsoft.AspNetCore.Mvc;

namespace Learnst.Api.Models;

public class TelegramAuthResponse
{
    [FromQuery(Name = "id")]
    public long Id { get; set; }

    [FromQuery(Name = "first_name")]
    public string FirstName { get; set; } = string.Empty;

    [FromQuery(Name = "last_name")]
    public string LastName { get; set; } = string.Empty;

    [FromQuery(Name = "username")]
    public string Username { get; set; } = string.Empty;

    [FromQuery(Name = "photo_url")]
    public string PhotoUrl { get; set; } = string.Empty;

    [FromQuery(Name = "auth_date")]
    public long AuthDate { get; set; }

    [FromQuery(Name = "hash")]
    public string Hash { get; set; } = string.Empty;

    [FromQuery(Name = "bot_id")]
    public string BotId { get; set; } = string.Empty;

    public string GetCheckString(string botId)
    {
        var props = new Dictionary<string, string>
        {
            ["bot_id"] = botId,
            ["auth_date"] = AuthDate.ToString(),
            ["first_name"] = FirstName,
            ["id"] = Id.ToString(),
            ["last_name"] = LastName,
            ["photo_url"] = PhotoUrl,
            ["username"] = Username
        };

        return string.Join("\n", props
            .OrderBy(kv => kv.Key)
            .Select(kv => $"{kv.Key}={kv.Value}"));
    }
}
