using Learnst.Api.Models;
using Learnst.Infrastructure.Exceptions;
using Learnst.Infrastructure.Interfaces;
using Learnst.Infrastructure.Models;
using Microsoft.AspNetCore.Mvc;

namespace Learnst.Api.Controllers;

[ApiController]
[Route("[controller]")]
public class ThemeController(
    IAsyncRepository<User, Guid> usersRepository,
    IAsyncRepository<Theme, string> themesRepository
) : ControllerBase
{
    private readonly string[] _freeThemes = ["light", "dark"];

    [HttpPost("{userId:guid}/{themeId}")]
    public async Task<ActionResult<User>> SetTheme(Guid userId, string themeId)
    {
        try
        {
            var user = await usersRepository.GetByIdAsync(userId, includes: [
                u => u.UserSubscriptions,
                u => u.Educations,
                u => u.SocialMediaProfiles,
                u => u.WorkExperiences,
                u => u.UserActivities,
                u => u.UserLessons,
                u => u.UserAnswers,
                u => u.Tickets,
                u => u.TicketAnswers,
                u => u.Theme
            ]) ?? throw new NotFoundException<User>(userId);

            if (!_freeThemes.Contains(themeId) && !user.UserSubscriptions.Any(us => us.EndDate > DateTime.UtcNow))
                throw new AccessViolationException("Пользователь не обладает премиум-подпиской.");

            if (!await themesRepository.ExistsAsync(themeId))
                throw new NotFoundException<Theme, string>(themeId);

            user.ThemeId = themeId;
            await usersRepository.SaveAsync();
            return user;
        }
        catch (AccessViolationException ave)
        {
            return StatusCode(StatusCodes.Status402PaymentRequired, new ErrorResponse(ave));
        }
        catch (Exception nfe) when (nfe is NotFoundException<User> or NotFoundException<Theme, string>)
        {
            return NotFound(new ErrorResponse(nfe));
        }
        catch (Exception ex)
        {
            return BadRequest(new ErrorResponse(ex));
        }
    }
}
