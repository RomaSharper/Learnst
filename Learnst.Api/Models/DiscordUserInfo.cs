namespace Learnst.Api.Models;

public class DiscordUserInfo { 
    public string Id { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string Discriminator { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Avatar { get; set; } = string.Empty;
}
