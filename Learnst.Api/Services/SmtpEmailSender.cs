using MailKit.Net.Smtp;
using Microsoft.Extensions.Options;
using MimeKit;
using MimeKit.Text;
using System.Text;
using Learnst.Api.Models;
using Learnst.Application.Interfaces;

namespace Learnst.Api.Services;

public class SmtpEmailSender(IOptions<SmtpSettings> smtpSettings) : IEmailSender
{
    private readonly SmtpSettings _smtpSettings = smtpSettings.Value;

    public async Task SendEmailAsync(string to, string subject, string body)
    {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress("Learnst", _smtpSettings.Username)); // Укажите адрес отправителя
        message.To.Add(new MailboxAddress(Encoding.UTF8, to, to));
        message.Subject = subject;

        message.Body = new TextPart(TextFormat.Html)
        {
            Text = body
        };

        await SendEmailAsync(message);
    }

    public async Task SendEmailWithAttachmentAsync(string to, string subject, string body, byte[] attachment, string fileName)
    {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress("Learnst", _smtpSettings.Username)); // Укажите адрес отправителя
        message.To.Add(new MailboxAddress(Encoding.UTF8, to, to));
        message.Subject = subject;

        // Создаем тело письма с вложением
        var bodyPart = new TextPart(TextFormat.Html)
        {
            Text = body
        };

        // Создаем вложение
        var attachmentPart = new MimePart("application", "pdf")
        {
            Content = new MimeContent(new MemoryStream(attachment)),
            ContentDisposition = new ContentDisposition(ContentDisposition.Attachment),
            ContentTransferEncoding = ContentEncoding.Base64,
            FileName = fileName
        };

        // Собираем письмо
        var multipart = new Multipart("mixed")
        {
            bodyPart,
            attachmentPart
        };

        message.Body = multipart;

        await SendEmailAsync(message);
    }

    private async Task SendEmailAsync(MimeMessage message)
    {
        using var client = new SmtpClient();
        await client.ConnectAsync(_smtpSettings.Host, _smtpSettings.Port, false);

        if (!string.IsNullOrEmpty(_smtpSettings.Username) && !string.IsNullOrEmpty(_smtpSettings.Password))
            await client.AuthenticateAsync(_smtpSettings.Username, _smtpSettings.Password);

        await client.SendAsync(message);
        await client.DisconnectAsync(true);
    }
}