using Microsoft.AspNetCore.SignalR;

namespace Learnst.Api.Hubs;

public class ThemeHub : Hub
{
    public async Task SendThemeUpdate(string userId, string themeId)
    {
        await Clients.OthersInGroup(userId)
            .SendAsync("ReceiveThemeUpdate", themeId);
    }
    
    public async Task JoinUserGroup(string userId)
    {
        await Groups.AddToGroupAsync(
            Context.ConnectionId, userId);
    }
}
