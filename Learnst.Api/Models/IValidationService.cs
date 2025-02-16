using Learnst.Infrastructure.Models;

namespace Learnst.Api.Models;

public interface IValidationService
{
    UpdatedResponse ValidateEmail(string email);
    UpdatedResponse ValidatePassword(User user);
    UpdatedResponse ValidateUrl(string url);
    Task<UpdatedResponse> ValidateUsername(string username, Guid userId);
}
