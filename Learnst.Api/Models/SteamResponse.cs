namespace Learnst.Api.Models;

public class SteamResponse
{
    public SteamPlayers Response { get; set; } = new();
    public class SteamPlayers
    {
        public List<SteamUserInfo> Players { get; set; } = [];
    }
}
