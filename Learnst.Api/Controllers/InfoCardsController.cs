using Learnst.Infrastructure;
using Learnst.Infrastructure.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Swashbuckle.AspNetCore.Annotations;

namespace Learnst.Api.Controllers;

[Route("[controller]")]
[ApiController]
public class InfoCardsController(ApplicationDbContext context) : ControllerBase
{
    // GET: api/InfoCards
    [HttpGet]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<InfoCard>))]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Get all info cards",
        Description = "Returns a list of all info cards",
        OperationId = "GetInfoCards",
        Tags = ["InfoCards"]
    )]
    public async Task<ActionResult<IEnumerable<InfoCard>>> GetInfoCards()
    {
        return await context.InfoCards
            .Include(i => i.Activity)
            .ToListAsync();
    }

    // GET: api/InfoCards/5
    [HttpGet("{id}")]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(InfoCard))]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Get an info card by ID",
        Description = "Returns a single info card by its ID",
        OperationId = "GetInfoCard",
        Tags = ["InfoCards"]
    )]
    public async Task<ActionResult<InfoCard>> GetInfoCard(int id)
    {
        var infoCard = await context.InfoCards
            .Include(i => i.Activity)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (infoCard is null)
            return NotFound();

        return infoCard;
    }

    // POST: api/InfoCards
    [HttpPost]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status201Created, Type = typeof(InfoCard))]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Create a new info card",
        Description = "Creates a new info card",
        OperationId = "PostInfoCard",
        Tags = ["InfoCards"]
    )]
    public async Task<ActionResult<InfoCard>> PostInfoCard(InfoCard infoCard)
    {
        var id = infoCard.Id;
        if (await InfoCardExists(id))
            return BadRequest($"Карточка с ID \"{id}\" уже существует.");

        context.InfoCards.Add(infoCard);
        await context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetInfoCard), new { id = infoCard.Id }, infoCard);
    }

    // PUT: api/InfoCards/5
    [HttpPut("{id}")]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Update an info card",
        Description = "Updates an existing info card",
        OperationId = "PutInfoCard",
        Tags = ["InfoCards"]
    )]
    public async Task<IActionResult> PutInfoCard(int id, InfoCard infoCard)
    {
        if (id != infoCard.Id)
            return BadRequest();

        context.Entry(infoCard).State = EntityState.Modified;

        try
        {
            await context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!await InfoCardExists(id))
                return NotFound();
            throw;
        }

        return Ok(infoCard);
    }

    // DELETE: api/InfoCards/5
    [HttpDelete("{id}")]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Delete an info card",
        Description = "Deletes an info card by its ID",
        OperationId = "DeleteInfoCard",
        Tags = ["InfoCards"]
    )]
    public async Task<IActionResult> DeleteInfoCard(int id)
    {
        var infoCard = await context.InfoCards.FindAsync(id);
        if (infoCard is null)
            return NotFound();

        context.InfoCards.Remove(infoCard);
        await context.SaveChangesAsync();

        return NoContent();
    }

    private async Task<bool> InfoCardExists(int id) => await context.InfoCards.AnyAsync(e => e.Id == id);
}
