namespace Learnst.Api.Models;

public class NewPayment
{
    public bool Capture { get; set; }
    public Amount? Amount { get; set; }
    public Confirmation? Confirmation { get; set; }
    public string Description { get; set; } = string.Empty;
    public PaymentMethodData? PaymentMethodData { get; set; }
    public Dictionary<string, string> Metadata { get; set; } = [];
}
