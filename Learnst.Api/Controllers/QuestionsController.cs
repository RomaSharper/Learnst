using Learnst.Dao.Models;
using Learnst.Dao;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Swashbuckle.AspNetCore.Annotations;

namespace Learnst.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class QuestionsController(ApplicationDbContext context) : ControllerBase
{
    // GET: api/Lessons/5/Questions
    [Produces("application/json")]
    [HttpGet("/api/Lessons/{lessonId:guid}/[controller]")]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<Question>))]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Get all questions",
        Description = "Returns a list of all questions",
        OperationId = "GetQuestions",
        Tags = ["Questions"]
    )]
    public async Task<ActionResult<IEnumerable<Question>>> GetQuestionsByLessonId(Guid lessonId)
    {
        return await context.Questions
            .Where(q => q.LessonId == lessonId)
            .Include(q => q.Lesson)
            .Include(q => q.Answers)
            .Include(q => q.UserAnswers)
            .ToListAsync();
    }

    // GET: api/Questions/5
    [HttpGet("{id}")]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(Question))]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Get a question by ID",
        Description = "Returns a single question by its ID",
        OperationId = "GetQuestion",
        Tags = ["Questions"]
    )]
    public async Task<ActionResult<Question>> GetQuestion(Guid id)
    {
        var question = await context.Questions
            .Include(q => q.Lesson)
            .Include(q => q.Answers)
            .Include(q => q.UserAnswers)
            .FirstOrDefaultAsync(q => q.Id == id);

        if (question is null)
            return NotFound();

        return question;
    }

    // GET: api/Questions/{activityId}/Count
    [HttpGet("{activityId}/Count")]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(int))]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Get total questions count by activity",
        Description = "Returns the total number of questions for a specific activity",
        OperationId = "GetTotalQuestionsCountByActivity",
        Tags = ["Questions"]
    )]
    public async Task<ActionResult<int>> GetTotalQuestionsCountByActivity(Guid activityId)
    {
        var count = await context.Questions
            .Include(q => q.Lesson!)
                .ThenInclude(l => l.Topic!)
            .Where(q => q.Lesson!.Topic!.ActivityId == activityId)
            .CountAsync();

        return count;
    }

    // POST: api/Questions
    [HttpPost]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status201Created, Type = typeof(Question))]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Create a new question",
        Description = "Creates a new question",
        OperationId = "PostQuestion",
        Tags = ["Questions"]
    )]
    public async Task<ActionResult<Question>> PostQuestion(Question question)
    {
        var id = question.Id;
        if (await QuestionExists(id))
            return BadRequest($"Вопрос с ID \"{id}\" уже существует.");

        if (question.Answers.Count is < 2 or > 8)
            return BadRequest($"Вопрос без письменного ответа должен содержать от 2 до 8 ответов.");

        context.Questions.Add(question);
        await context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetQuestion), new { id = question.Id }, question);
    }

    // PUT: api/Questions/5
    [HttpPut("{id}")]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Update a question",
        Description = "Updates an existing question",
        OperationId = "PutQuestion",
        Tags = ["Questions"]
    )]
    public async Task<IActionResult> PutQuestion(Guid id, Question question)
    {
        if (id != question.Id)
            return BadRequest();

        context.Entry(question).State = EntityState.Modified;

        try
        {
            await context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!await QuestionExists(id))
                return NotFound();
            throw;
        }

        return Ok(question);
    }

    // DELETE: api/Questions/5
    [HttpDelete("{id}")]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Delete a question",
        Description = "Deletes a question by its ID",
        OperationId = "DeleteQuestion",
        Tags = ["Questions"]
    )]
    public async Task<IActionResult> DeleteQuestion(Guid id)
    {
        var question = await context.Questions.FindAsync(id);
        if (question is null)
            return NotFound();

        context.Questions.Remove(question);
        await context.SaveChangesAsync();

        return NoContent();
    }

    private async Task<bool> QuestionExists(Guid id) => await context.Questions.AnyAsync(e => e.Id == id);
}
