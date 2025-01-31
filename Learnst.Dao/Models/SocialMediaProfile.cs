using Learnst.Dao.Enums;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Learnst.Dao.Models;

public class SocialMediaProfile
{
    [Key] public int Id { get; set; }

    [Required] public SocialMediaPlatform Platform { get; set; }

    [Url, Required, StringLength(2048, MinimumLength = 10)] public string Url { get; set; } = string.Empty; // Полная URL-ссылка на профиль

    [Required] public Guid UserId { get; set; }

    [JsonIgnore] public User? User { get; set; }
}
