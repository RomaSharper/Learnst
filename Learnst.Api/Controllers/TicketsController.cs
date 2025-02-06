using Learnst.Dao;
using Learnst.Dao.Enums;
using Learnst.Dao.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Swashbuckle.AspNetCore.Annotations;

namespace Learnst.Api.Controllers;

[ApiController]
[Route("[controller]")]
[SwaggerTag("Управление тикетами (вопросами) и их статусами")]
public class TicketsController(ApplicationDbContext context) : ControllerBase
{
    [HttpGet]
    [SwaggerOperation(
        Summary = "Получить все тикеты",
        Description = "Возвращает список всех тикетов с информацией об авторе, ответах и истории статусов.",
        OperationId = "GetAllTickets"
    )]
    [SwaggerResponse(200, "Список тикетов успешно получен", typeof(IEnumerable<Ticket>))]
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
    [SwaggerOperation(
        Summary = "Получить тикет по ID",
        Description = "Возвращает информацию о конкретном тикете по его идентификатору.",
        OperationId = "GetTicketById"
    )]
    [SwaggerResponse(200, "Тикет успешно найден", typeof(Ticket))]
    [SwaggerResponse(404, "Тикет не найден")]
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
    [SwaggerOperation(
        Summary = "Создать новый тикет",
        Description = "Создает новый тикет с начальным статусом 'Open' и записью в истории статусов.",
        OperationId = "CreateTicket"
    )]
    [SwaggerResponse(201, "Тикет успешно создан", typeof(Ticket))]
    [SwaggerResponse(400, "Некорректные данные тикета")]
    public async Task<ActionResult<Ticket>> CreateTicket(Ticket ticket)
    {
        ticket.StatusHistories = [new StatusHistory()];
        await context.Tickets.AddAsync(ticket);
        await context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetQuestion), new { id = ticket.Id }, ticket);
    }

    [HttpPost("Answers")]
    [SwaggerOperation(
        Summary = "Добавить ответ к тикету",
        Description = "Добавляет новый ответ к существующему тикету.",
        OperationId = "AddAnswerToTicket"
    )]
    [SwaggerResponse(201, "Ответ успешно добавлен", typeof(TicketAnswer))]
    [SwaggerResponse(404, "Тикет не найден")]
    public async Task<ActionResult<TicketAnswer>> AddAnswer(TicketAnswer answer)
    {
        await context.TicketAnswers.AddAsync(answer);
        await context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetQuestion), new { id = answer.Id }, answer);
    }

    [HttpPut("{id:guid}/Status")]
    [SwaggerOperation(
        Summary = "Обновить статус тикета",
        Description = "Обновляет статус тикета и добавляет запись в историю статусов.",
        OperationId = "UpdateTicketStatus"
    )]
    [SwaggerResponse(204, "Статус тикета успешно обновлен")]
    [SwaggerResponse(404, "Тикет не найден")]
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
    [SwaggerOperation(
        Summary = "Удалить тикет",
        Description = "Удаляет тикет по его идентификатору.",
        OperationId = "DeleteTicket"
    )]
    [SwaggerResponse(204, "Тикет успешно удален")]
    [SwaggerResponse(404, "Тикет не найден")]
    public async Task<IActionResult> DeleteTicket(Guid id)
    {
        var ticket = await context.Tickets.FindAsync(id);
        if (ticket is null) return NotFound();
        
        context.Tickets.Remove(ticket);
        await context.SaveChangesAsync();
        return NoContent();
    }
}
