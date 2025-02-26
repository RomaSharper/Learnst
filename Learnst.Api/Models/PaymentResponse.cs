namespace Learnst.Api.Models;

public class PaymentResponse
{
    public string Id { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public ConfirmationResponse? Confirmation { get; set; }
}
