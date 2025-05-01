using Learnst.Api.Models;
using Learnst.Infrastructure;
using Learnst.Infrastructure.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Learnst.Api.Controllers;

[ApiController]
[Route("[controller]")]
public class CertificateController(
    ApplicationDbContext context,
    ICertificateService certificateService,
    IEmailSender emailSender
) : ControllerBase
{
    [HttpPost("send")]
    public async Task<IActionResult> SendCertificateByEmail([FromBody] CertificateRequest request)
    {
        var user = await context.Users.FindAsync(request.UserId);
        var activity = await context.Activities.FindAsync(request.ActivityId);

        if (user is null || activity is null)
            return NotFound("Пользователь или активность не найдены.");

        // Генерация PDF
        var pdfBytes = certificateService.GenerateCertificate(user, activity);

        // Отправка PDF по почте
        var subject = $"Ваш сертификат за завершение активности \"{activity.Title}\"";
        const string body = "Поздравляем с успешным завершением курса на платформе Learnst!";
        var fileName = $"{DateTime.UtcNow:yyyy-MM-dd}_certificate_{activity.Id:N}.pdf";

        await emailSender.SendEmailWithAttachmentAsync(request.EmailAddress, subject, body, pdfBytes, fileName);
        return Ok("Сертификат отправлен на почту.");
    }
}
