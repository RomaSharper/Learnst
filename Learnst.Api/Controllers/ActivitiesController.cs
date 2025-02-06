using Learnst.Dao;
using Learnst.Dao.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Swashbuckle.AspNetCore.Annotations;

namespace Learnst.Api.Controllers;

[Route("[controller]")]
[ApiController]
public class ActivitiesController(ApplicationDbContext context) : ControllerBase
{
    // GET: api/Activities
    [HttpGet]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<Activity>))]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Get all activities",
        Description = "Returns a list of all activities",
        OperationId = "GetActivities",
        Tags = ["Activities"]
    )]
    public async Task<ActionResult<IEnumerable<Activity>>> GetActivities()
        => await context.Activities
            .AsNoTracking()
            .Include(a => a.Author)
            .Include(a => a.InfoCards)
            .Include(a => a.Topics)
                .ThenInclude(t => t.Lessons)
                    .ThenInclude(l => l.Questions)
                        .ThenInclude(q => q.Answers)
            .Include(a => a.UserActivities)
            .ToListAsync();

    // GET: api/Activities/5
    [HttpGet("{id:guid}")]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(Activity))]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Get an activity by ID",
        Description = "Returns a single activity by its ID",
        OperationId = "GetActivity",
        Tags = ["Activities"]
    )]
    public async Task<ActionResult<Activity>> GetActivity(Guid id)
    {
        var activity = await context.Activities
            .AsNoTracking()
            .Include(a => a.Author)
            .Include(a => a.InfoCards)
            .Include(a => a.Topics)
                .ThenInclude(t => t.Lessons)
                    .ThenInclude(l => l.Questions)
                        .ThenInclude(q => q.Answers)
            .Include(a => a.UserActivities)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (activity is null)
            return NotFound();

        return activity;
    }

    // GET: api/MyActivities/5
    [Produces("application/json")]
    [HttpGet("/api/MyActivities/{userId:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<Activity>))]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Get an activities by user ID",
        Description = "Returns a list of activities by user ID",
        OperationId = "GetActivitiesByUserId",
        Tags = ["Activities"]
    )]
    public async Task<ActionResult<IEnumerable<Activity>>> GetActivitiesByUserId(Guid userId)
    {
        var activities = await context.Activities
            .AsNoTracking()
            .Include(a => a.Author)
            .Include(a => a.InfoCards)
            .Include(a => a.Topics)
                .ThenInclude(t => t.Lessons)
                    .ThenInclude(l => l.Questions)
                        .ThenInclude(q => q.Answers)
            .Include(a => a.UserActivities)
            .Where(a => a.UserActivities.Any(ua => ua.UserId == userId))
            .ToListAsync();

        if (activities.Count == 0)
            return NotFound();

        return activities;
    }

    // GET: api/Activities/SearchByTags?tags=tag1,tag2,tag3
    [HttpGet("SearchByTags")]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<Activity>))]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Search activities by tags",
        Description = "Returns a list of activities that match the specified tags",
        OperationId = "SearchActivitiesByTags",
        Tags = ["Activities"]
    )]
    public async Task<ActionResult<IEnumerable<Activity>>> SearchActivitiesByTags([FromQuery] string tags)
    {
        if (string.IsNullOrEmpty(tags))
            return BadRequest("Необходимо передать тэги.");

        // Разделяем теги по запятой
        var tagList = tags.Split(',').Select(t => t.Trim().ToLower()).ToList();

        // Ищем активности, которые содержат хотя бы один из указанных тегов
        var activities = await context.Activities
            .AsNoTracking()
            .Include(a => a.Author)
            .Include(a => a.InfoCards)
            .Include(a => a.Topics)
                .ThenInclude(t => t.Lessons)
                    .ThenInclude(l => l.Questions)
                        .ThenInclude(q => q.Answers)
            .Include(a => a.UserActivities)
            .Where(a => a.Tags.Any(t => tagList.Contains(t.ToLower())))
            .ToListAsync();

        if (activities.Count == 0)
            return NotFound("Активности с такими тэгами не найдены.");

        return activities;
    }

    // POST: api/Activities
    [HttpPost]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status201Created, Type = typeof(Activity))]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Create a new activity",
        Description = "Creates a new activity",
        OperationId = "PostActivity",
        Tags = ["Activities"]
    )]
    public async Task<ActionResult<Activity>> PostActivity(Activity activity)
    {
        var id = activity.Id;
        if (await ActivityExists(id))
            return BadRequest($"Активность с ID \"{id}\" уже существует.");

        await context.Activities.AddAsync(activity);
        await context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetActivity), new { id }, activity);
    }

    // PUT: api/Activities/5
    [HttpPut("{id}")]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Update an activity",
        Description = "Updates an existing activity",
        OperationId = "PutActivity",
        Tags = ["Activities"]
    )]
    public async Task<IActionResult> PutActivity(Guid id, Activity activity)
    {
        if (id != activity.Id)
            return BadRequest("ID активности не совпадает.");

        // Находим существующую активность в базе данных
        var existingActivity = await context.Activities
            .Include(a => a.InfoCards)
            .Include(a => a.Author)
            .Include(a => a.InfoCards)
            .Include(a => a.Topics)
                .ThenInclude(t => t.Lessons)
                    .ThenInclude(l => l.Questions)
                        .ThenInclude(q => q.Answers)
            .Include(a => a.UserActivities)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (existingActivity is null)
            return NotFound("Активность не найдена.");

        // Обновляем основные свойства активности
        existingActivity.Title = activity.Title;
        existingActivity.Description = activity.Description;
        existingActivity.AvatarUrl = activity.AvatarUrl;
        existingActivity.Level = activity.Level;
        existingActivity.IsClosed = activity.IsClosed;
        existingActivity.EndAt = activity.EndAt;
        existingActivity.MinimalScore = activity.MinimalScore;

        // Обновляем коллекции
        existingActivity.Tags = activity.Tags;
        existingActivity.TargetAudience = activity.TargetAudience;
        existingActivity.CheckList = activity.CheckList;
        existingActivity.InfoCards = activity.InfoCards;
        existingActivity.Topics = activity.Topics;

        try
        {
            await context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException duce)
        {
            if (!await ActivityExists(id))
                return NotFound("Активность не найдена.");

            return BadRequest(duce.Message);
        }

        return Ok(existingActivity);
    }

    // DELETE: api/Activities/5
    [HttpDelete("{id:guid}")]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Delete an activity",
        Description = "Deletes an activity by its ID",
        OperationId = "DeleteActivity",
        Tags = ["Activities"]
    )]
    public async Task<IActionResult> DeleteActivity(Guid id)
    {
        var activity = await context.Activities.FindAsync(id);
        if (activity is null)
            return NotFound();

        context.Activities.Remove(activity);
        await context.SaveChangesAsync();

        return NoContent();
    }

    private async Task<bool> ActivityExists(Guid id) => await context.Activities.AnyAsync(e => e.Id == id);
}
