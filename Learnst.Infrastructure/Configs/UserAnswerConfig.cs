using Learnst.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Learnst.Infrastructure.Configs;

public class UserAnswerConfig : IEntityTypeConfiguration<UserAnswer>
{
    public void Configure(EntityTypeBuilder<UserAnswer> builder)
    {
        builder.HasKey(uc => new { uc.UserId, uc.AnswerId });
    }
}
