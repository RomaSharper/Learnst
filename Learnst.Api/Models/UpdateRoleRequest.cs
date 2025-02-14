using Learnst.Domain.Enums;

namespace Learnst.Api.Models;

public class UpdateRoleRequest
{
    public Role Role { get; set; }
    public Guid UserId { get; set; }
    public Guid AdminId { get; set; }
}
