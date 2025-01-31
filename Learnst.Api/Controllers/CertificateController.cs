using Learnst.Dao;
using Learnst.Dao.Abstraction;
using Learnst.Dao.Models;
using Microsoft.AspNetCore.Mvc;

namespace Learnst.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
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
        var pdfBytes = await certificateService.GenerateCertificateAsync(user, activity);

        // Отправка PDF по почте
        var subject = $"Ваш сертификат за курс: {activity.Title}";
        var body = $"Поздравляем с успешным завершением курса! Ваш сертификат во вложении.";
        var fileName = "certificate.pdf";

        await emailSender.SendEmailWithAttachmentAsync(request.EmailAddress, subject, body, pdfBytes, fileName);

        return Ok("Сертификат отправлен на почту.");
    }
}
