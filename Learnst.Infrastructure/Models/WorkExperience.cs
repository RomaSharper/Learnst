using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using Learnst.Infrastructure.Interfaces;

namespace Learnst.Infrastructure.Models;

public class WorkExperience : IEntity<int>
{
    [Key] public int Id { get; set; }

    [Required, StringLength(200, MinimumLength = 3)] public string CompanyName { get; set; } = string.Empty;

    [Required, StringLength(200, MinimumLength = 3)] public string Position { get; set; } = string.Empty;

    [StringLength(1000)] public string? Description { get; set; }

    [Required] public DateOnly StartDate { get; set; }

    public DateOnly? EndDate { get; set; }

    public Guid UserId { get; set; }
    
    [JsonIgnore] public User? User { get; set; }
}
