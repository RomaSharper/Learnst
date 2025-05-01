using Learnst.Infrastructure;
using Learnst.Infrastructure.Enums;
using Learnst.Infrastructure.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Learnst.Api.Controllers;

[ApiController]
[Route("[controller]")]
public class TicketsController(ApplicationDbContext context) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Ticket>>> GetQuestions()
    {
        return await context.Tickets
            .Include(t => t.Author)
            .Include(t => t.TicketAnswers)
                .ThenInclude(ta => ta.Author!)
            .Include(t => t.StatusHistories)
            .ToListAsync();
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<Ticket>> GetQuestion(Guid id)
    {
        var ticket = await context.Tickets
            .Include(t => t.Author)
            .Include(t => t.TicketAnswers)
                .ThenInclude(ta => ta.Author!)
            .Include(t => t.StatusHistories)
            .FirstOrDefaultAsync(t => t.Id == id);
        if (ticket is null) return NotFound();
        return ticket;
    }

    [HttpPost]
    public async Task<ActionResult<Ticket>> CreateTicket(Ticket ticket)
    {
        ticket.StatusHistories = [new StatusHistory()];
        await context.Tickets.AddAsync(ticket);
        await context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetQuestion), new { id = ticket.Id }, ticket);
    }

    [HttpPost("Answers")]
    public async Task<ActionResult<TicketAnswer>> AddAnswer(TicketAnswer answer)
    {
        await context.TicketAnswers.AddAsync(answer);
        await context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetQuestion), new { id = answer.Id }, answer);
    }

    [HttpPut("{id:guid}/Status")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] TicketStatus newStatus)
    {
        var ticket = await context.Tickets.FindAsync(id);
        if (ticket is null) return NotFound();

        StatusHistory history = new()
        {
            TicketId = id,
            Status = newStatus,
            ChangedAt = DateTime.UtcNow
        };

        ticket.Status = newStatus;
        await context.StatusHistories.AddAsync(history);
        await context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteTicket(Guid id)
    {
        var ticket = await context.Tickets.FindAsync(id);
        if (ticket is null) return NotFound();
        
        context.Tickets.Remove(ticket);
        await context.SaveChangesAsync();
        return NoContent();
    }
}
