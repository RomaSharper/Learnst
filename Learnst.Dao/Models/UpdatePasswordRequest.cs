namespace Learnst.Dao.Models;

public class UpdatePasswordRequest
{
    public Guid UserId { get; set; }
    public string Password { get; set; } = string.Empty;
}
