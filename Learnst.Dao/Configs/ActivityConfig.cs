using Learnst.Dao.Comparers;
using Learnst.Dao.Converters;
using Learnst.Dao.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Learnst.Dao.Configs;

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
