using Learnst.Domain.Models;
using Learnst.Infrastructure.Comparers;
using Learnst.Infrastructure.Converters;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Learnst.Infrastructure.Configs;

public class ActivityConfig : IEntityTypeConfiguration<Activity>
{
    public void Configure(EntityTypeBuilder<Activity> builder)
    {
        builder.Property(c => c.Level)
            .HasConversion(new LevelToStringConverter());

        builder.Property(c => c.Tags)
            .HasConversion(new ICollectionToStringConverter())
            .Metadata.SetValueComparer(new StringCollectionComparer());

        builder.Property(c => c.TargetAudience)
            .HasConversion(new ICollectionToStringConverter())
            .Metadata.SetValueComparer(new StringCollectionComparer());

        builder.Property(c => c.CheckList)
            .HasConversion(new ICollectionToStringConverter())
            .Metadata.SetValueComparer(new StringCollectionComparer());
    }
}
