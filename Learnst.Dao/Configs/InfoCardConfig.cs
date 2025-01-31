using Learnst.Dao.Converters;
using Learnst.Dao.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Learnst.Dao.Configs;

public class InfoCardConfig : IEntityTypeConfiguration<InfoCard>
{
    public void Configure(EntityTypeBuilder<InfoCard> builder)
    {
        builder.Property(ic => ic.InfoType)
            .HasConversion(new InfoTypeToStringConverter());
    }
}
