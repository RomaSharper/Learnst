using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Learnst.Dao.Models;

public class TicketAnswer
{
    public Guid Id { get; set; } = Guid.NewGuid();
    [StringLength(500)] public string Content { get; set; } = string.Empty;
    public Guid TicketId { get; set; }
    [JsonIgnore] public Ticket? Ticket { get; set; }
    public Guid AuthorId { get; set; }
    [JsonIgnore] public User? Author{ get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
