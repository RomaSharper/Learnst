using Learnst.Api.Models;
using Learnst.Infrastructure.Exceptions;
using Learnst.Infrastructure.Models;
using Learnst.Infrastructure.Repositories;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Learnst.Api.Controllers;

[ApiController]
[Route("[controller]")]
public class ActivitiesController(ActivitiesRepository repository) : ControllerBase
{
    // GET: api/Activities
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Activity>>> GetActivities()
        => Ok(await repository.DbSet.OrderByDescending(a => a.CreatedAt)
            .Include(a => a.InfoCards)
            .Include(a => a.Topics)
                .ThenInclude(t => t.Lessons)
                        .ThenInclude(l => l.Questions)
                            .ThenInclude(q => q.Answers)
            .ToListAsync());

    // GET: api/Activities/5
    [HttpGet("{id:guid}")]
    [Produces("application/json")]
    public async Task<ActionResult<Activity>> GetActivity(Guid id)
    {
        try
        {
            return Ok(await repository.DbSet.AsNoTracking()
                .Include(a => a.Author)
                .Include(a => a.InfoCards)
                .Include(a => a.UserActivities)
                .Include(a => a.Topics)
                    .ThenInclude(t => t.Lessons)
                        .ThenInclude(l => l.Questions)
                            .ThenInclude(q => q.Answers)
                .SingleOrDefaultAsync(a => a.Id == id) ?? throw new NotFoundException<Activity>(id));
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

            await repository.AddAsync(repository.CheckActivity(activity));
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
            var existingActivity = await repository.DbSet.Include(a => a.Author)
                .Include(a => a.InfoCards)
                .Include(a => a.UserActivities)
                .Include(a => a.Topics)
                    .ThenInclude(t => t.Lessons)
                        .ThenInclude(l => l.Questions)
                            .ThenInclude(q => q.Answers)
                .SingleOrDefaultAsync(a => a.Id == id) ?? throw new NotFoundException<Activity>(id);
            
            var result = repository.Update(existingActivity, repository.CheckActivity(activity));
            await repository.SaveAsync();
            return Ok(result);
        }
        catch (NotFoundException<Activity> nfe)
        {
            return NotFound(new ErrorResponse(nfe));
        }
        catch (Exception ex)
        {
            return BadRequest(new ErrorResponse(ex));
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
