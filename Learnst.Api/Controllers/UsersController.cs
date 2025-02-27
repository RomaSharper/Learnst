#pragma warning disable CS8981
using bcrypt = BCrypt.Net.BCrypt;
#pragma warning restore CS8981
using Learnst.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Learnst.Domain.Enums;
using Learnst.Infrastructure.Models;
using Learnst.Infrastructure.Exceptions;
using Learnst.Infrastructure.Repositories;

namespace Learnst.Api.Controllers;

[Route("[controller]")]
[ApiController]
public class UsersController(
    UsersRepository repository,
    IValidationService validationService
) : ControllerBase
{
    // GET: Users
    [HttpGet]
    public async Task<ActionResult<IEnumerable<User>>> GetUsers()
        => Ok(await repository.GetAsync(includes: [
            u => u.Educations,
            u => u.SocialMediaProfiles,
            u => u.WorkExperiences,
            u => u.UserActivities,
            u => u.UserLessons,
            u => u.UserAnswers,
            u => u.Tickets,
            u => u.TicketAnswers,
        ]));

    // GET: Users/5
    [HttpGet("{id}")]
    public async Task<ActionResult<User>> GetUserById(Guid id)
    {
        try
        {
            return await repository.GetByIdAsync(id, includes: [
                u => u.Educations,
                u => u.SocialMediaProfiles,
                u => u.WorkExperiences,
                u => u.UserActivities,
                u => u.UserLessons,
                u => u.UserAnswers,
                u => u.Tickets,
                u => u.TicketAnswers
            ]) ?? throw new NotFoundException<User>(id);
        }
        catch (NotFoundException<User> nfe)
        {
            return NotFound(new ErrorResponse(nfe));
        }
        catch (Exception ex)
        {
            return BadRequest(new ErrorResponse(ex));
        }
    }

    // GET: Users/Email/5
    [HttpGet("Email/{email}")]
    public async Task<ActionResult<User>> GetUserByEmail(string email)
    {
        try
        {
            return await repository.GetFirstAsync(where: u => !string.IsNullOrEmpty(u.EmailAddress) && u.EmailAddress.ToLower() == email.ToLower(),
                includes: [
                u => u.Educations,
                u => u.SocialMediaProfiles,
                u => u.WorkExperiences,
                u => u.UserActivities,
                u => u.UserLessons,
                u => u.UserAnswers,
                u => u.Tickets,
                u => u.TicketAnswers
            ]) ?? throw new NotFoundException<User>("Пользователь с такой почтой не найден");
        }
        catch (NotFoundException<User> nfe)
        {
            return NotFound(new ErrorResponse(nfe));
        }
        catch (Exception ex)
        {
            return BadRequest(new ErrorResponse(ex));
        }
    }

    // GET: Users/Username/5
    [HttpGet("Username/{username}")]
    public async Task<ActionResult<User>> GetUserByName(string username)
    {
        try
        {
            return await repository.GetFirstAsync(where: u => u.Username == username, includes: [
                u => u.Educations,
                u => u.SocialMediaProfiles,
                u => u.WorkExperiences,
                u => u.UserActivities,
                u => u.UserLessons,
                u => u.UserAnswers,
                u => u.Tickets,
                u => u.TicketAnswers
            ]) ?? throw new NotFoundException<User>("Пользователь с таким именем не найден");
        }
        catch (NotFoundException<User> nfe)
        {
            return NotFound(new ErrorResponse(nfe));
        }
        catch (Exception ex)
        {
            return BadRequest(new ErrorResponse(ex));
        }
    }

    // POST: Users/Auth
    [HttpPost("Auth")]
    public async Task<ActionResult<User>> Authenticate([FromBody] LoginRequest request)
    {
        try
        {
            var user = await repository.GetFirstAsync(where: u => u.Username == request.Login || u.EmailAddress == request.Login,
                includes: [
                    u => u.Educations,
                    u => u.SocialMediaProfiles,
                    u => u.WorkExperiences,
                    u => u.UserActivities,
                    u => u.UserLessons,
                    u => u.UserAnswers,
                    u => u.Tickets,
                    u => u.TicketAnswers
                ]) ?? throw new NotFoundException<User>("Неверный логин или пароль");

            if (!bcrypt.Verify(request.Password, user.PasswordHash))
                throw new NotFoundException<User>("Неверный логин или пароль");

            return user;
        }
        catch (NotFoundException<User> nfe)
        {
            return NotFound(new ErrorResponse(nfe));
        }
        catch (Exception ex)
        {
            return BadRequest(new ErrorResponse(ex));
        }
    }

    // GET: Users/CheckName
    [HttpGet("CheckName")]
    public async Task<ActionResult<bool>> CheckName(string username)
        => await repository.ExistsAsync(u => u.Username == username);

    // GET: Users/CheckEmail
    [HttpGet("CheckEmail")]
    public async Task<ActionResult<bool>> CheckEmail(string emailAddress)
        => await repository.ExistsAsync(u => u.EmailAddress == emailAddress);

    // POST: Users
    [HttpPost]
    public async Task<ActionResult<User>> PostUser(User user)
    {
        try
        {
            var id = user.Id;

            if (await repository.ExistsAsync(u => u.Id == id))
                throw new DuplicateException<User>(id);

            if (await repository.ExistsAsync(u => u.Id == id)
                || !string.IsNullOrEmpty(user.EmailAddress) && await repository.ExistsAsync(
                    u => !string.IsNullOrEmpty(u.EmailAddress) && u.EmailAddress.ToLower() == user.EmailAddress.ToLower()))
                throw new DuplicateException<User>("Пользователь с такой почтой уже существует");

            if (user.Role is not Role.User)
                throw new AccessViolationException("Запрещено создание пользователя с любой ролью кроме User");

            // Валидация имени пользователя
            var usernameValidation = await validationService.ValidateUsername(user.Username, id);
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
            await repository.AddAsync(user);
            await repository.SaveAsync();

            return CreatedAtAction(nameof(GetUserById), new { id }, user);
        }
        catch (NotFoundException<User> nfe)
        {
            return NotFound(new ErrorResponse(nfe));
        }
        catch (Exception ex)
        {
            return BadRequest(new ErrorResponse(ex));
        }
    }

    // PUT: Users/5
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<UpdatedResponse>> PutUser(Guid id, User user)
    {
        try
        {
            NotEqualsException.ThrowIfNotEquals(id, user.Id);
            var existingUser = await repository.GetByIdAsync(id,
                noTracking: false,
                includes: [
                    u => u.Educations,
                    u => u.SocialMediaProfiles,
                    u => u.WorkExperiences,
                    u => u.UserActivities,
                    u => u.UserLessons,
                    u => u.UserAnswers,
                    u => u.Tickets,
                    u => u.TicketAnswers
                ]) ?? throw new NotFoundException<User>(id);

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
                var emailValidation = validationService.ValidateEmail(user.EmailAddress ?? string.Empty);
                if (!emailValidation.Succeed)
                    return BadRequest(emailValidation);
            }

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
            existingUser.Banner = user.Banner;
            existingUser.Background = user.Background;

            // Обновляем коллекции
            existingUser.Educations = user.Educations;
            existingUser.WorkExperiences = user.WorkExperiences;
            existingUser.SocialMediaProfiles = user.SocialMediaProfiles;
            existingUser.UserActivities = user.UserActivities;
            existingUser.UserLessons = user.UserLessons;
            existingUser.UserAnswers = user.UserAnswers;
            existingUser.Tickets = user.Tickets;
            existingUser.TicketAnswers = user.TicketAnswers;

            await repository.SaveAsync();

            return Ok(new
            {
                Succeed = true,
                Message = "Успех",
                User = existingUser
            });
        }
        catch (NotFoundException<User> nfe)
        {
            return NotFound(new ErrorResponse(nfe));
        }
        catch (Exception ex)
        {
            return BadRequest(new ErrorResponse(ex));
        }
    }

    // PUT: Users/Role
    [HttpPut("Role")]
    public async Task<ActionResult<UpdateUserResponse>> PutUserRole([FromBody] UpdateRoleRequest request)
    {
        try
        {
            if (request.Role is Role.Admin || !await repository.ExistsAsync(
                u => u.Id == request.AdminId && u.Role == Role.Admin))
                return BadRequest();

            var existingUser = await repository.GetByIdAsync(request.UserId)
                ?? throw new NotFoundException<User>(request.UserId);

            existingUser.Role = request.Role;

            await repository.SaveAsync();

            return Ok(new
            {
                Succeed = true,
                Message = "Успех"
            });
        }
        catch (NotFoundException<User> nfe)
        {
            return NotFound(new ErrorResponse(nfe));
        }
        catch (Exception ex)
        {
            return BadRequest(new
            {
                Succeed = false,
                ex.Message
            });
        }
    }

    // PUT: Users/Password
    [HttpPut("Password")]
    public async Task<ActionResult<UpdateUserResponse>> PutUserPassword([FromBody] UpdatePasswordRequest request)
    {
        try
        {
            var validatePassword = validationService.ValidatePassword(new User { PasswordHash = request.Password });
            if (!validatePassword.Succeed)
                return BadRequest(new
                {
                    Succeed = false,
                    validatePassword.Message
                });

            var existingUser = await repository.GetByIdAsync(request.UserId)
                ?? throw new NotFoundException<User>(request.UserId);

            var hash = bcrypt.HashPassword(request.Password);
            existingUser.PasswordHash = hash;

            await repository.SaveAsync();

            return Ok(new
            {
                Succeed = true,
                Message = hash
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new
            {
                ex.Message,
                Succeed = false
            });
        }
    }

    // DELETE: Users/5
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteUser(Guid id)
    {
        try
        {
            await repository.DeleteAsync(id);
            await repository.SaveAsync();
            return NoContent();
        }
        catch (NotFoundException<User> nfe)
        {
            return NotFound(new ErrorResponse(nfe));
        }
        catch (Exception ex)
        {
            return BadRequest(new ErrorResponse(ex.InnerException ?? ex));
        }
    }

    [HttpGet("{id:guid}/IsPremium")]
    public async Task<ActionResult<bool>> IsPremium(Guid id)
    {
        try
        {
            return await repository.IsPremium(id);
        }
        catch (NotFoundException<User> nfe)
        {
            return NotFound(new ErrorResponse(nfe));
        }
        catch (Exception ex)
        {
            return BadRequest(new ErrorResponse(ex));
        }
    }
}
