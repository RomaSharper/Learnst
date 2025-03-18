using Learnst.Infrastructure.Interfaces;
using System.Text.Json.Serialization;

namespace Learnst.Infrastructure.Models;

public class Follow : ICompositeKeyEntity<(Guid, Guid)>
{
    public Guid UserId { get; set; }

    public Guid FollowerId { get; set; }
    
    [JsonIgnore] public User? User { get; set; }

    [JsonIgnore] public User? Follower { get; set; }

    public IEnumerable<string> GetKeyPropertyNames() => [nameof(UserId), nameof(FollowerId)];
}
