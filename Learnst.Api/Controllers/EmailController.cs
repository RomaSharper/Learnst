using Learnst.Api.Models;
using Learnst.Infrastructure.Interfaces;
using Microsoft.AspNetCore.Mvc;
using System.Drawing;

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

        var verificationCode = GenerateVerificationCode();
        const string subject = "Ваш код подтверждения";
        var body = """
                    <!-- Основной контейнер с эффектом матрицы -->
                    <div style="margin:0;padding:20px;background:#0a0a1a;font-family:'Courier New',monospace;border:3px solid #4a8ba8;padding:30px;max-width:600px;margin:0 auto;background:#0e1724;position:relative;box-shadow:0 0 15px rgba(74,139,168,0.3);">
                        <!-- Фоновый эффект терминала -->
                        <div style="position:absolute;top:0;left:0;width:100%;height:100%;background:
                            repeating-linear-gradient(0deg, 
                                rgba(74,139,168,0.05) 0px, 
                                rgba(74,139,168,0.05) 1px, 
                                transparent 2px, 
                                transparent 3px),
                            repeating-linear-gradient(90deg, 
                                rgba(74,139,168,0.04) 0px, 
                                rgba(74,139,168,0.04) 1px, 
                                transparent 2px, 
                                transparent 3px);z-index:1;">
                        </div>

                        <!-- Заголовок с неоновым эффектом -->
                        <div style="border:2px solid #4a8ba8;padding:15px;margin-bottom:30px;text-align:center;position:relative;z-index:2;background:#0a121f;">
                            <h1 style="margin:0;font-size:24px;letter-spacing:3px;color:#9bd3dd;text-shadow:0 0 8px #4a8ba8;">
                                ⚡ SYSTEM VERIFICATION ⚡
                            </h1>
                        </div>

                        <!-- Блок с кодом в стиле цифрового дисплея -->
                        <div style="background:#0e1a2b;padding:25px;text-align:center;margin:30px 0;border:2px solid #4a8ba8;position:relative;z-index:2;">
                            <div style="font-size:32px;letter-spacing:10px;padding:15px;display:inline-block;color:#9bd3dd;
                                        border:1px solid #4a8ba8;background:#0a121f;
                                        box-shadow:inset 0 0 15px rgba(74,139,168,0.3);font-weight:bold;">
                                ░▒▓ %code% ▓▒░
                            </div>
                        </div>

                        <!-- Сообщение с ASCII-артом -->
                        <div style="border-left:3px solid #4a8ba8;padding:15px;margin:30px 0;position:relative;z-index:2;background:#0a121f;">
                            <div style="margin:0;color:#9bd3dd;font-size:14px;line-height:1.5;white-space:pre-wrap;">
                    [!] █▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀█
                        █ WARNING SYSTEM CORRUPTION █
                        █▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄█

                    ► Input verification code to restore
                    ► Time remaining: [■■■■■■■■□□] 80%
                    ► Emergency protocol: ACTIVATED
                            </div>
                        </div>

                        <!-- Интерактивная панель -->
                        <div style="border:2px dashed #4a8ba8;padding:15px;margin:30px 0;position:relative;z-index:2;">
                            <div style="color:#9bd3dd;font-size:12px;display:flex;justify-content:space-between;">
                                <span>STATUS: <span style="color:#8cc14c;">■ ONLINE</span></span>
                                <span>VERSION: 2.4.1</span>
                                <span>CPU: 87%</span>
                            </div>
                        </div>

                        <!-- Pixel cat image с эффектом свечения -->
                        <img src="https://avatars.mds.yandex.net/i?id=a35db5aba997d422b81d0d02b48b5512013f19a8cdde56eb-11476564-images-thumbs&n=13" 
                                style="display:block;margin:40px auto 0;width:100px;filter:drop-shadow(0 0 8px #4a8ba8);">

                        <!-- Подвал с анимированным текстом -->
                        <div style="text-align:center;font-size:12px;color:#4a8ba8;margin-top:40px;position:relative;z-index:2;">
                            <span style="animation:blink 1s infinite;">⚠</span> AUTOMATED SECURITY SYSTEM MESSAGE <span style="animation:blink 1s infinite;">⚠</span>
                        </div>
                    </div>
                    """.Replace("%code%", verificationCode);

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
