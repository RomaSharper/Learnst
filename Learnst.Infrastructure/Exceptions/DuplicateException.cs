namespace Learnst.Infrastructure.Exceptions;

/// <summary>
/// Исключение, которое возникает, когда запрашиваемая сущность уже существует.
/// </summary>
public class DuplicateException : Exception
{
    /// <summary>
    /// Инициализирует новое исключение с указанным сообщением.
    /// </summary>
    /// <param name="message">Сообщение об ошибке.</param>
    public DuplicateException(string message) : base(message) { }
}

/// <summary>
/// Исключение, которое возникает, когда запрашиваемая сущность уже существует.
/// </summary>
public class DuplicateException<T> : Exception
{
    /// <summary>
    /// Инициализирует новое исключение с указанным сообщением.
    /// </summary>
    /// <param name="message">Сообщение об ошибке.</param>
    public DuplicateException(string message) : base(message) { }

    /// <summary>
    /// Инициализирует новое исключение с указанным параметром идентификатора.
    /// </summary>
    /// <param name="id">Идентификатор сущности.</param>
    public DuplicateException(object id)
        : base($"{typeof(T).Name} с ID {id} уже существует.") { }
}
