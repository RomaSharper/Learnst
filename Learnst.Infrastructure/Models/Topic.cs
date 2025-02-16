using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using Learnst.Infrastructure.Interfaces;

namespace Learnst.Infrastructure.Models;

public class Topic : IEntity
{
    [Key] public Guid Id { get; set; } = Guid.NewGuid();

    [Required, StringLength(50, MinimumLength = 3)] public string Title { get; set; } = string.Empty;

    public ICollection<Lesson> Lessons { get; set; } = [];

    public Guid ActivityId { get; set; }
    
    [JsonIgnore] public Activity? Activity { get; set; }
}
