namespace Learnst.Infrastructure.Interfaces;

public interface IBulkRepository<in T, TKey> where T : class, IBaseEntity<TKey> where TKey : IEquatable<TKey>
{
    /// <summary>
    /// Выполняет массовую вставку сущностей.
    /// </summary>
    /// <param name="entities">Коллекция сущностей для вставки.</param>
    void BulkInsert(IEnumerable<T> entities);

    /// <summary>
    /// Выполняет массовое обновление сущностей.
    /// </summary>
    /// <param name="entities">Коллекция сущностей для обновления.</param>
    void BulkUpdate(IEnumerable<T> entities);

    /// <summary>
    /// Выполняет массовое удаление сущностей.
    /// </summary>
    /// <param name="entities">Коллекция сущностей для удаления.</param>
    void BulkDelete(IEnumerable<T> entities);
}