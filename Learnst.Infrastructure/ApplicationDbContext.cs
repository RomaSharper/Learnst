using Learnst.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;

namespace Learnst.Infrastructure;

public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : DbContext(options)
{
    public DbSet<Activity> Activities { get; set; }
    public DbSet<Answer> Answers { get; set; }
    public DbSet<Education> Educations { get; set; }
    public DbSet<Follow> Follows { get; set; }
    public DbSet<InfoCard> InfoCards { get; set; }
    public DbSet<Lesson> Lessons { get; set; }
    public DbSet<Question> Questions { get; set; }
    public DbSet<SocialMediaProfile> SocialMediaProfiles { get; set; }
    public DbSet<StatusHistory> StatusHistories { get; set; }
    public DbSet<Theme> Themes { get; set; }
    public DbSet<Ticket> Tickets { get; set; }
    public DbSet<TicketAnswer> TicketAnswers { get; set; }
    public DbSet<Topic> Topics { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<UserActivity> UserActivities { get; set; }
    public DbSet<UserAnswer> UserAnswers { get; set; }
    public DbSet<UserLesson> UserLessons { get; set; }
    public DbSet<WorkExperience> WorkExperiences { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
        => modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
}
