using Learnst.Infrastructure;
using Learnst.Infrastructure.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Swashbuckle.AspNetCore.Annotations;

namespace Learnst.Api.Controllers;

[Route("[controller]")]
[ApiController]
public class EducationsController(ApplicationDbContext context) : ControllerBase
{
    // GET: api/Educations
    [HttpGet]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<Education>))]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Get all educations",
        Description = "Returns a list of all educations",
        OperationId = "GetEducations",
        Tags = ["Educations"]
    )]
    public async Task<ActionResult<IEnumerable<Education>>> GetEducations()
    {
        return await context.Educations
            .Include(e => e.User)
            .ToListAsync();
    }

    // GET: api/Educations/5
    [HttpGet("{id}")]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(Education))]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Get an education by ID",
        Description = "Returns a single education by its ID",
        OperationId = "GetEducation",
        Tags = ["Educations"]
    )]
    public async Task<ActionResult<Education>> GetEducation(int id)
    {
        var education = await context.Educations
            .Include(e => e.User)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (education is null)
            return NotFound();

        return education;
    }

    // POST: api/Educations
    [HttpPost]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status201Created, Type = typeof(Education))]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Create a new education",
        Description = "Creates a new education",
        OperationId = "PostEducation",
        Tags = ["Educations"]
    )]
    public async Task<ActionResult<Education>> PostEducation(Education education)
    {
        var id = education.Id;
        if (await EducationExists(id))
            return BadRequest($"Образование с ID \"{id}\" уже существует.");

        context.Educations.Add(education);
        await context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetEducation), new { id }, education);
    }

    // PUT: api/Educations/5
    [HttpPut("{id}")]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Update an education",
        Description = "Updates an existing education",
        OperationId = "PutEducation",
        Tags = ["Educations"]
    )]
    public async Task<IActionResult> PutEducation(int id, Education education)
    {
        if (id != education.Id)
            return BadRequest();

        context.Entry(education).State = EntityState.Modified;

        try
        {
            await context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!await EducationExists(id))
                return NotFound();
            throw;
        }

        return Ok(education);
    }

    // DELETE: api/Educations/5
    [HttpDelete("{id}")]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Delete an education",
        Description = "Deletes an education by its ID",
        OperationId = "DeleteEducation",
        Tags = ["Educations"]
    )]
    public async Task<IActionResult> DeleteEducation(int id)
    {
        var education = await context.Educations.FindAsync(id);
        if (education is null)
            return NotFound();

        context.Educations.Remove(education);
        await context.SaveChangesAsync();

        return NoContent();
    }

    private async Task<bool> EducationExists(int id) => await context.Educations.AnyAsync(e => e.Id == id);
}
