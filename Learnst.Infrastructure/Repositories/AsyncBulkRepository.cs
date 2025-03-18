using EFCore.BulkExtensions;
using Learnst.Infrastructure.Interfaces;

namespace Learnst.Infrastructure.Repositories;

public class AsyncBulkRepository<T, TKey>(ApplicationDbContext context) : IAsyncBulkRepository<T, TKey>
    where T : class, IBaseEntity<TKey> where TKey : IEquatable<TKey>
{
    public async Task BulkInsertAsync(IEnumerable<T> entities) => await context.BulkInsertAsync(entities);

    public async Task BulkUpdateAsync(IEnumerable<T> entities) => await context.BulkUpdateAsync(entities);

    public async Task BulkDeleteAsync(IEnumerable<T> entities) => await context.BulkDeleteAsync(entities);
}
