using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using Learnst.Domain.Enums;
using Learnst.Infrastructure.Interfaces;

namespace Learnst.Infrastructure.Models;

public class SocialMediaProfile : IEntity<int>
{
    [Key] public int Id { get; set; }

    [Required] public SocialMediaPlatform Platform { get; set; }

    [Url, Required, StringLength(2048, MinimumLength = 10)] public string Url { get; set; } = string.Empty; // Полная URL-ссылка на профиль

    [Required] public Guid UserId { get; set; }

    [JsonIgnore] public User? User { get; set; }
}
