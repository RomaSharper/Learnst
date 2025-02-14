using Learnst.Domain.Interfaces;

namespace Learnst.Application.Interfaces;

/// <summary>
/// Базовый интерфейс для всех репозиториев.
/// </summary>
/// <typeparam name="T">Тип сущности.</typeparam>
/// <typeparam name="TKey">Тип первичного ключа.</typeparam>
public interface IBaseRepository<T, in TKey> where T : IBaseEntity<TKey> where TKey : IEquatable<TKey>
{
    /// <summary>
    /// Обновляет существующую сущность.
    /// </summary>
    /// <param name="existingEntity">Сущность для обновления.</param>
    /// <param name="modifiedEntity">Обновленная сущность.</param>
    /// <param name="propertyNames">Наименования свойств для замены</param>
    /// <returns>Обновленная сущность.</returns>
    T Update(T existingEntity, T modifiedEntity, params string[] propertyNames);
}
