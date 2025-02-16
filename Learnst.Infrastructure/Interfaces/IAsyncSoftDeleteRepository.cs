using System.Linq.Expressions;

namespace Learnst.Infrastructure.Interfaces;

/// <summary>
/// Интерфейс для работы с мягким удалением.
/// </summary>
/// <typeparam name="T">Тип сущности.</typeparam>
/// <typeparam name="TKey">Тип первичного ключа.</typeparam>
public interface IAsyncSoftDeleteRepository<T, in TKey> : IBaseRepository<T, TKey>
    where T : class, IDeletableEntity<TKey> where TKey : IEquatable<TKey>
{
    /// <summary>
    /// Помечает сущность как удаленную.
    /// </summary>
    /// <param name="id">Идентификатор сущности.</param>
    Task DeleteAsync(TKey id);

    /// <summary>
    /// Восстанавливает сущность из мягкого удаления.
    /// </summary>
    /// <param name="id">Идентификатор сущности.</param>
    Task RestoreAsync(TKey id);

    /// <summary>
    /// Возвращает все сущности, включая удаленные.
    /// </summary>
    Task<IEnumerable<T>> GetAsync(
        bool withDeleted = true,
        bool noTracking = true,
        Expression<Func<T, bool>>? where = null,
        bool distinct = false,
        Expression<Func<T, object?>>? orderBy = null,
        bool descending = false,
        int? skip = null,
        int? take = null,
        params Expression<Func<T, object?>>[]? includes);
}
