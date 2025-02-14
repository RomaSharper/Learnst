using Learnst.Domain.Models;
using Learnst.Infrastructure.Converters;
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
