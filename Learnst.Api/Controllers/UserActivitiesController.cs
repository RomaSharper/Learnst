using System.Linq.Expressions;
using Learnst.Api.Models;
using Learnst.Infrastructure.Exceptions;
using Learnst.Infrastructure.Interfaces;
using Learnst.Infrastructure.Models;
using Microsoft.AspNetCore.Mvc;
using Guid = System.Guid;

namespace Learnst.Api.Controllers;

[ApiController]
[Route("[controller]")]
public class UserActivitiesController(IAsyncRepository<UserActivity, (Guid, Guid)> repository) : ControllerBase
{
    private readonly Expression<Func<UserActivity, object?>>[] _includes =
    [
        ua => ua.User,
        ua => ua.Activity
    ];
    
    // GET: api/UserActivities
    [HttpGet]
    [Produces("application/json")]
    public async Task<ActionResult<IEnumerable<UserActivity>>> GetUserActivities()
        => Ok(await repository.GetAsync(includes: _includes));

    // GET: api/UserActivities/5
    [HttpGet("{userId:guid}")]
    [Produces("application/json")]
    public async Task<ActionResult<IEnumerable<UserActivity>>> GetUserActivitiesByUserId(Guid userId)
        => Ok(await repository.GetAsync(where: ua => ua.UserId == userId, includes: _includes));

    // GET: api/UserActivities/5/2
    [Produces("application/json")]
    [HttpGet("{userId:guid}/{activityId:guid}")]
    public async Task<ActionResult<UserActivity>> GetUserActivity(Guid userId, Guid activityId)
    {
        try
        {
            var userActivity = await repository.GetByIdAsync((userId, activityId), includes: _includes)
                ?? throw new NotFoundException<UserActivity, (Guid, Guid)>((userId, activityId));
            return Ok(userActivity);
        }
        catch (NotFoundException<UserActivity, (Guid, Guid)> nfe)
        {
            return NotFound(new ErrorResponse(nfe));
        }
        catch (Exception ex)
        {
            return BadRequest(new ErrorResponse(ex));
        }
    }

    // GET: api/UserActivities/CheckUserActivity/5/2
    [Produces("application/json")]
    [HttpGet("CheckUserActivity/{userId:guid}/{activityId:guid}")]
    public async Task<ActionResult<bool>> CheckUserActivity(Guid userId, Guid activityId)
        => await repository.ExistsAsync(ua => ua.UserId == userId && ua.ActivityId == activityId);

    // POST: api/UserActivities
    [HttpPost]
    [Produces("application/json")]
    public async Task<ActionResult<UserActivity>> PostUserActivity(UserActivity userActivity)
    {
        try
        {

            var (userId, activityId) = (userActivity.UserId, userActivity.ActivityId);
            if (await repository.ExistsAsync(ua => ua.UserId == userId && ua.ActivityId == activityId))
                throw new DuplicateException($"Пользователь \"{userId}\" уже записан на активность \"{activityId}\".");
            await repository.AddAsync(userActivity);
            await repository.SaveAsync();
            return CreatedAtAction(nameof(GetUserActivity), new { userId, activityId }, userActivity);
        }
        catch (DuplicateException de)
        {
            return StatusCode(StatusCodes.Status422UnprocessableEntity, new ErrorResponse(de));
        }
        catch (Exception ex)
        {
            return BadRequest(new ErrorResponse(ex));
        }
    }

    // PUT: api/UserActivities/5/2
    [Produces("application/json")]
    [HttpPut("{userId:guid}/{activityId:guid}")]
    public async Task<IActionResult> PutUserActivity(Guid userId, Guid activityId, UserActivity userActivity)
    {
        try
        {
            NotEqualsException.ThrowIfNotEquals(userId, userActivity.UserId);
            NotEqualsException.ThrowIfNotEquals(activityId, userActivity.ActivityId);
            var existingUserActivity = await repository.GetByIdAsync((userId, activityId))
                ?? throw new NotFoundException<UserActivity, (Guid, Guid)>((userId, activityId));
            var result = repository.Update(existingUserActivity, userActivity);
            await repository.SaveAsync();
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new ErrorResponse(ex));
        }
    }

    // DELETE: api/UserActivities/5/2
    [Produces("application/json")]
    [HttpDelete("{userId:guid}/{activityId:guid}")]
    public async Task<IActionResult> DeleteUserActivity(Guid userId, Guid activityId)
    {
        try
        {
            await repository.DeleteAsync((userId, activityId));
            await repository.SaveAsync();
            return NoContent();
        }
        catch (NotFoundException<Answer, int> nfe)
        {
            return NotFound(new ErrorResponse(nfe));
        }
        catch (Exception ex)
        {
            return BadRequest(new ErrorResponse(ex));
        }
    }
}
