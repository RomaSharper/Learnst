using Learnst.Infrastructure.Models;

namespace Learnst.Infrastructure.Interfaces;

public interface ICertificateService
{
    Task<bool> ValidateUserCompletionAsync(Guid userId, Guid activityId);
    Task<byte[]> GenerateCertificateAsync(User User, Activity activity);
}
