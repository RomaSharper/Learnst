namespace Learnst.Infrastructure.Interfaces;

public interface IEmailSender
{
    Task SendEmailAsync(string to, string subject, string body);
    Task SendEmailWithAttachmentAsync(string to, string subject, string body, byte[] attachment, string fileName);
}
