using Learnst.Dao.Models;
using Learnst.Dao;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Swashbuckle.AspNetCore.Annotations;

namespace Learnst.Api.Controllers;

[ApiController]
[Route("[controller]")]
public class UserActivitiesController(ApplicationDbContext context) : ControllerBase
{
    // GET: api/UserActivities
    [HttpGet]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<UserActivity>))]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Get all user activities",
        Description = "Returns a list of all user activities",
        OperationId = "GetUserActivities",
        Tags = ["UserActivities"]
    )]
    public async Task<ActionResult<IEnumerable<UserActivity>>> GetUserActivities() => await context.UserActivities
        .Include(ua => ua.User)
        .Include(ua => ua.Activity)
        .ToListAsync();

    // GET: api/UserActivities/5
    [HttpGet("{userId}")]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<UserActivity>))]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Get all user activities by user id",
        Description = "Returns a list of user activities by user id",
        OperationId = "GetUserActivitiesByUserId",
        Tags = ["UserActivities"]
    )]
    public async Task<ActionResult<IEnumerable<UserActivity>>> GetUserActivitiesByUserId(Guid userId) => await context.UserActivities
        .Include(ua => ua.User)
        .Include(ua => ua.Activity)
        .Where(ua => ua.UserId == userId)
        .ToListAsync();

    // GET: api/UserActivities/5/2
    [Produces("application/json")]
    [HttpGet("{userId}/{activityId}")]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(UserActivity))]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Get a user activity by user ID and activity ID",
        Description = "Returns a single user activity by user ID and activity ID",
        OperationId = "GetUserActivity",
        Tags = ["UserActivities"]
    )]
    public async Task<ActionResult<UserActivity>> GetUserActivity(Guid userId, Guid activityId)
    {
        var userActivity = await context.UserActivities
            .Include(ua => ua.User)
            .Include(ua => ua.Activity)
            .FirstOrDefaultAsync(ua => ua.UserId == userId && ua.ActivityId == activityId);

        if (userActivity is null)
            return NotFound();

        return userActivity;
    }

    // GET: api/UserActivities/CheckUserActivity/5/2
    [Produces("application/json")]
    [HttpGet("CheckUserActivity/{userId}/{activityId}")]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(bool))]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Check user activity by user ID and activity ID",
        Description = "Returns true if user enrolled either false",
        OperationId = "CheckUserActivity",
        Tags = ["UserActivities"]
    )]
    public async Task<ActionResult<bool>> CheckUserActivity(Guid userId, Guid activityId) => await context.UserActivities
        .Include(ua => ua.User)
        .Include(ua => ua.Activity)
        .AnyAsync(ua => ua.UserId == userId && ua.ActivityId == activityId);

    // POST: api/UserActivities
    [HttpPost]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status201Created, Type = typeof(UserActivity))]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Create a new user activity",
        Description = "Creates a new user activity",
        OperationId = "PostUserActivity",
        Tags = ["UserActivities"]
    )]
    public async Task<ActionResult<UserActivity>> PostUserActivity(UserActivity userActivity)
    {
        (var userId, var activityId) = (userActivity.UserId, userActivity.ActivityId);

        if (await UserActivityExists(userId, activityId))
            return BadRequest($"Пользователь \"{userId}\" уже связан с активностью \"{activityId}\".");

        context.UserActivities.Add(userActivity);
        await context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetUserActivity), new { userId, activityId }, userActivity);
    }

    // PUT: api/UserActivities/5/2
    [Produces("application/json")]
    [HttpPut("{userId}/{activityId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Update a user activity",
        Description = "Updates an existing user activity",
        OperationId = "PutUserActivity",
        Tags = ["UserActivities"]
    )]
    public async Task<IActionResult> PutUserActivity(Guid userId, Guid activityId, UserActivity userActivity)
    {
        if (userId != userActivity.UserId || activityId != userActivity.ActivityId)
            return BadRequest();

        context.Entry(userActivity).State = EntityState.Modified;

        try
        {
            await context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!await UserActivityExists(userId, activityId))
                return NotFound();
            throw;
        }

        return Ok(userActivity);
    }

    // DELETE: api/UserActivities/5/2
    [Produces("application/json")]
    [HttpDelete("{userId}/{activityId}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Delete a user activity",
        Description = "Deletes a user activity by user ID and activity ID",
        OperationId = "DeleteUserActivity",
        Tags = ["UserActivities"]
    )]
    public async Task<IActionResult> DeleteUserActivity(Guid userId, Guid activityId)
    {
        var userActivity = await context.UserActivities.FindAsync(userId, activityId);
        if (userActivity is null)
            return NotFound();

        context.UserActivities.Remove(userActivity);
        await context.SaveChangesAsync();

        return NoContent();
    }

    private async Task<bool> UserActivityExists(Guid userId, Guid activityId)
        => await context.UserActivities.AnyAsync(e => e.UserId == userId && e.ActivityId == activityId);
}
