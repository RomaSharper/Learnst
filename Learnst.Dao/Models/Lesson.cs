using Learnst.Dao.Enums;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Learnst.Dao.Models;

public class Lesson
{
    [Key] public Guid Id { get; set; } = Guid.NewGuid();

    [Required, StringLength(50, MinimumLength = 2)] public string Title { get; set; } = string.Empty;

    [StringLength(2048)] public string? LongReadUrl { get; set; }

    [StringLength(2048)] public string? VideoUrl { get; set; }

    public ICollection<Question> Questions { get; set; } = [];

    public int DurationInMinutes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.Now;

    public Guid TopicId { get; set; }
    
    [JsonIgnore] public Topic? Topic { get; set; }

    public ICollection<UserLesson> UserLessons { get; set; } = [];

    [NotMapped] public LessonType LessonType => !string.IsNullOrEmpty(LongReadUrl)
        ? LessonType.LongRead : !string.IsNullOrEmpty(VideoUrl)
            ? LessonType.Video : LessonType.Test;
}
