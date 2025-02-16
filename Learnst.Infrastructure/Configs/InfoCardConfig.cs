using Learnst.Infrastructure.Converters;
using Learnst.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Learnst.Infrastructure.Configs;

public class InfoCardConfig : IEntityTypeConfiguration<InfoCard>
{
    public void Configure(EntityTypeBuilder<InfoCard> builder)
    {
        builder.Property(ic => ic.InfoType)
            .HasConversion(new InfoTypeToStringConverter());
    }
}
