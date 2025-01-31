using Learnst.Dao.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Learnst.Dao.Configs;

public class UserActivityConfig : IEntityTypeConfiguration<UserActivity>
{
    public void Configure(EntityTypeBuilder<UserActivity> builder)
    {
        builder.HasKey(uc => new { uc.UserId, uc.ActivityId });
    }
}
