using AutoMapper;
using Learnst.Infrastructure.Models;

namespace Learnst.Infrastructure.Repositories;

public class ActivitiesRepository(ApplicationDbContext context, IMapper mapper)
    : AsyncRepository<Activity, Guid>(context, mapper)
{
    public override Activity Update(Activity existingEntity, Activity modifiedEntity, params string[]? propertyNames)
    {
        existingEntity.Title = modifiedEntity.Title;
        existingEntity.Description = modifiedEntity.Description;
        existingEntity.AvatarUrl = modifiedEntity.AvatarUrl;
        existingEntity.Level = modifiedEntity.Level;
        existingEntity.IsClosed = modifiedEntity.IsClosed;
        existingEntity.EndAt = modifiedEntity.EndAt;
        existingEntity.MinimalScore = modifiedEntity.MinimalScore;
        existingEntity.Tags = modifiedEntity.Tags;
        existingEntity.TargetAudience = modifiedEntity.TargetAudience;
        existingEntity.CheckList = modifiedEntity.CheckList;
        existingEntity.InfoCards = modifiedEntity.InfoCards;
        return existingEntity;
    }
}
