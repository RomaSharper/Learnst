namespace Learnst.Api.Models;

public class ErrorResponse(Exception ex)
{
    public string Message { get; set; } = ex.Message;
    public string? StackTrace { get; set; } = ex.StackTrace;
    
    public static implicit operator Exception(ErrorResponse er) => new(er.Message);
    public static implicit operator ErrorResponse(Exception ex) => new(ex);
}
