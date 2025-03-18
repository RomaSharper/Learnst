namespace Learnst.Infrastructure.Exceptions;

/// <summary>
/// Исключение, которое возникает, когда не передан необходимый параметр
/// </summary>
public class MissingParameterException : Exception
{
    /// <summary>
    /// Инициализирует новое исключение с указанным сообщением.
    /// </summary>
    /// <param name="message">Сообщение об ошибке.</param>
    public MissingParameterException(string message) : base(message) { }
    
    /// <summary>
    /// Инициализирует новое исключение с указанием пропущенного параметра
    /// </summary>
    /// <param name="parameterName">Наименование параметра</param>
    /// <param name="message">Сообщение</param>
    public MissingParameterException(string parameterName, string? message) : base(
        $"Параметр {parameterName} отсутствует.{(string.IsNullOrEmpty(message) ? string.Empty : $" {message}")}") { }
}
