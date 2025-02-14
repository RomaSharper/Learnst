using EFCore.BulkExtensions;
using Learnst.Application.Interfaces;
using Learnst.Domain.Interfaces;

namespace Learnst.Infrastructure.Repositories;

public class BulkRepository<T, TKey>(ApplicationDbContext context) : IBulkRepository<T, TKey>
    where T : class, IBaseEntity<TKey> where TKey : IEquatable<TKey>
{
    public void BulkInsert(IEnumerable<T> entities) => context.BulkInsert(entities);

    public void BulkUpdate(IEnumerable<T> entities) => context.BulkUpdate(entities);

    public void BulkDelete(IEnumerable<T> entities) => context.BulkDelete(entities);
}
