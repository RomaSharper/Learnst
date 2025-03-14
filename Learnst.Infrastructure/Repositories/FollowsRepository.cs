using AutoMapper;
using Learnst.Domain.Extensions;
using Learnst.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;

namespace Learnst.Infrastructure.Repositories;

public class FollowsRepository(ApplicationDbContext context, IMapper mapper)
    : AsyncRepository<Follow, (Guid, Guid)>(context, mapper)
{
    public async Task<List<User?>> GetFollowersAsync(Guid userId) => await DbSet
        .Where(f => f.UserId == userId)
        .Select(f => f.Follower)
        .ToListAsync();

    public async Task<int> GetFollowersCountAsync(Guid userId) => await AggregateAsync<int>(
        EFHelper.AggregateFunction.Count, where: f => f.UserId == userId);

    public async Task<Follow> GetFollowAsync(Guid userId, Guid followerId) => await GetFirstAsync(
        where: f => f.UserId == userId && f.FollowerId == followerId);

    public async Task AddFollowerAsync(Guid userToFollowId, Guid followerId) => await AddAsync(new Follow
    {
        UserId = userToFollowId,
        FollowerId = followerId
    });

    public async Task RemoveFollowerAsync(Guid userToUnfollowId, Guid followerId)
    {
        var follow = await GetFollowAsync(userToUnfollowId, followerId);
        DbSet.Remove(follow);
    }
}