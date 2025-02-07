#pragma warning disable CS8981
using bcrypt = BCrypt.Net.BCrypt;
#pragma warning restore CS8981
using Learnst.Api.Models;
using Learnst.Dao.Models;
using Learnst.Dao;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Swashbuckle.AspNetCore.Annotations;
using Learnst.Dao.Enums;

namespace Learnst.Api.Controllers;

[Route("[controller]")]
[ApiController]
public class UsersController(
    ApplicationDbContext context,
    IValidationService validationService
) : ControllerBase
{
    // GET: api/Users
    [HttpGet]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(IEnumerable<User>))]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Get all users",
        Description = "Returns a list of all users",
        OperationId = "GetUsers",
        Tags = ["Users"]
    )]
    public async Task<ActionResult<IEnumerable<User>>> GetUsers()
    {
        return await context.Users
            .AsNoTracking()
            .Include(u => u.Educations)
            .Include(u => u.SocialMediaProfiles)
            .Include(u => u.WorkExperiences)
            .Include(u => u.UserActivities)
            .Include(u => u.UserLessons)
            .Include(u => u.UserAnswers)
            .Include(u => u.Tickets)
            .Include(u => u.TicketAnswers)
            .ToListAsync();
    }

    // GET: api/Users/5
    [HttpGet("{id}")]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(User))]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Get a user by ID",
        Description = "Returns a single user by its ID",
        OperationId = "GetUserById",
        Tags = ["Users"]
    )]
    public async Task<ActionResult<User>> GetUserById(Guid id)
    {
        var user = await context.Users
            .AsNoTracking()
            .Include(u => u.Educations)
            .Include(u => u.SocialMediaProfiles)
            .Include(u => u.WorkExperiences)
            .Include(u => u.UserActivities)
            .Include(u => u.UserLessons)
            .Include(u => u.UserAnswers)
            .Include(u => u.Tickets)
            .Include(u => u.TicketAnswers)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user is null)
            return NotFound();

        return user;
    }

    // GET: api/Users/Email/5
    [HttpGet("Email/{email}")]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(User))]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Get a user by phone",
        Description = "Returns a single user by its phone",
        OperationId = "GetUserByEmail",
        Tags = ["Users"]
    )]
    public async Task<ActionResult<User>> GetUserByEmail(string email)
    {
        var user = await context.Users
            .AsNoTracking()
            .Include(u => u.Educations)
            .Include(u => u.SocialMediaProfiles)
            .Include(u => u.WorkExperiences)
            .Include(u => u.UserActivities)
            .Include(u => u.UserLessons)
            .Include(u => u.UserAnswers)
            .Include(u => u.Tickets)
            .Include(u => u.TicketAnswers)
            .FirstOrDefaultAsync(u => u.EmailAddress == email);

        if (user is null)
            return NotFound();

        return user;
    }

    // GET: api/Users/Username/5
    [HttpGet("Username/{username}")]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(User))]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Get a user by username",
        Description = "Returns a single user by its username",
        OperationId = "GetUserByName",
        Tags = ["Users"]
    )]
    public async Task<ActionResult<User>> GetUserByName(string username)
    {
        var user = await context.Users
            .AsNoTracking()
            .Include(u => u.Educations)
            .Include(u => u.SocialMediaProfiles)
            .Include(u => u.WorkExperiences)
            .Include(u => u.UserActivities)
            .Include(u => u.UserLessons)
            .Include(u => u.UserAnswers)
            .Include(u => u.Tickets)
            .Include(u => u.TicketAnswers)
            .FirstOrDefaultAsync(u => u.Username == username);

        if (user is null)
            return NotFound();

        return user;
    }

    // POST: api/Users/Auth
    [HttpPost("Auth")]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status200OK, Type = typeof(User))]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Authenticate user",
        Description = "Returns a single user by its login and password",
        OperationId = "Authenticate",
        Tags = ["User"]
    )]
    public async Task<ActionResult<User>> Authenticate([FromBody] LoginRequest request)
    {
        var user = await context.Users
            .AsNoTracking()
            .Include(u => u.Educations)
            .Include(u => u.SocialMediaProfiles)
            .Include(u => u.WorkExperiences)
            .Include(u => u.UserActivities)
            .Include(u => u.UserLessons)
            .Include(u => u.UserAnswers)
            .Include(u => u.Tickets)
            .Include(u => u.TicketAnswers)
            .FirstOrDefaultAsync(u => u.Username == request.Login || u.EmailAddress == request.Login);

        if (user is null || !bcrypt.Verify(request.Password, user.PasswordHash))
            return NotFound();

        return user;
    }

    // POST: api/Users
    [HttpPost]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status201Created, Type = typeof(User))]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Create a new user",
        Description = "Creates a new user",
        OperationId = "PostUser",
        Tags = ["Users"]
    )]
    public async Task<ActionResult<User>> PostUser(User user)
    {
        var id = user.Id;
        var userFound = await UserExists(user);
        if (userFound.IsFound)
            return BadRequest(userFound);

        if (user.Role is not Role.User)
            return BadRequest(new UpdateUserResponse { Message = "Запрещено создание пользователя с любой ролью кроме User" });

        // Валидация имени пользователя
        var usernameValidation = await validationService.ValidateUsername(user.Username, user.Id);
        if (!usernameValidation.Succeed)
            return BadRequest(usernameValidation);

        // Валидация пароля
        var passwordValidation = validationService.ValidatePassword(user);
        if (!passwordValidation.Succeed)
            return BadRequest(passwordValidation);

        // Валидация email
        if (!string.IsNullOrEmpty(user.EmailAddress))
        {
            var emailValidation = validationService.ValidateEmail(user.EmailAddress);
            if (!emailValidation.Succeed)
                return BadRequest(emailValidation);
        }
        
        user.PasswordHash = bcrypt.HashPassword(user.PasswordHash);
        await context.Users.AddAsync(user);
        await context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetUserById), new { id }, user);
    }

    // PUT: api/Users/5
    [HttpPut("{id}")]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Update a user",
        Description = "Updates an existing user",
        OperationId = "PutUser",
        Tags = ["Users"]
    )]
    public async Task<ActionResult<UpdatedResponse>> PutUser(Guid id, User user)
    {
        if (id != user.Id)
            return BadRequest();

        var existingUser = await context.Users
            .Include(u => u.UserActivities)
            .Include(u => u.UserLessons)
            .Include(u => u.UserAnswers)
            .Include(u => u.Educations)
            .Include(u => u.WorkExperiences)
            .Include(u => u.SocialMediaProfiles)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (existingUser is null)
            return NotFound();
        
        // Валидация имени пользователя
        var usernameValidation = await validationService.ValidateUsername(user.Username, user.Id);
        if (!usernameValidation.Succeed)
            return BadRequest(usernameValidation);

        // Валидация пароля
        var passwordValidation = validationService.ValidatePassword(user);
        if (!passwordValidation.Succeed)
            return BadRequest(passwordValidation);

        // Валидация email
        var emailValidation = validationService.ValidateEmail(user.EmailAddress ?? string.Empty);
        if (!emailValidation.Succeed)
            return BadRequest(emailValidation);

        // Обновляем основные свойства
        existingUser.AvatarUrl = user.AvatarUrl;
        existingUser.Username = user.Username;
        existingUser.FullName = user.FullName;
        existingUser.AvatarUrl = user.AvatarUrl;
        existingUser.DateOfBirth = user.DateOfBirth;
        existingUser.Username = user.Username;
        existingUser.City = user.City;
        existingUser.ResumeText = user.ResumeText;
        existingUser.AboutMe = user.AboutMe;

        // Обновляем коллекции
        existingUser.Educations = user.Educations;
        existingUser.WorkExperiences = user.WorkExperiences;
        existingUser.SocialMediaProfiles = user.SocialMediaProfiles;
        existingUser.UserActivities = user.UserActivities;
        existingUser.UserLessons = user.UserLessons;
        existingUser.UserAnswers = user.UserAnswers;
        existingUser.Tickets = user.Tickets;
        existingUser.TicketAnswers = user.TicketAnswers;

        try
        {
            await context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException duce)
        {
            var result = await UserExists(user);
            if (!result.IsFound)
                return NotFound(new
                {
                    result.Message,
                    Succeed = false
                });
            
            return BadRequest(new
            {
                duce.Message,
                Succeed = false
            });
        }

        return Ok(new
        {
            Succeed = true,
            Message = "Успех",
            User = existingUser
        });
    }

    // PUT: api/Users/Role
    [HttpPut("Role")]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Update a user role",
        Description = "Updates a role of existing user",
        OperationId = "PutUserRole",
        Tags = ["Users"]
    )]
    public async Task<ActionResult<UpdateUserResponse>> PutUserRole([FromBody] UpdateRoleRequest request)
    {
        if (request.Role is Role.Admin || !await context.Users.AnyAsync(u => u.Id == request.AdminId && u.Role == Role.Admin))
            return BadRequest();

        var existingUser = await context.Users
            .FirstOrDefaultAsync(u => u.Id == request.UserId);

        if (existingUser is null)
            return NotFound();

        existingUser.Role = request.Role;

        try
        {
            await context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException duce)
        {
            return BadRequest(new
            {
                Succeed = false,
                duce.Message
            });
        }

        return Ok(new
        {
            Succeed = true
        });
    }

    // PUT: api/Users/Password
    [HttpPut("Password")]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Update a user password",
        Description = "Updates a password of existing user",
        OperationId = "PutUserPassword",
        Tags = ["Users"]
    )]
    public async Task<ActionResult<UpdateUserResponse>> PutUserPassword([FromBody] UpdatePasswordRequest request)
    {
        var validatePassword = validationService.ValidatePassword(new User { PasswordHash = request.Password });
        if (!validatePassword.Succeed)
            return BadRequest(new
            {
                Succeed = false,
                validatePassword.Message
            });

        var existingUser = await context.Users
            .FirstOrDefaultAsync(u => u.Id == request.UserId);

        if (existingUser is null)
            return NotFound(new
            {
                Succeed = false,
                Message = $"Пользователь с ID \"{request.UserId}\" не найден"
            });

        var hash = bcrypt.HashPassword(request.Password);
        existingUser.PasswordHash = hash;

        try
        {
            await context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException duce)
        {
            return BadRequest(new
            {
                Succeed = false,
                duce.Message
            });
        }

        return Ok(new
        {
            Succeed = true,
            Message = hash
        });
    }

    // DELETE: api/Users/5
    [HttpDelete("{id:guid}")]
    [Produces("application/json")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    [SwaggerOperation(
        Summary = "Delete a user",
        Description = "Deletes a user by its ID",
        OperationId = "DeleteUser",
        Tags = ["Users"]
    )]
    public async Task<IActionResult> DeleteUser(Guid id)
    {
        var user = await context.Users
            .Include(u => u.Tickets)
            .Include(u => u.TicketAnswers)
            .Include(u => u.UserActivities)
            .Include(u => u.UserLessons)
            .Include(u => u.UserAnswers)
            .Include(u => u.Educations)
            .Include(u => u.WorkExperiences)
            .Include(u => u.SocialMediaProfiles)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user is null)
            return NotFound();

        context.UserActivities.RemoveRange(user.UserActivities);
        context.UserAnswers.RemoveRange(user.UserAnswers);
        context.UserLessons.RemoveRange(user.UserLessons);
        context.Tickets.RemoveRange(user.Tickets);
        context.TicketAnswers.RemoveRange(user.TicketAnswers);
        context.Users.Remove(user);
        await context.SaveChangesAsync();

        return NoContent();
    }

    private record FoundResult(string? Message = null)
    {
        public bool IsFound => !string.IsNullOrEmpty(Message);
    }

    private async Task<FoundResult> UserExists(User user)
    {
        if (await context.Users.AnyAsync(u => u.Id == user.Id))
            return new FoundResult($"Пользователь с ID \"{user.Id}\" уже существует.");
        if (await context.Users.AnyAsync(u => u.Username == user.Username))
            return new FoundResult("Пользователь с таким именем уже существует.");
        if (await context.Users.AnyAsync(u => u.EmailAddress == user.EmailAddress))
            return new FoundResult("Пользователь с такой почтой уже существует.");

        return new FoundResult();
    }
}
