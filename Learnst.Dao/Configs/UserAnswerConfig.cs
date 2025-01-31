using Learnst.Dao.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Learnst.Dao.Configs;

public class UserAnswerConfig : IEntityTypeConfiguration<UserAnswer>
{
    public void Configure(EntityTypeBuilder<UserAnswer> builder)
    {
        builder.HasKey(uc => new { uc.UserId, uc.AnswerId });
    }
}
