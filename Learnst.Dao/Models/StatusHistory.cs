using Learnst.Dao.Enums;
using System.Text.Json.Serialization;

namespace Learnst.Dao.Models;

public class StatusHistory
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public TicketStatus Status { get; set; } = TicketStatus.Open;
    public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
    public Guid TicketId { get; set; }
    [JsonIgnore] public Ticket? Ticket { get; set; }
}
