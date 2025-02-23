using Learnst.Infrastructure;
using Learnst.Infrastructure.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Swashbuckle.AspNetCore.Annotations;

namespace Learnst.Api.Controllers;

[Route("[controller]")]
[ApiController]
public class WorkExperiencesController(ApplicationDbContext context) : ControllerBase
{
    // GET: api/WorkExperiences
    [HttpGet]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<WorkExperience>))]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Get all work experiences",
        Description = "Returns a list of all work experiences",
        OperationId = "GetWorkExperiences",
        Tags = ["WorkExperiences"]
    )]
    public async Task<ActionResult<IEnumerable<WorkExperience>>> GetWorkExperiences()
    {
        return await context.WorkExperiences
            .Include(we => we.User)
            .ToListAsync();
    }

    // GET: api/WorkExperiences/5
    [HttpGet("{id}")]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(WorkExperience))]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Get a work experience by ID",
        Description = "Returns a single work experience by its ID",
        OperationId = "GetWorkExperience",
        Tags = ["WorkExperiences"]
    )]
    public async Task<ActionResult<WorkExperience>> GetWorkExperience(int id)
    {
        var workExperience = await context.WorkExperiences
            .Include(we => we.User)
            .FirstOrDefaultAsync(we => we.Id == id);

        if (workExperience is null)
            return NotFound();

        return workExperience;
    }

    // POST: api/WorkExperiences
    [HttpPost]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status201Created, Type = typeof(WorkExperience))]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Create a new work experience",
        Description = "Creates a new work experience",
        OperationId = "PostWorkExperience",
        Tags = ["WorkExperiences"]
    )]
    public async Task<ActionResult<WorkExperience>> PostWorkExperience(WorkExperience workExperience)
    {
        context.WorkExperiences.Add(workExperience);
        await context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetWorkExperience), new { id = workExperience.Id }, workExperience);
    }

    // PUT: api/WorkExperiences/5
    [HttpPut("{id}")]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Update a work experience",
        Description = "Updates an existing work experience",
        OperationId = "PutWorkExperience",
        Tags = ["WorkExperiences"]
    )]
    public async Task<IActionResult> PutWorkExperience(int id, WorkExperience workExperience)
    {
        if (id != workExperience.Id)
            return BadRequest();

        context.Entry(workExperience).State = EntityState.Modified;

        try
        {
            await context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!await WorkExperienceExists(id))
                return NotFound();
            throw;
        }

        return Ok(workExperience);
    }

    // DELETE: api/WorkExperiences/5
    [HttpDelete("{id}")]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Delete a work experience",
        Description = "Deletes a work experience by its ID",
        OperationId = "DeleteWorkExperience",
        Tags = ["WorkExperiences"]
    )]
    public async Task<IActionResult> DeleteWorkExperience(int id)
    {
        var workExperience = await context.WorkExperiences.FindAsync(id);
        if (workExperience is null)
            return NotFound();

        context.WorkExperiences.Remove(workExperience);
        await context.SaveChangesAsync();

        return NoContent();
    }

    private async Task<bool> WorkExperienceExists(int id)
        => await context.WorkExperiences.AnyAsync(e => e.Id == id);
}
