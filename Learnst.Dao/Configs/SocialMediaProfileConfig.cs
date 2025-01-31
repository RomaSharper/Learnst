using Learnst.Dao.Converters;
using Learnst.Dao.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Learnst.Dao.Configs;

public class SocialMediaProfileConfig : IEntityTypeConfiguration<SocialMediaProfile>
{
    public void Configure(EntityTypeBuilder<SocialMediaProfile> builder)
    {
        builder.Property(smp => smp.Platform)
            .HasConversion(new SocialMediaPlatformToStringConverter());
    }
}
