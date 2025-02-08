using Learnst.Dao.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Learnst.Dao.Configs;

public class ApplicationConfig : IEntityTypeConfiguration<Application>
{
    public void Configure(EntityTypeBuilder<Application> builder)
    {
        builder.HasIndex(c => c.Name)
            .IsUnique();

        builder.HasIndex(c => new { c.ClientId, c.ClientSecret })
            .IsUnique();
    }
}
