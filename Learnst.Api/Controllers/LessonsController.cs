using Learnst.Infrastructure;
using Learnst.Infrastructure.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Swashbuckle.AspNetCore.Annotations;

namespace Learnst.Api.Controllers;

[ApiController]
[Route("[controller]")]
public class LessonsController(ApplicationDbContext context) : ControllerBase
{
    // GET: api/Topics/5/Lessons
    [Produces("application/json")]
    [HttpGet("/api/Topics/{topicId:guid}/[controller]")]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<Lesson>))]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Get lessons by Topic ID",
        Description = "Returns a list of all lessons from topic",
        OperationId = "GetLessonsByTopicId",
        Tags = ["Lessons"]
    )]
    public async Task<ActionResult<IEnumerable<Lesson>>> GetLessonsByTopicId(Guid topicId)
    {
        return await context.Lessons
            .Where(l => l.TopicId == topicId)
            .Include(l => l.Topic!)
                .ThenInclude(t => t.Activity)
            .Include(l => l.Questions)
                .ThenInclude(q => q.Answers)
            .Include(l => l.UserLessons)
            .ToListAsync();
    }

    // GET: api/Lessons/5
    [HttpGet("{id}")]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(Lesson))]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Get a lesson by ID",
        Description = "Returns a single lesson by its ID",
        OperationId = "GetLesson",
        Tags = ["Lessons"]
    )]
    public async Task<ActionResult<Lesson>> GetLesson(Guid id)
    {
        var lesson = await context.Lessons
            .Include(l => l.Topic!)
                .ThenInclude(t => t.Activity)
            .Include(l => l.Questions)
                .ThenInclude(q => q.Answers)
            .Include(l => l.UserLessons)
            .FirstOrDefaultAsync(l => l.Id == id);

        if (lesson is null)
            return NotFound();

        return lesson;
    }

    // POST: api/Lessons
    [HttpPost]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status201Created, Type = typeof(Lesson))]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Create a new lesson",
        Description = "Creates a new lesson",
        OperationId = "PostLesson",
        Tags = ["Lessons"]
    )]
    public async Task<ActionResult<Lesson>> PostLesson(Lesson lesson)
    {
        var id = lesson.Id;
        if (await LessonExists(id))
            return BadRequest($"Занятие с ID \"{id}\" уже существует.");

        await context.Lessons.AddAsync(lesson);
        await context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetLesson), new { id }, lesson);
    }

    // PUT: api/Lessons/5
    [HttpPut("{id}")]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Update a lesson",
        Description = "Updates an existing lesson",
        OperationId = "PutLesson",
        Tags = ["Lessons"]
    )]
    public async Task<IActionResult> PutLesson(Guid id, Lesson lesson)
    {
        if (id != lesson.Id)
            return BadRequest();

        context.Entry(lesson).State = EntityState.Modified;

        try
        {
            await context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!await LessonExists(id))
                return NotFound();
            throw;
        }

        return Ok(lesson);
    }

    // DELETE: api/Lessons/5
    [HttpDelete("{id}")]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Delete a lesson",
        Description = "Deletes a lesson by its ID",
        OperationId = "DeleteLesson",
        Tags = ["Lessons"]
    )]
    public async Task<IActionResult> DeleteLesson(Guid id)
    {
        var lesson = await context.Lessons.FindAsync(id);
        if (lesson is null)
            return NotFound();

        context.Lessons.Remove(lesson);
        await context.SaveChangesAsync();

        return NoContent();
    }

    private async Task<bool> LessonExists(Guid id) => await context.Lessons.AnyAsync(e => e.Id == id);
}
