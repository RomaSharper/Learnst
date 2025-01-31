namespace Learnst.Dao.Models;

public class CertificateRequest
{
    public Guid UserId { get; set; }
    public Guid ActivityId { get; set; }
    public string EmailAddress { get; set; } = string.Empty;
}