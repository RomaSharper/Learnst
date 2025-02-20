using Learnst.Domain.Enums;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Learnst.Infrastructure.Models;

public class UserSubscription
{
    [Key] public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    [JsonIgnore] public User? User { get; set; }
    public SubscriptionType SubscriptionType { get; set; } = SubscriptionType.Basic;
    public DateTime StartDate { get; set; } = DateTime.UtcNow;
    public DateTime EndDate { get; set; }
    public DateTime UpdatedAt { get; set; }
}
