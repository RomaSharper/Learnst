using Learnst.Dao.Models;

namespace Learnst.Api.Models;

public class UpdatedResponse
{
    public string? Message { get; set; }
    public bool Succeed { get; set; }
    public User? User { get; set; }
}
