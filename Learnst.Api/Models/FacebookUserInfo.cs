namespace Learnst.Api.Models;

public class FacebookUserInfo
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public FacebookPicture Picture { get; set; } = null!;
}
