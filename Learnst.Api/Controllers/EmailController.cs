using Learnst.Api.Models;
using Learnst.Api.Services;
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

        var verificationCode = GenerateVerificationCode();
        var device = DeviceService.GetInfo(HttpContext);
        
        const string subject = "Ваш код подтверждения";
        var body = """
                    <div style="margin:0 auto; padding:0; max-width:640px; font-family: 'Inter', Arial, sans-serif; background-color: #f7f7f8;">
                    
                        <!-- Основной контейнер -->
                        <div style="background:white; border-radius:6px; box-shadow:0 4px 12px rgba(0,0,0,0.08); border:1px solid #e1e1e8; margin:0 auto;">
                    
                            <!-- Шапка с логотипом -->
                            <div style="text-align:center; padding:40px 35px 30px; border-bottom:1px solid #f0f0f8;">
                                <img src="https://learnst.runasp.net/assets/icons/favicon.png" alt="Learnst" style="height:48px; margin-bottom:20px;">
                                <h1 style="margin:0; font-size:26px; font-weight:700; color:#0f0f23; line-height:1.3;">
                                    Подтверждение почты Learnst
                                </h1>
                                <p style="margin:12px 0 0; font-size:16px; color:#6a6a8a;">
                                    Для завершения регистрации введите код подтверждения
                                </p>
                            </div>
                    
                            <!-- Код подтверждения -->
                            <div style="text-align:center; padding:40px 35px; border-bottom:1px solid #f0f0f8;">
                                <p style="margin:0 0 16px; font-size:16px; font-weight:500; color:#6a6a8a;">
                                    Ваш код подтверждения:
                                </p>
                                <div style="display:inline-block; background:#f0ebff; border-radius:6px; padding:18px 30px; border:2px solid #d9d1ff;">
                                    <div style="font-size:42px; font-weight:700; color:#9146ff; font-family: monospace, sans-serif; letter-spacing:0 !important;">
                                        %code%
                                    </div>
                                </div>
                                <p style="margin:16px 0 0; font-size:14px; color:#6a6a8a;">
                                    Код действует, пока открыто окно подтверждения
                                </p>
                            </div>
                    
                            <!-- Информационные карточки -->
                            <div style="padding:40px 35px; margin-bottom: 12px; border-bottom:1px solid #f0f0f8;">
                                <div style="display:flex; flex-wrap:wrap; margin-left:-10px; margin-right:-10px;">
                                    <div style="flex:1; min-width:240px; padding:0 10px; margin-bottom:20px;">
                                        <div style="background:#f9f9ff; border-radius:6px; padding:22px; border:1px solid #eaeaff; height:100%;">
                                            <h3 style="margin:0 0 16px; font-size:17px; font-weight:600; color:#0f0f23;">
                                                <span style="color:#9146ff; font-weight:700;">1. </span>
                                                Как использовать код
                                            </h3>
                                            <ul style="margin:0; padding-left:20px; font-size:15px; color:#5a5a7a; line-height:1.6;">
                                                <li>Вернитесь в окно регистрации</li>
                                                <li>Введите 6-значный код</li>
                                                <li>Нажмите "Подтвердить"</li>
                                            </ul>
                                        </div>
                                    </div>
                    
                                    <div style="flex:1; min-width:240px; padding:0 10px; margin-bottom:20px;">
                                        <div style="background:#f9f9ff; border-radius:6px; padding:22px; border:1px solid #eaeaff; height:100%;">
                                            <h3 style="margin:0 0 16px; font-size:17px; font-weight:600; color:#0f0f23;">
                                                <span style="color:#9146ff; font-weight:700;">2. </span>
                                                Безопасность аккаунта
                                            </h3>
                                            <ul style="margin:0; padding-left:20px; font-size:15px; color:#5a5a7a; line-height:1.6;">
                                                <li>Никому не сообщайте этот код</li>
                                                <li>Learnst не запрашивает пароли по почте</li>
                                                <li>Код сгенерирован только для вас</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                    
                            <!-- Системная информация -->
                            <div style="padding:40px 35px; margin-bottom: 12px; border-bottom:1px solid #f0f0f8;">
                                <div style="background:#f9f9ff; border-radius:6px; padding:22px; border:1px solid #eaeaff;">
                                    <h3 style="margin:0 0 16px; font-size:16px; font-weight:600; color:#0f0f23; display:flex; align-items:center;">
                                        <span style="display:inline-block; width:8px; height:8px; background:#9146ff; border-radius:50%; margin-right:8px;"></span>
                                        Информация о запросе
                                    </h3>
                                    <div style="display:flex; flex-wrap:wrap; margin-left:-10px; margin-right:-10px;">
                                        <div style="flex:1; min-width:240px; padding:0 10px; margin-bottom:15px;">
                                            <div style="margin-bottom:6px; font-size:13px; color:#5a5a7a;">Устройство:</div>
                                            <div style="font-weight:500; color:#0f0f23; display:flex; align-items:center;">
                                                <span>%device_info%</span>
                                            </div>
                                        </div>
                                        <div style="flex:1; min-width:240px; padding:0 10px; margin-bottom:15px;">
                                            <div style="margin-bottom:6px; font-size:13px; color:#5a5a7a;">Браузер:</div>
                                            <div style="font-weight:500; color:#0f0f23; display:flex; align-items:center;">
                                                <span>%browser_name%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                    
                            <!-- Предупреждение (стиль Twitch) -->
                            <div style="padding:0 35px 40px;margin-top: 20px;">
                                <div style="background:#fffbeb; border-radius:4px; padding:18px 22px; border:1px solid #ffd666;">
                                    <p style="margin:0; font-size:14px; font-weight:600; color:#8e4e10; line-height:1.5; text-align:center;">
                                        Если вы не регистрировались или не восстанавливали пароль на Learnst, проигнорируйте это письмо.
                                    </p>
                                </div>
                            </div>
                    
                            <!-- Поддержка -->
                            <div style="text-align:center; padding:25px 35px 35px;">
                                <p style="margin:0 0 15px; font-size:15px; color:#6a6a8a;">
                                    Вопросы? Пишите в поддержку:
                                </p>
                                <a href="mailto:support@learnst.runasp.net" style="display:inline-block; background:#9146ff; color:white; text-decoration:none; font-weight:600; padding:12px 28px; border-radius:4px; font-size:15px; margin-top:5px;">
                                    support@learnst.runasp.net
                                </a>
                                <p style="margin:25px 0 0; font-size:14px; color:#9a9ab0;">
                                    © 2025 Learnst · Образовательная платформа
                                </p>
                            </div>
                        </div>
                    </div>
                    """.Replace("%code%", verificationCode)
                        .Replace("%device_info%", device.Info)
                        .Replace("%browser_name%", device.BrowserName);

        try
        {
            await emailSender.SendEmailAsync(request.Email, subject, body);
            return Ok(new { Code = verificationCode });
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Ошибка сервера: {ex.Message}");
        }
    }

    private string GenerateVerificationCode() => _random.Value.Next(100000, 999999).ToString();

    public record VerificationCodeRequest(string Email);
}
