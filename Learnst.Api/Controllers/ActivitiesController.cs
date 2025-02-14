using Learnst.Api.Models;
using Learnst.Application.Interfaces;
using Learnst.Domain.Exceptions;
using Learnst.Domain.Models;
using Microsoft.AspNetCore.Mvc;

namespace Learnst.Api.Controllers;

[ApiController]
[Route("[controller]")]
public class ActivitiesController(IAsyncRepository<Activity, Guid> repository) : ControllerBase
{
    // GET: api/Activities
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Activity>>> GetActivities()
        => Ok(await repository.GetAsync(orderBy: a => a.CreatedAt, descending: true));

    // GET: api/Activities/5
    [HttpGet("{id:guid}")]
    [Produces("application/json")]
    public async Task<ActionResult<Activity>> GetActivity(Guid id)
    {
        try
        {
            var activity = await repository.GetByIdAsync(id, includes: [
                    a => a.Author,
                    a => a.Topics,
                    a => a.InfoCards,
                    a => a.UserActivities
                ]) ?? throw new NotFoundException<Activity>(id);
            return Ok(activity);
        }
        catch (NotFoundException<Activity> nfe)
        {
            return NotFound(new ErrorResponse(nfe));
        }
    }

    // POST: api/Activities
    [HttpPost]
    [Produces("application/json")]
    public async Task<ActionResult<Activity>> PostActivity(Activity activity)
    {
        try
        {
            var id = activity.Id;
            if (await repository.ExistsAsync(a => a.Id == id))
                throw new DuplicateException<Activity>(id);
            await repository.AddAsync(activity);
            await repository.SaveAsync();

            return CreatedAtAction(nameof(GetActivity), new { id }, activity);
        }
        catch (DuplicateException<Activity> de)
        {
            return StatusCode(StatusCodes.Status422UnprocessableEntity, new ErrorResponse(de));
        }
        catch (Exception ex)
        {
            return BadRequest(new ErrorResponse(ex));
        }
    }

    // PUT: api/Activities/5
    [HttpPut("{id:guid}")]
    [Produces("application/json")]
    public async Task<IActionResult> PutActivity(Guid id, Activity activity)
    {
        try
        {
            NotEqualsException.ThrowIfNotEquals(id, activity.Id);
            var existingActivity = await repository.GetByIdAsync(id)
                ?? throw new NotFoundException<Activity>(id);
            var result = repository.Update(existingActivity, activity,
                "Title", "Description", "AvatarUrl",
                "Level", "IsClosed", "EndAt", "MinimalScore",
                "Tags", "TargetAudience", "CheckList", "InfoCards", "Topics");
            await repository.SaveAsync();
            return Ok(result);
        }
        catch (NotFoundException<Activity> nfe)
        {
            return NotFound(new { message = nfe.Message, exception = nfe.ToString() });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message, exception = ex.ToString() });
        }
    }

    // DELETE: api/Activities/5
    [HttpDelete("{id:guid}")]
    [Produces("application/json")]
    public async Task<IActionResult> DeleteActivity(Guid id)
    {
        try
        {
            await repository.DeleteAsync(id);
            await repository.SaveAsync();
            return NoContent();
        }
        catch (NotFoundException<Activity, Guid> nfe)
        {
            return NotFound(new ErrorResponse(nfe));
        }
        catch (Exception ex)
        {
            return BadRequest(new ErrorResponse(ex));
        }
    }
}
