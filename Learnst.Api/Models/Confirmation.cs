namespace Learnst.Api.Models;

public class Confirmation
{
    public string Type { get; set; } = "redirect";
    public string RedirectUri { get; set; } = string.Empty;
}
