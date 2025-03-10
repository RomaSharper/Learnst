using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using Learnst.Api.Models;
using Microsoft.Extensions.Options;

namespace Learnst.Api.Services;

public class YookassaService
{
    private readonly HttpClient _httpClient;
    private readonly string _shopId;
    private readonly string _secretKey;
    private readonly ILogger<YookassaService> _logger;

    public YookassaService(
        HttpClient httpClient,
        ILogger<YookassaService> logger,
        IOptions<YookassaSettings> settings)
    {
        _httpClient = httpClient;
        _shopId = settings.Value.ShopId;
        _secretKey = settings.Value.SecretKey;
        _logger = logger;

        _httpClient.BaseAddress = new Uri("https://api.yookassa.ru/v3/");
        var auth = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{_shopId}:{_secretKey}"));
        _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", auth);
    }

    public async Task<PaymentResponse> CreatePaymentAsync(NewPayment payment)
    {
        try
        {
            var request = new
            {
                amount = payment.Amount,
                payment_method_data = payment.PaymentMethodData,
                confirmation = payment.Confirmation,
                capture = payment.Capture,
                description = payment.Description,
                metadata = payment.Metadata
            };

            var response = await _httpClient.PostAsJsonAsync("payments", request);
            response.EnsureSuccessStatusCode();

            return await response.Content.ReadFromJsonAsync<PaymentResponse>()
                ?? throw new ArgumentNullException("Ответ оказался пустым.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ошибка при обработке платежа.");
            throw;
        }
    }

    public async Task<PaymentResponse> GetPaymentAsync(string paymentId)
    {
        try
        {
            var response = await _httpClient.GetAsync($"payments/{paymentId}");
            response.EnsureSuccessStatusCode();

            return await response.Content.ReadFromJsonAsync<PaymentResponse>()
                ?? throw new ArgumentNullException("Ответ оказался пустым.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Не удалось получить статус операции.");
            throw;
        }
    }

    public bool ValidateWebhookSignature(string signature, string body)
    {
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(_secretKey));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(body));
        var computedSignature = Convert.ToBase64String(hash);
        return signature == computedSignature;
    }
}
