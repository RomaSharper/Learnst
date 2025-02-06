using Learnst.Dao.Models;
using Learnst.Dao;
using Learnst.Dao.Enums;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Swashbuckle.AspNetCore.Annotations;

namespace Learnst.Api.Controllers;

[ApiController]
[Route("[controller]")]
public class UserAnswersController(ApplicationDbContext context) : ControllerBase
{
    // GET: api/UserAnswers
    [HttpGet]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<UserAnswer>))]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Get all user answers",
        Description = "Returns a list of all user answers",
        OperationId = "GetUserAnswers",
        Tags = ["UserAnswers"]
    )]
    public async Task<ActionResult<IEnumerable<UserAnswer>>> GetUserAnswers()
    {
        return await context.UserAnswers
            .Include(ua => ua.User)
            .Include(ua => ua.Answer!)
                .ThenInclude(a => a.Question)
            .ToListAsync();
    }

    // GET: api/UserAnswers/5/2
    [Produces("application/json")]
    [HttpGet("{userId:guid}/{answerId:int}")]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(UserAnswer))]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Get a user answer by user ID and answer ID",
        Description = "Returns a single user answer by user ID and answer ID",
        OperationId = "GetUserAnswer",
        Tags = ["UserAnswers"]
    )]
    public async Task<ActionResult<UserAnswer>> GetUserAnswer(Guid userId, int answerId)
    {
        var userAnswer = await context.UserAnswers
            .Include(ua => ua.User)
            .Include(ua => ua.Answer!)
                .ThenInclude(a => a.Question)
            .FirstOrDefaultAsync(ua => ua.AnswerId == answerId && ua.UserId == userId);

        if (userAnswer is null)
            return NotFound();

        return Ok(userAnswer);
    }

    // POST: api/UserAnswers
    [HttpPost]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status201Created, Type = typeof(UserAnswer))]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Create a new user answer",
        Description = "Creates a new user answer",
        OperationId = "PostUserAnswer",
        Tags = ["UserAnswers"]
    )]
    public async Task<ActionResult<UserAnswer>> PostUserAnswer(UserAnswer userAnswer)
    {
        var (answerId, userId) = (userAnswer.AnswerId, userAnswer.UserId);
        if (await UserAnswerExists(answerId, userId))
            return BadRequest($"Пользователь \"{userId}\" уже имеет ответ \"{answerId}\".");

        context.UserAnswers.Add(userAnswer);
        await context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetUserAnswer), new { answerId, userId }, userAnswer);
    }

    // PUT: api/UserAnswers/5/2
    [Produces("application/json")]
    [HttpPut("{userId:guid}/{answerId:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Update a user answer",
        Description = "Updates an existing user answer",
        OperationId = "PutUserAnswer",
        Tags = ["UserAnswers"]
    )]
    public async Task<IActionResult> PutUserAnswer(int answerId, Guid userId, UserAnswer userAnswer)
    {
        if (answerId != userAnswer.AnswerId || userId != userAnswer.UserId)
            return BadRequest();

        context.Entry(userAnswer).State = EntityState.Modified;

        try
        {
            await context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!await UserAnswerExists(answerId, userId))
                return NotFound();
            throw;
        }

        return Ok(userAnswer);
    }

    // DELETE: api/UserAnswers/5/2
    [Produces("application/json")]
    [HttpDelete("{userId:guid}/{answerId:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Delete a user answer",
        Description = "Deletes a user answer by user ID and answer ID",
        OperationId = "DeleteUserAnswer",
        Tags = ["UserAnswers"]
    )]
    public async Task<IActionResult> DeleteUserAnswer(int answerId, Guid userId)
    {
        var userAnswer = await context.UserAnswers.FindAsync(answerId, userId);
        if (userAnswer is null)
            return NotFound();

        context.UserAnswers.Remove(userAnswer);
        await context.SaveChangesAsync();

        return NoContent();
    }

    // GET: api/UserAnswers/activity/{lessonId}/user/{userId}
    [Produces("application/json")]
    [HttpGet("activity/{lessonId:guid}/user/{userId:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<UserAnswer>))]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Get user answers by lesson and user",
        Description = "Returns a list of user answers for a specific lesson and user",
        OperationId = "GetUserAnswersByLesson",
        Tags = ["UserAnswers"]
    )]
    public async Task<ActionResult<IEnumerable<UserAnswer>>> GetUserAnswersByLesson(Guid lessonId, Guid userId)
    {
        var userAnswers = await context.UserAnswers
            .Include(ua => ua.User)
            .Include(ua => ua.Answer!)
                .ThenInclude(a => a.Question)
            .Where(ua => ua.UserId == userId && ua.Answer!.Question!.LessonId == lessonId)
            .ToListAsync();

        return Ok(userAnswers);
    }

    // GET: api/UserAnswers/activity/{activityId}/user/{userId}/correct
    [Produces("application/json")]
    [HttpGet("activity/{activityId:guid}/user/{userId:guid}/correct")]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(int))]
    [SwaggerOperation(
        Summary = "Get correct answers count by activity and user",
        Description = "Returns the count of correct answers for a specific activity and user",
        OperationId = "GetCorrectAnswersCountByActivity",
        Tags = ["UserAnswers"]
    )]
    public async Task<ActionResult<int>> GetCorrectAnswersCountByActivity(Guid activityId, Guid userId)
    {
        // Получаем все ответы пользователя для активности
        var userAnswers = await context.UserAnswers
            .Include(ua => ua.Answer!)
            .ThenInclude(a => a.Question!)
            .Where(ua => ua.UserId == userId && ua.Answer!.Question!.Lesson!.Topic!.ActivityId == activityId)
            .ToListAsync();

        // Группируем ответы по вопросам
        var groupedAnswers = userAnswers
            .GroupBy(ua => ua.Answer!.QuestionId)
            .ToList();

        var totalScore = 0;
        var isCorrect = false;
        
        foreach (var group in groupedAnswers)
        {
            var questionId = group.Key;
            var question = await context.Questions
                .Include(q => q.Answers)
                .FirstOrDefaultAsync(q => q.Id == questionId);

            if (question is null) continue;

            // Получаем все правильные ответы для вопроса
            var correctAnswers = question.Answers
                .Where(a => a.IsCorrect)
                .Select(a => a.Id)
                .ToList();

            // Получаем ответы пользователя на этот вопрос
            var userSelectedAnswers = group
                .Select(ua => ua.AnswerId)
                .ToList();

            // Проверяем, правильно ли ответил пользователь

            isCorrect = question.AnswerType switch
            {
                // Для Single: проверяем, что выбран ровно один ответ и он правильный
                AnswerType.Single => userSelectedAnswers.Count == 1 && correctAnswers.Contains(userSelectedAnswers[0]),
                // Для Multiple: проверяем, что выбранные ответы точно совпадают с правильными
                AnswerType.Multiple => userSelectedAnswers.OrderBy(x => x)
                    .SequenceEqual(correctAnswers.OrderBy(x => x)),
                _ => isCorrect
            };

            if (isCorrect)
                totalScore++;
        }

        return totalScore;
    }

    // GET: api/Questions/activity/{activityId}/count
    [Produces("application/json")]
    [HttpGet("activity/{activityId:guid}/count")]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(int))]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Get total questions count by activity",
        Description = "Returns the total number of questions for a specific activity",
        OperationId = "GetTotalQuestionsCountByActivity",
        Tags = ["Questions"]
    )]
    public async Task<ActionResult<int>> GetTotalQuestionsCountByActivity(Guid activityId) => await context.Questions
        .CountAsync(q => q.Lesson!.Topic!.ActivityId == activityId);

    // POST: api/UserAnswers/batch
    [HttpPost("batch")]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status201Created, Type = typeof(IEnumerable<UserAnswer>))]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Create multiple user answers",
        Description = "Creates multiple user answers in a batch",
        OperationId = "PostUserAnswersBatch",
        Tags = ["UserAnswers"]
    )]
    public async Task<ActionResult<IEnumerable<UserAnswer>>> PostUserAnswersBatch(IEnumerable<UserAnswer> userAnswers)
    {
        List<UserAnswer> validUserAnswers = [];
        foreach (var userAnswer in userAnswers)
            if (!await UserAnswerExists(userAnswer.AnswerId, userAnswer.UserId))
                validUserAnswers.Add(userAnswer);

        if (validUserAnswers.Count == 0)
            return BadRequest("Все ответы уже существуют.");

        await context.UserAnswers.AddRangeAsync(validUserAnswers);
        await context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetUserAnswers), validUserAnswers);
    }

    private async Task<bool> UserAnswerExists(int answerId, Guid userId) => await context.UserAnswers.AnyAsync(
        e => e.AnswerId == answerId && e.UserId == userId);
}