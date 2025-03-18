using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Learnst.Infrastructure.Enums;
using Learnst.Infrastructure.Interfaces;

namespace Learnst.Infrastructure.Models;

public class Activity : IEntity
{
    [Key] public Guid Id { get; set; } = Guid.NewGuid();

    [Required, StringLength(50, MinimumLength = 3)] public string Title { get; set; } = string.Empty;

    [StringLength(500)] public string? Description { get; set; }

    [StringLength(2048)] public string? AvatarUrl { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Required] public Level Level { get; set; }

    [ForeignKey(nameof(Author))] public Guid AuthorId { get; set; }
    
    public User? Author { get; set; }

    public ICollection<string> Tags { get; set; } = [];
    
    public ICollection<string> TargetAudience { get; set; } = [];

    public ICollection<string> CheckList { get; set; } = [];

    public ICollection<Topic> Topics { get; set; } = [];
    
    public ICollection<InfoCard> InfoCards { get; set; } = [];

    public ICollection<UserActivity> UserActivities { get; set; } = [];

    /** <summary>
     * Минимальное количество баллов, чтобы пройти курс, либо 0, если оно отсутствует
     *</summary>
     **/ public int MinimalScore { get; set; }

    public bool IsClosed { get; set; }

    public DateTime? EndAt { get; set; }
}
