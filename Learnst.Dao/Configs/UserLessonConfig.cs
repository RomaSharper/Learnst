using Learnst.Dao.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Learnst.Dao.Configs;

public class UserLessonConfig : IEntityTypeConfiguration<UserLesson>
{
    public void Configure(EntityTypeBuilder<UserLesson> builder)
    {
        builder.HasKey(ul => new
        {
            ul.UserId, ul.LessonId
        });
    }
}
