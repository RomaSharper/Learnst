namespace Learnst.Infrastructure.Exceptions;

/// <summary>
/// Исключение, которое возникает, когда сущность не имеет ключа.
/// </summary>
public class NoKeyException : Exception
{
    /// <summary>
    /// Инициализирует новое исключение с указанным сообщением.
    /// </summary>
    /// <param name="message">Сообщение об ошибке.</param>
    public NoKeyException(string message) : base(message) { }
    
    /// <summary>
    /// Инициализирует новое исключение с указанным типом.
    /// </summary>
    /// <param name="entityType">Тип сущности.</param>
    public NoKeyException(Type entityType) : base(
        $"Свойство с атрибутом [Key] не найдено в типе {entityType.Name}.") { }

    /// <summary>
    /// Инициализирует новое исключение с указанным типом и сообщением.
    /// </summary>
    /// <param name="entityType">Тип сущности.</param>
    /// <param name="message">Сообщение об ошибке.</param>
    public NoKeyException(Type entityType, string? message) : base(
        $"Свойство с атрибутом [Key] не найдено в типе {entityType.Name}.{(string.IsNullOrEmpty(message) ? string.Empty : message)}") { }
}

/// <summary>
/// Исключение, которое возникает, когда сущность не имеет ключа.
/// </summary>
/// <typeparam name="T">Тип сущности</typeparam>
public class NoKeyException<T> : Exception
{
    /// <summary>
    /// Инициализирует новое исключение с указанным типом.
    /// </summary>
    public NoKeyException() : base($"Свойство с атрибутом [Key] не найдено в типе {typeof(T).Name}.") { }
    
    /// <summary>
    /// Инициализирует новое исключение с указанным типом сообщением.
    /// </summary>
    /// <param name="message">Сообщение об ошибке.</param>
    public NoKeyException(string message) : base(message) { }
}
