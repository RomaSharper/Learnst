using System.Text.Json.Serialization;

namespace Learnst.Dao.Models;

public class UserActivity
{
    public Guid UserId { get; set; }
    
    [JsonIgnore] public User? User { get; set; }

    public Guid ActivityId { get; set; }
    
    [JsonIgnore] public Activity? Activity { get; set; }

    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
}
