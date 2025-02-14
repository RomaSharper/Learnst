using System.Text.Json.Serialization;
using Learnst.Domain.Enums;
using Learnst.Domain.Interfaces;

namespace Learnst.Domain.Models;

public class StatusHistory : IEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public TicketStatus Status { get; set; } = TicketStatus.Open;
    public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
    public Guid TicketId { get; set; }
    [JsonIgnore] public Ticket? Ticket { get; set; }
}
