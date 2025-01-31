using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Learnst.Dao.Models;

public class Answer
{
    [Key]
    public int Id { get; set; }

    [StringLength(100, MinimumLength = 1)]
    public string Text { get; set; } = string.Empty;

    public bool IsCorrect { get; set; }

    public Guid QuestionId { get; set; }
    
    [JsonIgnore] public Question? Question { get; set; }
}
