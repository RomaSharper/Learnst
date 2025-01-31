using Learnst.Dao.Enums;

namespace Learnst.Dao.Models;

public class UpdateRoleRequest
{
    public Role Role { get; set; }
    public Guid UserId { get; set; }
    public Guid AdminId { get; set; }
}
