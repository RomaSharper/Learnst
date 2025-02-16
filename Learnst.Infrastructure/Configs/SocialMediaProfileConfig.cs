using Learnst.Infrastructure.Converters;
using Learnst.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Learnst.Infrastructure.Configs;

public class SocialMediaProfileConfig : IEntityTypeConfiguration<SocialMediaProfile>
{
    public void Configure(EntityTypeBuilder<SocialMediaProfile> builder)
    {
        builder.Property(smp => smp.Platform)
            .HasConversion(new SocialMediaPlatformToStringConverter());
    }
}
