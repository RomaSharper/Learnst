using System.Net.Http.Headers;
using System.Text;
using Learnst.Api.Models;
using Microsoft.Extensions.Options;

namespace Learnst.Api.Services;

public class YookassaService
{
    private readonly HttpClient _httpClient;
    private readonly YookassaSettings _settings;

    public YookassaService(
        IOptions<YookassaSettings> settings,
        IHttpClientFactory httpClientFactory
    )
    {
        _settings = settings.Value;
        _httpClient = httpClientFactory.CreateClient();
        _httpClient.BaseAddress = new Uri("https://api.yookassa.ru/v3/");
        
        var authToken = Convert.ToBase64String(
            Encoding.UTF8.GetBytes($"{_settings.ShopId}:{_settings.SecretKey}"));
        
        _httpClient.DefaultRequestHeaders.Authorization = 
            new AuthenticationHeaderValue("Basic", authToken);
    }

    public async Task<PaymentResponse> CreatePaymentAsync(NewPayment payment)
    {
        var response = await _httpClient.PostAsJsonAsync(
            "payments", 
            new 
            {
                amount = payment.Amount,
                confirmation = payment.Confirmation,
                description = payment.Description,
                payment_method_data = payment.PaymentMethodData,
                metadata = payment.Metadata
            });

        response.EnsureSuccessStatusCode();
        
        return await response.Content.ReadFromJsonAsync<PaymentResponse>() 
            ?? throw new InvalidOperationException("Invalid payment response");
    }
}
