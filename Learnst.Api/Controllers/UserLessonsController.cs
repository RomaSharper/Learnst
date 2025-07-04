using System.Linq.Expressions;
using Learnst.Api.Models;
using Learnst.Infrastructure.Exceptions;
using Learnst.Infrastructure.Interfaces;
using Learnst.Infrastructure.Models;
using Microsoft.AspNetCore.Mvc;

namespace Learnst.Api.Controllers;

[ApiController]
[Route("[controller]")]
public class UserLessonsController(IAsyncRepository<UserLesson, (Guid, Guid)> repository) : ControllerBase
{
    private readonly Expression<Func<UserLesson, object?>>[] _includes =
    [
        ul => ul.User,
        ul => ul.Lesson
    ];
    
    // GET: api/UserLessons
    [HttpGet]
    [Produces("application/json")]
    public async Task<ActionResult<IEnumerable<UserLesson>>> GetUserLessons() =>
        Ok(await repository.GetAsync(includes: _includes));

    // GET: api/UserLessons/user/{userId}
    [HttpGet("User/{userId:guid}")]
    [Produces("application/json")]
    public async Task<ActionResult<IEnumerable<UserLesson>>> GetUserLessonsByUserId(Guid userId)
    {
        return Ok(await repository.GetAsync(
            where: ul => ul.UserId == userId,
            includes: _includes
        ));
    }

    // GET: api/UserLessons/1/2
    [Produces("application/json")]
    [HttpGet("{userId:guid}/{lessonId:guid}")]
    public async Task<ActionResult<UserLesson>> GetUserLesson(Guid userId, Guid lessonId)
    {
        try
        {
            return Ok(await repository.GetFirstAsync(
                where: ul => ul.UserId == userId && ul.LessonId == lessonId,
                includes: _includes
            ));
        }
        catch (NotFoundException nfe)
        {
            return NotFound(new ErrorResponse(nfe));
        }
    }

    // POST: api/UserLessons
    [HttpPost]
    [Produces("application/json")]
    public async Task<ActionResult<UserLesson>> PostUserLesson(UserLesson userLesson)
    {
        try
        {
            var id = (userLesson.UserId, userLesson.LessonId);
            if (await repository.ExistsAsync(a => a.UserId == id.UserId && a.LessonId == id.LessonId))
                throw new DuplicateException<UserLesson>(
                    $"{nameof(UserLesson)} с ID {userLesson.StringKey} уже существует."
                );
            
            await repository.AddAsync(userLesson);
            await repository.SaveAsync();
            return CreatedAtAction(nameof(GetUserLesson), new
            {
                userId = userLesson.UserId,
                lessonId = userLesson.LessonId
            }, userLesson);
        }
        catch (DuplicateException<UserLesson> de)
        {
            return StatusCode(StatusCodes.Status422UnprocessableEntity, new ErrorResponse(de));
        }
        catch (Exception ex)
        {
            return BadRequest(new ErrorResponse(ex));
        }
    }

    // DELETE: api/UserLessons/2/3
    [Produces("application/json")]
    [HttpDelete("{userId:guid}/{lessonId:guid}")]
    public async Task<IActionResult> DeleteUserLesson(Guid userId, Guid lessonId)
    {
        try
        {
            await repository.DeleteAsync((userId, lessonId));
            await repository.SaveAsync();
            return NoContent();
        }
        catch (Exception ex)
        {
            return StatusCode(504, ex.Message);
        }
    }
}
