using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using App = Learnst.Infrastructure.Models.Application;

namespace Learnst.Infrastructure.Configs;

public class ApplicationConfig : IEntityTypeConfiguration<App>
{
    public void Configure(EntityTypeBuilder<App> builder)
    {
        builder.HasIndex(c => c.Name)
            .IsUnique();

        builder.HasIndex(c => new { c.ClientId, c.ClientSecret })
            .IsUnique();
    }
}
