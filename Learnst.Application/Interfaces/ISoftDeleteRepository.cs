using Learnst.Domain.Interfaces;
using System.Linq.Expressions;

namespace Learnst.Application.Interfaces;

/// <summary>
/// Интерфейс для работы с мягким удалением.
/// </summary>
/// <typeparam name="T">Тип сущности.</typeparam>
/// <typeparam name="TKey">Тип первичного ключа.</typeparam>
public interface ISoftDeleteRepository<T, in TKey> : IBaseRepository<T, TKey>
    where T : class, IDeletableEntity<TKey> where TKey : IEquatable<TKey>
{
    /// <summary>
    /// Помечает сущность как удаленную.
    /// </summary>
    /// <param name="id">Идентификатор сущности.</param>
    void Delete(TKey id);

    /// <summary>
    /// Восстанавливает сущность из мягкого удаления.
    /// </summary>
    /// <param name="id">Идентификатор сущности.</param>
    void Restore(TKey id);

    /// <summary>
    /// Возвращает все сущности, включая удаленные.
    /// </summary>
    IEnumerable<T> Get(
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
