using System.Text.Json.Serialization;
using Learnst.Domain.Interfaces;

namespace Learnst.Domain.Models;

public class UserLesson : ICompositeKeyEntity<(Guid, Guid)>
{
    public Guid UserId { get; set; }
    
    [JsonIgnore] public User? User { get; set; }

    public Guid LessonId { get; set; }
    
    [JsonIgnore] public Lesson? Lesson { get; set; }
    
    public IEnumerable<string> GetKeyPropertyNames() => [nameof(UserId), nameof(LessonId)];
}
