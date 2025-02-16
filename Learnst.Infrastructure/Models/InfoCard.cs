using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using Learnst.Domain.Enums;
using Learnst.Infrastructure.Interfaces;

namespace Learnst.Infrastructure.Models;

public class InfoCard : IEntity<int>
{
    [Key] public int Id { get; set; }

    [Required, StringLength(2048)] public string Text { get; set; } = string.Empty;

    [StringLength(2048)] public string? IconUrl { get; set; }

    [Required] public InfoType InfoType { get; set; }

    public Guid ActivityId { get; set; }
    
    [JsonIgnore] public Activity? Activity { get; set; }
}
