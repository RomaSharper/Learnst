using AutoMapper;
using Learnst.Domain.Enums;
using Learnst.Infrastructure.Exceptions;
using Learnst.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;

namespace Learnst.Infrastructure.Repositories;

#pragma warning disable CS9107
public class UsersRepository(ApplicationDbContext context, IMapper mapper) : AsyncRepository<User, Guid>(context, mapper)
#pragma warning restore CS9107
{
    public override async Task DeleteAsync(Guid id)
    {
        var user = await GetByIdAsync(id, includes: [
            u => u.UserActivities,
            u => u.UserAnswers,
            u => u.UserLessons,
            u => u.TicketAnswers
        ]) ?? throw new NotFoundException<User>(id);
        context.UserActivities.RemoveRange(user.UserActivities);
        context.UserAnswers.RemoveRange(user.UserAnswers);
        context.UserLessons.RemoveRange(user.UserLessons);
        context.TicketAnswers.RemoveRange(user.TicketAnswers);
        DbSet.Remove(user);
    }

    public async Task<bool> IsPremium(Guid id)
    {
        var user = await GetByIdAsync(id) ?? throw new NotFoundException<User>(id);
        return user.UserSubscriptions.Any(us => us.EndDate > DateTime.UtcNow);
    }

    public async Task Subscribe(Guid id, UserSubscription subscription)
    {
        var user = await GetByIdAsync(id) ?? throw new NotFoundException<User>(id);
        user.UserSubscriptions.Add(subscription);
    }
}
