using Learnst.Api.Models;
using Learnst.Infrastructure.Exceptions;
using Learnst.Infrastructure.Interfaces;
using Learnst.Infrastructure.Models;
using Microsoft.AspNetCore.Mvc;

namespace Learnst.Api.Controllers;

[ApiController]
[Route("[controller]")]
public class AnswersController(IAsyncRepository<Answer, int> repository) : ControllerBase
{
    // GET: api/Answers/5
    [HttpGet("{id:int}")]
    [Produces("application/json")]
    public async Task<ActionResult<Answer>> GetAnswer(int id)
    {
        try
        {
            var answer = await repository.GetByIdAsync(id, includes: a => a.Question) 
                ?? throw new NotFoundException<Answer, int>(id);
            return Ok(answer);
        }
        catch (NotFoundException<Answer, int> nfe)
        {
            return NotFound(new ErrorResponse(nfe));
        }
    }

    // POST: api/Answers
    [HttpPost]
    [Produces("application/json")]
    public async Task<ActionResult<Answer>> PostAnswer(Answer answer)
    {
        try
        {
            var id = answer.Id;
            if (await repository.ExistsAsync(a => a.Id == id))
                throw new DuplicateException<Answer>(id);
            await repository.AddAsync(answer);
            await repository.SaveAsync();
            return CreatedAtAction(nameof(GetAnswer), new IdResponse<int>(id), answer);
        }
        catch (Exception ex)
        {
            return BadRequest(new ErrorResponse(ex));
        }
    }

    // PUT: api/Answers/5
    [HttpPut("{id:int}")]
    [Produces("application/json")]
    public async Task<IActionResult> PutAnswer(int id, Answer answer)
    {
        try
        {
            NotEqualsException.ThrowIfNotEquals(id, answer.Id);
            var existingAnswer = await repository.GetByIdAsync(id)
                ?? throw new NotFoundException<Answer, int>(id);
            var result = repository.Update(existingAnswer, answer);
            await repository.SaveAsync();
            return Ok(result);
        }
        catch (NotFoundException<Answer, int> nfe)
        {
            return NotFound(new ErrorResponse(nfe));
        }
        catch (Exception ex)
        {
            return BadRequest(new ErrorResponse(ex));
        }
    }

    // DELETE: api/Answers/5
    [HttpDelete("{id:int}")]
    [Produces("application/json")]
    public async Task<IActionResult> DeleteAnswer(int id)
    {
        try
        {
            await repository.DeleteAsync(id);
            await repository.SaveAsync();
            return NoContent();
        }
        catch (NotFoundException<Answer, int> nfe)
        {
            return NotFound(new ErrorResponse(nfe));
        }
    }
}
