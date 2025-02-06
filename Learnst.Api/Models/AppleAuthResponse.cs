using Microsoft.AspNetCore.Mvc;

namespace Learnst.Api.Models;

public class AppleAuthResponse
{
    [FromForm(Name = "code")] 
    public string Code { get; set; } = string.Empty;
    
    [FromForm(Name = "state")] 
    public string State { get; set; } = string.Empty;
    
    [FromForm(Name = "user")] 
    public string User { get; set; } = string.Empty;
}
