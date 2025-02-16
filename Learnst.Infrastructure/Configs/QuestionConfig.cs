using Learnst.Infrastructure.Converters;
using Learnst.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Learnst.Infrastructure.Configs;

public class QuestionConfig : IEntityTypeConfiguration<Question>
{
    public void Configure(EntityTypeBuilder<Question> builder)
    {
        builder.Property(q => q.AnswerType)
            .HasConversion(new AnswerTypeToStringConverter());
    }
}
