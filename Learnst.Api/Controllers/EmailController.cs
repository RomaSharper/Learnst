using Learnst.Api.Models;
using Learnst.Infrastructure.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Learnst.Api.Controllers;

[ApiController]
[Route("[controller]")]
public class EmailController(IEmailSender emailSender) : ControllerBase
{
    private readonly Lazy<Random> _random = new(() => new Random());

    [HttpPost("send")]
    public async Task<IActionResult> SendEmail([FromBody] EmailRequest emailRequest)
    {
        if (string.IsNullOrEmpty(emailRequest.To) || string.IsNullOrEmpty(emailRequest.Subject) || string.IsNullOrEmpty(emailRequest.Body))
            return BadRequest("Пожалуйста, заполните поля Кому, Тема, и Сообщения для отправки.");

        try
        {
            await emailSender.SendEmailAsync(emailRequest.To, emailRequest.Subject, emailRequest.Body);
            return Ok("Письмо отослано успешно.");
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Ошибка сервера: {ex.Message}");
        }
    }

    // Новый метод для отправки кода подтверждения
    [HttpPost("send-code")]
    public async Task<IActionResult> SendVerificationCode([FromBody] VerificationCodeRequest request)
    {
        if (string.IsNullOrEmpty(request.Email))
            return BadRequest("Пожалуйста, укажите адрес электронной почты.");

        string verificationCode = GenerateVerificationCode();
        string subject = "Ваш код подтверждения";
        string body = $"""
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <style>
                            /* Вставить все стили из предыдущего примера */
                        </style>
                    </head>
                    <body>
                        <div class='container'>
                            <h1 class='niko-header'>☀️ Learnst Верификация ☀️</h1>
                            
                            <div class='code-box'>
                                <span class='verification-code'>{verificationCode}</span>
                            </div>

                            <p class='message'>
                                The World Machine needs your help!<br>
                                Enter this code to continue your journey.<br>
                                Remember - the sun must not go out...
                            </p>

                            <img src='https://i.imgur.com/5Z7Qb9Q.png' class='pixel-cat' alt='Niko pixel art'>
                        </div>
                    </body>
                    </html>
                    """;

        try
        {
            await emailSender.SendEmailAsync(request.Email, subject, body);
            return Ok(new { Code = verificationCode }); // Возвращаем код (в реальном приложении лучше не показывать код)
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Ошибка сервера: {ex.Message}");
        }
    }

    private string GenerateVerificationCode() => _random.Value.Next(100000, 999999).ToString();

    public record VerificationCodeRequest(string Email);
}
