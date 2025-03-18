using AutoMapper;
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
        var user = await DbSet
            .Include(u => u.Educations)
            .Include(u => u.UserActivities)
            .Include(u => u.UserLessons)
            .Include(u => u.UserAnswers)
            .Include(u => u.TicketAnswers)
            .SingleOrDefaultAsync(u => u.Id == id)
            ?? throw new NotFoundException<User>(id);
        context.UserActivities.RemoveRange(user.UserActivities);
        context.UserAnswers.RemoveRange(user.UserAnswers);
        context.UserLessons.RemoveRange(user.UserLessons);
        context.TicketAnswers.RemoveRange(user.TicketAnswers);
        DbSet.Remove(user);
    }
}
