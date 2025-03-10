using Learnst.Api.Models;
using Learnst.Api.Services;
using Learnst.Infrastructure.Interfaces;
using Learnst.Infrastructure.Models;
using Learnst.Infrastructure.Repositories;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;

namespace Learnst.Api.Controllers;

[ApiController]
[Route("[controller]")]
public class PaymentController(
    YookassaService yookassaService,
    IOptions<SubscriptionSettings> subscriptionSettings,
    IAsyncRepository<PaymentRecord, Guid> paymentRepository,
    IAsyncRepository<UserSubscription, Guid> subscriptionRepository
) : ControllerBase
{
    private readonly SubscriptionSettings _subscriptionSettings = subscriptionSettings.Value;

    [HttpGet("active")]
    public async Task<IActionResult> GetActiveSubscription([FromQuery] Guid userId)
    {
        var now = DateTime.UtcNow;
        var subscriptions = await subscriptionRepository.GetAsync(
            where: s => s.UserId == userId && s.EndDate > now);

        if (!subscriptions.Any())
            return Ok(null);

        var latest = subscriptions
            .OrderByDescending(s => s.UpdatedAt)
            .First();

        return Ok(new UserSubscription
        {
            EndDate = latest.EndDate,
            StartDate = latest.StartDate
        });
    }

    [HttpPost("create-subscription")]
    public async Task<IActionResult> CreateSubscriptionPayment([FromBody] PaymentRequest request)
    {
        try
        {
            var totalPrice = CalculateTotalPrice(request.Duration, _subscriptionSettings.Price);

            var payment = new NewPayment
            {
                Capture = true,
                Amount = new Amount
                {
                    Value = decimal.Round(totalPrice, 2, MidpointRounding.AwayFromZero),
                    Currency = "RUB"
                },
                Description = $"Подписка Learnst Premium на {GetDurationText(request.Duration)}",
                PaymentMethodData = new PaymentMethodData
                {
                    Type = "bank_card", // или другой метод
                },
                Confirmation = new Confirmation
                {
                    Type = "redirect",
                    ReturnUrl = "https://learnst.runasp.net/payment/success",
                    RedirectUrl = "https://learnst.runasp.net/payment/confirm"
                },
                Metadata = new Dictionary<string, string>
                {
                    ["userId"] = request.UserId.ToString(),
                    ["duration"] = request.Duration.ToString(),
                    ["subscriptionType"] = "premium"
                }
            };

            var paymentResponse = await yookassaService.CreatePaymentAsync(payment);
            return Ok(new
            {
                paymentResponse.Confirmation?.ConfirmationUrl,
                paymentId = paymentResponse.Id // Добавляем paymentId в ответ
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Ошибка: {ex.Message}");
        }
    }

    [HttpGet("payment-status/{paymentId}")]
    public async Task<IActionResult> GetPaymentStatus(string paymentId)
    {
        try
        {
            var payment = await yookassaService.GetPaymentAsync(paymentId);
            return Ok(payment.Status);
        }
        catch (Exception ex)
        {
            return StatusCode(500, ex.Message);
        }
    }

    [HttpPost("webhook")]
    public async Task<IActionResult> HandleWebhook()
    {
        var signature = Request.Headers["Content-SHA256"].FirstOrDefault();
        var body = await new StreamReader(Request.Body).ReadToEndAsync();

        if (signature is null || !yookassaService.ValidateWebhookSignature(signature, body))
            return BadRequest("Invalid signature");

        var notification = JsonConvert.DeserializeObject<YookassaNotification>(body);

        switch (notification?.Event)
        {
            case "payment.succeeded":
                await HandleSuccessfulPayment(notification.Object);
                break;

            case "payment.canceled":
                await HandleCanceledPayment(notification.Object);
                break;
        }

        return Ok();
    }

    [HttpGet("payment-history")]
    public async Task<IActionResult> GetPaymentHistory([FromQuery] Guid userId)
    {
        var payments = await paymentRepository.GetAsync(
            where: p => p.UserId == userId,
            orderBy: q => q.CreatedAt,
            descending: true);

        return Ok(payments.Select(p => new
        {
            p.Id,
            p.Amount,
            Date = p.CreatedAt,
            p.Status
        }));
    }

    private async Task HandleSuccessfulPayment(PaymentObject payment)
    {
        var metadata = payment.Metadata;
        var userId = Guid.Parse(metadata["userId"]);
        var duration = int.Parse(metadata["duration"]);

        // Сохраняем запись о платеже
        var paymentRecord = new PaymentRecord
        {
            UserId = userId,
            PaymentId = payment.Id,
            Amount = payment.Amount.Value,
            Status = "succeeded",
            Duration = duration
        };

        await paymentRepository.AddAsync(paymentRecord);
        await paymentRepository.SaveAsync();

        // Создаем/обновляем подписку
        await CreateSubscription(userId, duration);
    }

    private async Task HandleCanceledPayment(PaymentObject payment)
    {
        var metadata = payment.Metadata;
        var userId = Guid.Parse(metadata["userId"]);

        // Обновляем запись о платеже
        var paymentRecord = await paymentRepository.GetFirstAsync(
            where: p => p.PaymentId == payment.Id);

        if (paymentRecord != null)
        {
            paymentRecord.Status = "canceled";
            await paymentRepository.SaveAsync();
        }

        // Отменяем подписку
        var subscription = await subscriptionRepository.GetFirstAsync(
            where: s => s.UserId == userId && s.EndDate > DateTime.UtcNow);

        if (subscription != null)
        {
            subscription.EndDate = DateTime.UtcNow;
            await subscriptionRepository.SaveAsync();
        }
    }

    private async Task CreateSubscription(Guid userId, int duration)
    {
        var now = DateTime.UtcNow;
        var existing = await subscriptionRepository.GetFirstAsync(where: s =>
            s.UserId == userId && s.EndDate > now);

        var endDate = existing != null
            ? existing.EndDate.AddMonths(duration)
            : now.AddMonths(duration);

        var subscription = new UserSubscription
        {
            UserId = userId,
            StartDate = now,
            EndDate = endDate,
            UpdatedAt = now
        };

        await subscriptionRepository.AddAsync(subscription);
        await subscriptionRepository.SaveAsync();
    }

    private static string GetDurationText(int duration) => duration switch
    {
        1 => "1 месяц",
        3 => "3 месяца",
        12 => "1 год",
        _ => $"{duration} мес."
    };

    private static decimal CalculateTotalPrice(int duration, decimal basePrice) => duration switch
    {
        3 => basePrice * 3 * 0.9m,
        12 => basePrice * 12 * 0.8m,
        _ => basePrice * duration
    };
}