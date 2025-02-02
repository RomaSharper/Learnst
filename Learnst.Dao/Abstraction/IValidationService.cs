using Learnst.Dao.Models;

namespace Learnst.Dao.Abstraction;

public interface IValidationService
{
    UpdatedResponse ValidateEmail(string email);
    UpdatedResponse ValidatePassword(string? password, string? googleId);
    UpdatedResponse ValidateUrl(string url);
    Task<UpdatedResponse> ValidateUsername(string username, Guid userId);
}
