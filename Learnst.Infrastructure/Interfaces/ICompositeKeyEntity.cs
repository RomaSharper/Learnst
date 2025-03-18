namespace Learnst.Infrastructure.Interfaces;

/// <summary>
/// Интерфейс для сущностей с составными ключами.
/// </summary>
/// <typeparam name="TKey">Тип составного ключа.</typeparam>
public interface ICompositeKeyEntity<out TKey> : IBaseEntity<TKey>
    where TKey : IEquatable<TKey>
{
    /// <summary>
    /// Получает имена свойств, составляющих ключ.
    /// </summary>
    /// <returns>Список имён свойств, составляющих ключ.</returns>
    IEnumerable<string> GetKeyPropertyNames();
}
