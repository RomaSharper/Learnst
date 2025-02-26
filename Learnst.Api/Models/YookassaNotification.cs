namespace Learnst.Api.Models;

public class YookassaNotification
{
    public PaymentObject? Object { get; set; }
    public string Event { get; set; } = string.Empty;
}
