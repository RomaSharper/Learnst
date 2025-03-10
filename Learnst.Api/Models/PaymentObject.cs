namespace Learnst.Api.Models;

public class PaymentObject
{
    public Amount Amount { get; set; } = null!;
    public string Id { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public Dictionary<string, string> Metadata { get; set; } = [];
}
