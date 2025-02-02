using Learnst.Dao.Enums;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace Learnst.Dao.Models;

public class User
{
    #region Основное

    [Key] public Guid Id { get; set; } = Guid.NewGuid();

    [StringLength(100)] public string? FullName { get; set; }

    [StringLength(2048)] public string? AvatarUrl { get; set; }

    public DateOnly? DateOfBirth { get; set; }

    [StringLength(20, ErrorMessage = "Имя пользователя должно быть не длиннее 20 символов")]
    [RegularExpression(@"^(?!_)[a-z0-9]+(_[a-z0-9]+)*(?<!_)$", ErrorMessage = "Имя пользователя должно содержать только строчные латинские буквы, цифры и максимум одно нижнее подчёркивание (не в начале и не в конце)")]
    public string Username { get; set; } = string.Empty;

    [Required, EmailAddress, StringLength(255)]
    public string EmailAddress { get; set; } = string.Empty;

    [MaxLength(60)] public string? PasswordHash { get; set; }

    [StringLength(50)] public string? City { get; set; }

    [Required] public Role Role { get; set; } = Role.User;

    [StringLength(255)] public string? GoogleId { get; set; }

    #endregion

    #region Образование

    public ICollection<Education> Educations { get; set; } = [];

    #endregion

    #region Опыт работы

    public ICollection<WorkExperience> WorkExperiences { get; set; } = [];

    #endregion

    #region Резюме

    [StringLength(500)] public string? ResumeText { get; set; }

    #endregion

    #region Дополнительная информация

    [StringLength(500)] public string? AboutMe { get; set; }

    public ICollection<SocialMediaProfile> SocialMediaProfiles { get; set; } = [];

    #endregion

    #region Деятельность в 
    [DeleteBehavior(DeleteBehavior.NoAction)]
    public ICollection<Ticket> Tickets { get; set; } = [];
    
    [DeleteBehavior(DeleteBehavior.NoAction)]
    public ICollection<TicketAnswer> TicketAnswers { get; set; } = [];
    #endregion

    [DeleteBehavior(DeleteBehavior.NoAction)]
    public ICollection<UserActivity> UserActivities { get; set; } = [];

    [DeleteBehavior(DeleteBehavior.NoAction)]
    public ICollection<UserAnswer> UserAnswers { get; set; } = [];

    [DeleteBehavior(DeleteBehavior.NoAction)]
    public ICollection<UserLesson> UserLessons { get; set; } = [];
}
