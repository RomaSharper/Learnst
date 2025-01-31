using Learnst.Dao.Models;

namespace Learnst.Dao.Abstraction;

public interface ICertificateService
{
    Task<bool> ValidateUserCompletionAsync(Guid userId, Guid activityId);
    Task<byte[]> GenerateCertificateAsync(User User, Activity activity);
}
