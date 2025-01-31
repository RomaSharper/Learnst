using Learnst.Dao.Models;
using Learnst.Dao;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Swashbuckle.AspNetCore.Annotations;

namespace Learnst.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AnswersController(ApplicationDbContext context) : ControllerBase
{
    // GET: api/Questions/5/Answers
    [Produces("application/json")]
    [HttpGet("/api/Questions/{questionId:guid}/[controller]")]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<Answer>))]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Get all answers for Question by Question ID",
        Description = "Returns a list of all answers",
        OperationId = "GetAnswersByQuestionId",
        Tags = ["Answers"]
    )]
    public async Task<ActionResult<IEnumerable<Answer>>> GetAnswersByQuestionId(Guid questionId)
    {
        return await context.Answers
            .Where(a => a.QuestionId == questionId)
            .Include(a => a.Question)
            .ToListAsync();
    }

    // GET: api/Answers/5
    [HttpGet("{id}")]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(Answer))]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Get an answer by ID",
        Description = "Returns a single answer by its ID",
        OperationId = "GetAnswer",
        Tags = ["Answers"]
    )]
    public async Task<ActionResult<Answer>> GetAnswer(int id)
    {
        var answer = await context.Answers
            .Include(a => a.Question)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (answer is null)
            return NotFound();

        return answer;
    }

    // POST: api/Answers
    [HttpPost]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status201Created, Type = typeof(Answer))]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Create a new answer",
        Description = "Creates a new answer",
        OperationId = "PostAnswer",
        Tags = ["Answers"]
    )]
    public async Task<ActionResult<Answer>> PostAnswer(Answer answer)
    {
        var id = answer.Id;
        if (await AnswerExists(id))
            return BadRequest($"Ответ с ID \"{id}\" уже существует.");

        context.Answers.Add(answer);
        await context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetAnswer), new { id = answer.Id }, answer);
    }

    // PUT: api/Answers/5
    [HttpPut("{id}")]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Update an answer",
        Description = "Updates an existing answer",
        OperationId = "PutAnswer",
        Tags = ["Answers"]
    )]
    public async Task<IActionResult> PutAnswer(int id, Answer answer)
    {
        if (id != answer.Id)
            return BadRequest();

        context.Entry(answer).State = EntityState.Modified;

        try
        {
            await context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!await AnswerExists(id))
                return NotFound();
            throw;
        }

        return Ok(answer);
    }

    // DELETE: api/Answers/5
    [HttpDelete("{id}")]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Delete an answer",
        Description = "Deletes an answer by its ID",
        OperationId = "DeleteAnswer",
        Tags = ["Answers"]
    )]
    public async Task<IActionResult> DeleteAnswer(int id)
    {
        var answer = await context.Answers.FindAsync(id);
        if (answer is null)
            return NotFound();

        context.Answers.Remove(answer);
        await context.SaveChangesAsync();

        return NoContent();
    }

    private async Task<bool> AnswerExists(int id) => await context.Answers.AnyAsync(e => e.Id == id);
}
