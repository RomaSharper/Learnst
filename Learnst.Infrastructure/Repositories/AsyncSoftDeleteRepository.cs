using System.Linq.Expressions;
using AutoMapper;
using Learnst.Infrastructure.Exceptions;
using Learnst.Infrastructure.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Learnst.Infrastructure.Repositories;

public class AsyncSoftDeleteRepository<T, TKey>(ApplicationDbContext context, IMapper mapper) 
    : AsyncRepository<T, TKey>(context, mapper), IAsyncSoftDeleteRepository<T, TKey>
    where T : class, IDeletableEntity<TKey>, IEntity<TKey> where TKey : IEquatable<TKey>
{
    public override async Task DeleteAsync(TKey id)
    {
        var entity = await GetByIdAsync(id) ?? throw new NotFoundException<T, TKey>(id);
        entity.Delete(); // Мягкое удаление
    }

    public async Task RestoreAsync(TKey id)
    {
        var entity = await GetByIdAsync(id) ?? throw new NotFoundException<T, TKey>(id);
        entity.Restore(); // Восстановление
    }

    public async Task<IEnumerable<T>> GetAsync(
        bool withDeleted = true,
        bool noTracking = true,
        Expression<Func<T, bool>>? where = null,
        bool distinct = false,
        Expression<Func<T, object?>>? orderBy = null,
        bool descending = false,
        int? skip = null,
        int? take = null,
        params Expression<Func<T, object?>>[]? includes)
    {
        var query = BuildQuery(noTracking, includes).Where(e => withDeleted || !e.IsDeleted);

        if (where is not null)
            query = query.Where(where);

        if (distinct)
            query = query.Distinct();

        if (orderBy is not null)
            query = descending ? query.OrderByDescending(orderBy) : query.OrderBy(orderBy);

        if (skip is > 0)
            query = query.Skip(skip.Value);

        if (take is > 0)
            query = query.Take(take.Value);

        return await query.ToListAsync();
    }
}
