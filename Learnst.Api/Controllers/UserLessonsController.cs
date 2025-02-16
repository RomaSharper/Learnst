using Learnst.Domain;
using Learnst.Infrastructure;
using Learnst.Infrastructure.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Swashbuckle.AspNetCore.Annotations;

namespace Learnst.Api.Controllers;

[Route("[controller]")]
[ApiController]
public class UserLessonsController(ApplicationDbContext context) : ControllerBase
{
    // GET: api/UserLessons
    [HttpGet]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<UserLesson>))]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Get all user lessons",
        Description = "Returns a list of all user lessons",
        OperationId = "GetUserLessons",
        Tags = ["UserLessons"]
    )]
    public async Task<ActionResult<IEnumerable<UserLesson>>> GetUserLessons()
    {
        return await context.UserLessons
            .AsNoTracking()
            .Include(ul => ul.User)
            .Include(ul => ul.Lesson)
            .ToListAsync();
    }

    // GET: api/UserLessons/user/{userId}
    [HttpGet("User/{userId:guid}")]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<UserLesson>))]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Get all user lessons",
        Description = "Returns a list of all user lessons",
        OperationId = "GetUserLessons",
        Tags = ["UserLessons"]
    )]
    public async Task<ActionResult<IEnumerable<UserLesson>>> GetUserLessonsByUserId(Guid userId)
    {
        return await context.UserLessons
            .AsNoTracking()
            .Include(ul => ul.User)
            .Include(ul => ul.Lesson)
            .Where(ul => ul.UserId == userId)
            .ToListAsync();
    }

    // GET: api/UserLessons/5
    [Produces("application/json")]
    [HttpGet("{userId:guid}/{lessonId:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(UserLesson))]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Get a user lesson by user ID and lesson ID",
        Description = "Returns a single user lesson by user ID and lesson ID",
        OperationId = "GetUserLesson",
        Tags = ["UserLessons"]
    )]
    public async Task<ActionResult<UserLesson>> GetUserLesson(Guid userId, Guid lessonId)
    {
        var userLesson = await context.UserLessons
            .AsNoTracking()
            .Include(ul => ul.User)
            .Include(ul => ul.Lesson)
            .FirstOrDefaultAsync(ul => ul.UserId == userId && ul.LessonId == lessonId);

        if (userLesson is null)
            return NotFound();

        return userLesson;
    }

    // POST: api/UserLessons
    [HttpPost]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status201Created, Type = typeof(UserLesson))]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Create a new user lesson",
        Description = "Creates a new user lesson",
        OperationId = "PostUserLesson",
        Tags = ["UserLessons"]
    )]
    public async Task<ActionResult<UserLesson>> PostUserLesson(UserLesson userLesson)
    {
        await context.UserLessons.AddAsync(userLesson);
        await context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetUserLesson), new { userId = userLesson.UserId, lessonId = userLesson.LessonId }, userLesson);
    }

    // PUT: api/UserLessons/5
    [Produces("application/json")]
    [HttpPut("{userId:guid}/{lessonId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Update a user lesson",
        Description = "Updates an existing user lesson",
        OperationId = "PutUserLesson",
        Tags = ["UserLessons"]
    )]
    public async Task<IActionResult> PutUserLesson(Guid userId, Guid lessonId, UserLesson userLesson)
    {
        if (userId != userLesson.UserId || lessonId != userLesson.LessonId)
            return BadRequest();

        context.Entry(userLesson).State = EntityState.Modified;

        try
        {
            await context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!await UserLessonExists(userId, lessonId))
                return NotFound();
            throw;
        }

        return Ok(userLesson);
    }

    // DELETE: api/UserLessons/2/3
    [Produces("application/json")]
    [HttpDelete("{userId:guid}/{lessonId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Delete a user lesson",
        Description = "Deletes a user lesson by user ID and lesson ID",
        OperationId = "DeleteUserLesson",
        Tags = ["UserLessons"]
    )]
    public async Task<IActionResult> DeleteUserLesson(Guid userId, Guid lessonId)
    {
        var userLesson = await context.UserLessons.FindAsync(userId, lessonId);
        if (userLesson is null)
            return NotFound();

        context.UserLessons.Remove(userLesson);
        await context.SaveChangesAsync();

        return NoContent();
    }

    private async Task<bool> UserLessonExists(Guid userId, Guid lessonId)
        => await context.UserLessons.AnyAsync(e => e.UserId == userId && e.LessonId == lessonId);
}
