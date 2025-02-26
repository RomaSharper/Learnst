namespace Learnst.Api.Models;

public class PaymentRequest
{
    public Guid UserId { get; set; }
    public int Duration { get; set; }
}
