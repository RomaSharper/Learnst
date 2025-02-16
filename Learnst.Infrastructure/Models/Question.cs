using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using Learnst.Domain.Enums;
using Learnst.Infrastructure.Interfaces;

namespace Learnst.Infrastructure.Models;

public class Question : IEntity
{
    [Key] public Guid Id { get; set; } = Guid.NewGuid();

    [Required, StringLength(200, MinimumLength = 3)] public string Text { get; set; } = string.Empty;

    [Required] public AnswerType AnswerType { get; set; }

    public Guid LessonId { get; set; }
    
    [JsonIgnore] public Lesson? Lesson { get; set; }

    public ICollection<Answer> Answers { get; set; } = [];

    public ICollection<UserAnswer> UserAnswers { get; set; } = [];
}
