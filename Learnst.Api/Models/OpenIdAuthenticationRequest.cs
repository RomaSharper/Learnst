namespace Learnst.Api.Models;

public class OpenIdAuthenticationRequest
{
    private readonly Dictionary<string, string> _parameters;

    public OpenIdAuthenticationRequest(
        string assocHandle,
        string signed,
        string sig,
        IDictionary<string, string> query)
    {
        _parameters = query.ToDictionary(
            k => k.Key.ToLowerInvariant(), 
            v => v.Value);
            
        _parameters["openid.mode"] = "check_authentication";
        _parameters["openid.assoc_handle"] = assocHandle;
        _parameters["openid.signed"] = signed;
        _parameters["openid.sig"] = sig;
    }

    public async Task<bool> ValidateAsync()
    {
        using var client = new HttpClient();
        var content = new FormUrlEncodedContent(_parameters);
        var response = await client.PostAsync(
            "https://steamcommunity.com/openid/login", 
            content);

        return response.IsSuccessStatusCode 
               && (await response.Content.ReadAsStringAsync())
               .Contains("is_valid:true");
    }
}
