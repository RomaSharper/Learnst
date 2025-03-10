using Yandex.Checkout.V3;
using Microsoft.Extensions.Options;
using Learnst.Api.Models;
using Learnst.Infrastructure.Interfaces;
using Learnst.Infrastructure.Models;
using Learnst.Infrastructure.Exceptions;

namespace Learnst.Api.Services;

public class PaymentService(
    IOptions<YookassaSettings> settings,
    IAsyncRepository<User, Guid> usersRepository,
    IOptions<SubscriptionSettings> subscriptionSettings
 )
{
    private readonly AsyncClient _asyncClient = new Client(settings.Value.ShopId, settings.Value.SecretKey).MakeAsync();

    public async Task<object?> CreatePaymentAsync(PaymentRequest request)
    {
        var user = await usersRepository.GetByIdAsync(request.UserId)
            ?? throw new NotFoundException<User>(request.UserId);

        var newPayment = new NewPayment
        {
            Amount = new Amount
            {
                Value = CalculateTotalPrice(request.Duration, subscriptionSettings.Value.Price),
                Currency = "RUB"
            },
            Description = $"Learnst Premium подписка на {GetDurationText(request.Duration)}",
            Confirmation = new Confirmation
            {
                Type = ConfirmationType.Redirect,
                ReturnUrl = $"https://learnst.runasp.net/payment/callback?userId={request.UserId}",
            },
            Metadata = new Dictionary<string, string>
            {
                ["userId"] = request.UserId.ToString(),
                ["duration"] = request.Duration.ToString()
            },
            Capture = true,
            Receipt = new NewReceipt  // Добавляем чек для 54-ФЗ
            {
                Customer = new Customer { Email = user.EmailAddress },
                Items =
                [
                    new ReceiptItem
                    {
                        Description = $"Подписка Learnst Premium ({GetDurationText(request.Duration)})",
                        Quantity = 1,
                        Amount = new Amount
                        {
                            Value = CalculateTotalPrice(request.Duration, subscriptionSettings.Value.Price),
                            Currency = "RUB"
                        },
                        VatCode = VatCode.NoVat
                    }
                ]
            }
        };

        var payment = await _asyncClient.CreatePaymentAsync(newPayment);

        return new 
        {
            confirmationUrl = payment.Confirmation.ConfirmationUrl,
            qrUrl = GetQrCodeUrl(payment.Id), // Генерируем URL для QR-кода
            paymentId = payment.Id
        };
    }

    private static string GetQrCodeUrl(string paymentId)
    {
        return $"https://api.yookassa.ru/v3/payments/{paymentId}/qr";
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
