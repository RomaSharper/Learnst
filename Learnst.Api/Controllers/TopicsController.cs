using Learnst.Domain;
using Learnst.Infrastructure;
using Learnst.Infrastructure.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Swashbuckle.AspNetCore.Annotations;

namespace Learnst.Api.Controllers;

[Route("[controller]")]
[ApiController]
public class TopicsController(ApplicationDbContext context) : ControllerBase
{
    // GET: api/Activities/5/Topics
    [Produces("application/json")]
    [HttpGet("/api/Activities/{activityId:guid}/[controller]")]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<Topic>))]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Get topics by Activity ID",
        Description = "Returns a list of all topics from activity",
        OperationId = "GetTopicsByActivityId",
        Tags = ["Topics"]
    )]
    public async Task<ActionResult<IEnumerable<Topic>>> GetTopicsByActivityId(Guid activityId)
    {
        return await context.Topics
            .Where(t => t.ActivityId == activityId)
            .Include(t => t.Activity)
            .Include(t => t.Lessons)
            .ToListAsync();
    }

    // GET: api/Topics/5
    [HttpGet("{id}")]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(Topic))]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Get a topic by ID",
        Description = "Returns a single topic by its ID",
        OperationId = "GetTopic",
        Tags = ["Topics"]
    )]
    public async Task<ActionResult<Topic>> GetTopic(Guid id)
    {
        var topic = await context.Topics
            .Include(t => t.Activity)
            .Include(t => t.Lessons)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (topic is null)
            return NotFound();

        return topic;
    }

    // POST: api/Topics
    [HttpPost]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status201Created, Type = typeof(Topic))]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Create a new topic",
        Description = "Creates a new topic",
        OperationId = "PostTopic",
        Tags = ["Topics"]
    )]
    public async Task<ActionResult<Topic>> PostTopic(Topic topic)
    {
        var id = topic.Id;
        if (await TopicExists(id))
            return BadRequest($"Тема с ID \"{id}\" уже существует.");

        context.Topics.Add(topic);
        await context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetTopic), new { id = topic.Id }, topic);
    }

    // PUT: api/Topics/5
    [HttpPut("{id}")]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Update a topic",
        Description = "Updates an existing topic",
        OperationId = "PutTopic",
        Tags = ["Topics"]
    )]
    public async Task<IActionResult> PutTopic(Guid id, Topic topic)
    {
        if (id != topic.Id)
            return BadRequest();

        context.Entry(topic).State = EntityState.Modified;

        try
        {
            await context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!await TopicExists(id))
                return NotFound();
            throw;
        }

        return Ok(topic);
    }

    // DELETE: api/Topics/5
    [HttpDelete("{id}")]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Delete a topic",
        Description = "Deletes a topic by its ID",
        OperationId = "DeleteTopic",
        Tags = ["Topics"]
    )]
    public async Task<IActionResult> DeleteTopic(Guid id)
    {
        var topic = await context.Topics.FindAsync(id);
        if (topic is null)
            return NotFound();

        context.Topics.Remove(topic);
        await context.SaveChangesAsync();

        return NoContent();
    }

    private async Task<bool> TopicExists(Guid id) => await context.Topics.AnyAsync(e => e.Id == id);
}
