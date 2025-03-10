namespace Learnst.Api.Models;

public class Confirmation
{
    public string Type { get; set; } = "redirect";
    public string ReturnUrl { get; set; } = string.Empty;
    public string RedirectUrl { get; set; } = string.Empty;
}
