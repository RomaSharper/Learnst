using System.Text.Json.Serialization;
using Learnst.Infrastructure.Interfaces;

namespace Learnst.Infrastructure.Models;

public class UserAnswer : ICompositeKeyEntity<(Guid, int)>
{
    public Guid UserId { get; set; }
    
    [JsonIgnore] public User? User { get; set; }

    public int AnswerId { get; set; }
    
    [JsonIgnore] public Answer? Answer { get; set; }

    public IEnumerable<string> GetKeyPropertyNames() => [nameof(UserId), nameof(AnswerId)];

    public string StringKey => $"UserId={UserId}, AnswerId={AnswerId}";
}
