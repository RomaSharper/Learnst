using Learnst.Domain.Interfaces;

namespace Learnst.Application.Interfaces;

public interface IAsyncBulkRepository<in T, TKey> where T : class, IBaseEntity<TKey> where TKey : IEquatable<TKey>
{
    /// <summary>
    /// Выполняет массовую вставку сущностей.
    /// </summary>
    /// <param name="entities">Коллекция сущностей для вставки.</param>
    Task BulkInsertAsync(IEnumerable<T> entities);

    /// <summary>
    /// Выполняет массовое обновление сущностей.
    /// </summary>
    /// <param name="entities">Коллекция сущностей для обновления.</param>
    Task BulkUpdateAsync(IEnumerable<T> entities);

    /// <summary>
    /// Выполняет массовое удаление сущностей.
    /// </summary>
    /// <param name="entities">Коллекция сущностей для удаления.</param>
    Task BulkDeleteAsync(IEnumerable<T> entities);
}
