using Microsoft.AspNetCore.SignalR;
using Learnst.Infrastructure.Enums;
using Learnst.Infrastructure.Exceptions;
using Learnst.Infrastructure.Models;
using Learnst.Infrastructure.Repositories;

namespace Learnst.Api.Hubs;

public class CommonHub(UsersRepository usersRepository) : Hub
{
    // Метод для обновления статуса пользователя
    public async Task SendStatusUpdate(string userId, Status status)
    {
        await Clients.OthersInGroup(userId).SendAsync("ReceiveStatusUpdate", status);
    }

    // Метод для обновления темы пользователя
    public async Task SendThemeUpdate(string userId, string themeId)
    {
        await Clients.OthersInGroup(userId).SendAsync("ReceiveThemeUpdate", themeId);
    }

    // Метод для присоединения пользователя к группе
    public async Task JoinUserGroup(string userId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, userId);
    }

    // При подключении пользователя
    public override async Task OnConnectedAsync()
    {
        var userId = Context.UserIdentifier;
        if (userId is null || !Guid.TryParse(userId, out var userGuid)) return;

        var user = await usersRepository.GetByIdAsync(userGuid, noTracking: false)
                   ?? throw new NotFoundException<User>(userGuid);

        user.Status = Status.Online;
        await usersRepository.SaveAsync();

        await Clients.All.SendAsync("ReceiveStatus", userId, Status.Online);
        await base.OnConnectedAsync();
    }

    // При отключении пользователя
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.UserIdentifier;
        if (userId is null || !Guid.TryParse(userId, out var userGuid)) return;

        var user = await usersRepository.GetByIdAsync(userGuid, noTracking: false)
                   ?? throw new NotFoundException<User>(userGuid);

        user.Status = Status.Offline;
        await usersRepository.SaveAsync();

        await Clients.All.SendAsync("ReceiveStatus", userId, Status.Offline);
        await base.OnDisconnectedAsync(exception);
    }
}
