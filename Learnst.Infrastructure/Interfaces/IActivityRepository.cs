using Learnst.Infrastructure.Models;

namespace Learnst.Infrastructure.Interfaces;

public interface IActivityRepository : IAsyncRepository<Activity, Guid>
{
    Task<IEnumerable<Activity>> GetByTagsAsync(IEnumerable<string> tags);
    Task<IEnumerable<Activity>> GetUserActivitiesAsync(Guid userId);
}
