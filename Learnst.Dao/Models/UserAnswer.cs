using System.Text.Json.Serialization;

namespace Learnst.Dao.Models;

public class UserAnswer
{
    public Guid UserId { get; set; }
    
    [JsonIgnore] public User? User { get; set; }

    public int AnswerId { get; set; }
    
    [JsonIgnore] public Answer? Answer { get; set; }
}