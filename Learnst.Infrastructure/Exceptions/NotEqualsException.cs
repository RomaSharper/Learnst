namespace Learnst.Infrastructure.Exceptions;

/// <summary>
/// Исключение, которое возникает, когда значения не совпадают.
/// </summary>
public class NotEqualsException : Exception
{
    /// <summary>
    /// Инициализирует новое исключение с указанным сообщением.
    /// </summary>
    /// <param name="message">Сообщение об ошибке.</param>
    public NotEqualsException(string message) : base(message) { }

    /// <summary>
    /// Инициализирует новое исключение с указанными значениями.
    /// </summary>
    /// <param name="obtainedValue">Полученное значение.</param>
    /// <param name="expectedValue">Ожидаемое значение.</param>
    public NotEqualsException(object? obtainedValue, object? expectedValue)
        : base($"Получено: {obtainedValue}, а ожидалось: {expectedValue}.") { }

    /// <summary>
    /// Проверяет, совпадают ли значения, и если это так - выбрасывает исключение
    /// </summary>
    /// <param name="obtainedValue">Полученное значение</param>
    /// <param name="expectedValue">Ожидаемое значение</param>
    /// <exception cref="NotEqualsException">Исключение неравности</exception>
    public static void ThrowIfNotEquals(object? obtainedValue, object? expectedValue)
    {
        if (obtainedValue is null && expectedValue is null) return;
        if (obtainedValue is null || expectedValue is null || !obtainedValue.Equals(expectedValue))
            throw new NotEqualsException(obtainedValue, expectedValue);
    }
}
