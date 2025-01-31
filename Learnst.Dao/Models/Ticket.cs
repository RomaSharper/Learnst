using Learnst.Dao.Enums;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Learnst.Dao.Models;

public class Ticket
{
    public Guid Id { get; set; } = Guid.NewGuid();
    [StringLength(50, MinimumLength = 3)] public string Title { get; set; } = string.Empty;
    [StringLength(500)] public string? Description { get; set; }
    public TicketStatus Status { get; set; } = TicketStatus.Open;
    public Guid AuthorId { get; set; }
    [JsonIgnore] public User? Author { get; set; }
    public ICollection<TicketAnswer> TicketAnswers { get; set; } = [];
    public ICollection<StatusHistory> StatusHistories { get; set; } = [];
    public DateTime CreatedAt { get; set; } = DateTime.Now;
}
