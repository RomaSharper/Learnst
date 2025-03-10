using Microsoft.AspNetCore.Mvc;
using Learnst.Infrastructure.Models;
using Learnst.Api.Services;
using Learnst.Infrastructure.Interfaces;

namespace Learnst.Api.Controllers;

[ApiController]
[Route("[controller]")]
public class PaymentController(
    PaymentService paymentService,
    IAsyncRepository<UserSubscription, Guid> subscriptionRepository) : ControllerBase
{
    

    [HttpGet("active")]
    public async Task<IActionResult> GetActiveSubscription([FromQuery] Guid userId)
    {
        var now = DateTime.UtcNow;
        var subscriptions = await subscriptionRepository.GetAsync(
            where: s => s.UserId == userId && s.EndDate > now);

        if (!subscriptions.Any())
            return Ok(null);

        var latest = subscriptions.MaxBy(s => s.UpdatedAt);
        if (latest is null)
            return Ok(null);

        return Ok(new UserSubscription
        {
            EndDate = latest.EndDate,
            StartDate = latest.StartDate
        });
    }
}
