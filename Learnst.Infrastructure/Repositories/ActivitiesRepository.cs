using AutoMapper;
using Learnst.Infrastructure.Models;

namespace Learnst.Infrastructure.Repositories;

public class ActivitiesRepository(ApplicationDbContext context, IMapper mapper)
    : AsyncRepository<Activity, Guid>(context, mapper)
{
    public Activity CheckActivity(Activity activity)
    {
        if (activity.InfoCards.Count > 6)
            throw new ArgumentOutOfRangeException(
                nameof(activity), activity,
                "Разрешено максимум 6 инфокарт для активности");

        if (string.Join(string.Empty, activity.CheckList).Length > 2000
            || string.Join(string.Empty, activity.Tags).Length > 2000
            || string.Join(string.Empty, activity.TargetAudience).Length > 2000)
            throw new ArgumentOutOfRangeException(
                nameof(activity), activity,
                "Длины чек-листа, тегов и аудитории не должны превышать 2000 символов");

        return activity;
    }
    
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
        existingEntity.Topics = modifiedEntity.Topics;
        return existingEntity;
    }
}
