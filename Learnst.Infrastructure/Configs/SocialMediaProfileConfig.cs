using Learnst.Domain.Models;
using Learnst.Infrastructure.Converters;
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
