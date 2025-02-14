using Learnst.Domain.Interfaces;

namespace Learnst.Domain.Exceptions;

/// <summary>
/// Исключение, которое возникает, когда запрашиваемая сущность не найдена.
/// </summary>
public class NotFoundException : Exception
{
    /// <summary>
    /// Инициализирует новое исключение с указанным сообщением.
    /// </summary>
    /// <param name="message">Сообщение об ошибке.</param>
    public NotFoundException(string message) : base(message) { }
}

/// <summary>
/// Исключение, которое возникает, когда запрашиваемая сущность не найдена.
/// </summary>
public class NotFoundException<T> : Exception where T : IBaseEntity<Guid>
{
    /// <summary>
    /// Инициализирует новое исключение с указанным сообщением.
    /// </summary>
    /// <param name="message">Сообщение об ошибке.</param>
    public NotFoundException(string message) : base(message) { }

    /// <summary>
    /// Инициализирует новое исключение с указанным сообщением и параметром идентификатора.
    /// </summary>
    /// <param name="id">Идентификатор сущности.</param>
    public NotFoundException(Guid id)
        : base($"Не удалось найти {typeof(T).Name} с ID \"{id}\".") { }
}

/// <summary>
/// Исключение, которое возникает, когда запрашиваемая сущность не найдена.
/// </summary>
public class NotFoundException<T, TKey> : Exception where T : IBaseEntity<TKey> where TKey : IEquatable<TKey>
{
    /// <summary>
    /// Инициализирует новое исключение с указанным сообщением.
    /// </summary>
    /// <param name="message">Сообщение об ошибке.</param>
    public NotFoundException(string message) : base(message) { }

    /// <summary>
    /// Инициализирует новое исключение с указанным сообщением и параметром идентификатора.
    /// </summary>
    /// <param name="id">Идентификатор сущности.</param>
    public NotFoundException(TKey id)
        : base($"Не удалось найти {typeof(T).Name} с ID {id}.") { }
}
