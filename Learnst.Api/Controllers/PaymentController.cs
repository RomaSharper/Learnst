using Learnst.Api.Models;
using Learnst.Api.Services;
using Learnst.Infrastructure.Interfaces;
using Learnst.Infrastructure.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Learnst.Api.Controllers;

[ApiController]
[Route("[controller]")]
public class PaymentController(
    YookassaService yookassaService,
    IOptions<SubscriptionSettings> subscriptionSettings,
    IAsyncRepository<UserSubscription, Guid> repository
) : ControllerBase
{
    private readonly SubscriptionSettings _subscriptionSettings = subscriptionSettings.Value;

    [HttpPost("create-subscription")]
    public async Task<IActionResult> CreateSubscriptionPayment([FromBody] PaymentRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var totalPrice = CalculateTotalPrice(request.Duration, _subscriptionSettings.Price);

            var payment = new NewPayment
            {
                Capture = true,
                Amount = new Amount { Value = totalPrice, Currency = "RUB" },
                Description = $"Подписка на {request.Duration} мес.",
                PaymentMethodData = new PaymentMethodData
                {
                    Type = "sbp",
                    Sbp = new Sbp { Provider = "sberbank" }
                },
                Confirmation = new Confirmation
                {
                    Type = "redirect",
                    RedirectUri = "https://learnst.runasp.net/payment/confirm"
                },
                Metadata = new Dictionary<string, string>
                {
                    ["userId"] = request.UserId.ToString(),
                    ["duration"] = request.Duration.ToString()
                }
            };

            var paymentResponse = await yookassaService.CreatePaymentAsync(payment);
            return Ok(new { paymentResponse.Confirmation?.ConfirmationUrl });
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Ошибка: {ex.Message}");
        }
    }

    [HttpGet("active")]
    public async Task<IActionResult> GetActiveSubscription([FromQuery] Guid userId)
        {
            var now = DateTime.UtcNow;
        var subscriptions = await repository.GetAsync(
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

    [HttpPost("cancel-subscription")]
    public async Task<IActionResult> CancelSubscription([FromBody] Guid userId)
    {
        var subscription = await repository.GetFirstAsync(
            where: s => s.UserId == userId && s.EndDate > DateTime.UtcNow);
    
        if (subscription != null)
        {
            subscription.EndDate = DateTime.UtcNow;
            await repository.SaveAsync();
        }
    
        return Ok();
    }

    [HttpPost("webhook")]
    public async Task<IActionResult> HandleWebhook([FromBody] YookassaNotification notification)
    {
        if (notification.Event == "payment.succeeded")
        {
            var metadata = notification.Object!.Metadata;
            var userId = Guid.Parse(metadata["userId"]);
            var duration = int.Parse(metadata["duration"]);

            // Создаем новую подписку вместо продления
            var subscription = new UserSubscription
            {
                UserId = userId,
                StartDate = DateTime.UtcNow,
                EndDate = DateTime.UtcNow.AddMonths(duration),
                UpdatedAt = DateTime.UtcNow
            };

            await repository.AddAsync(subscription);
            await repository.SaveAsync();
        }
        return Ok();
    }

    private static decimal CalculateTotalPrice(int duration, decimal basePrice) => duration switch
    {
        3 => basePrice * 3 * 0.9m,
        12 => basePrice * 12 * 0.8m,
        _ => basePrice * duration
    };
}