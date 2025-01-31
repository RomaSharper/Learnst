using System.Text.Json.Serialization;

namespace Learnst.Dao.Models;

public class UserLesson
{
    public Guid UserId { get; set; }
    
    [JsonIgnore] public User? User { get; set; }

    public Guid LessonId { get; set; }
    
    [JsonIgnore] public Lesson? Lesson { get; set; }
}
