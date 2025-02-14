using Learnst.Domain.Models;

namespace Learnst.Application.Interfaces;

public interface ICertificateService
{
    Task<bool> ValidateUserCompletionAsync(Guid userId, Guid activityId);
    Task<byte[]> GenerateCertificateAsync(User User, Activity activity);
}
