using System.Text.Json.Serialization;
using Learnst.Domain.Interfaces;

namespace Learnst.Domain.Models;

public class UserActivity : ICompositeKeyEntity<(Guid, Guid)>
{
    public Guid UserId { get; set; }
    
    [JsonIgnore] public User? User { get; set; }

    public Guid ActivityId { get; set; }
    
    [JsonIgnore] public Activity? Activity { get; set; }

    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;

    public IEnumerable<string> GetKeyPropertyNames() => [nameof(UserId), nameof(ActivityId)];
}
