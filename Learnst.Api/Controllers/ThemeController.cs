using Learnst.Api.Models;
using Learnst.Infrastructure.Exceptions;
using Learnst.Infrastructure.Interfaces;
using Learnst.Infrastructure.Models;
using Learnst.Infrastructure.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace Learnst.Api.Controllers;

[ApiController]
[Route("[controller]")]
public class ThemeController(
    UsersRepository usersRepository,
    IAsyncRepository<Theme, string> themesRepository
) : ControllerBase
{
    [HttpPost("{userId:guid}/{themeId}")]
    public async Task<ActionResult<User>> SetTheme(Guid userId, string themeId)
    {
        try
        {
            var user = await usersRepository.GetByIdAsync(userId, noTracking: false)
                ?? throw new NotFoundException<User>(userId);

            if (!await themesRepository.ExistsAsync(t => t.Id == themeId))
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
