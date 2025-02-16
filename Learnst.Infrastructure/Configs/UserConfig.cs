using Learnst.Infrastructure.Converters;
using Learnst.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Learnst.Infrastructure.Configs;

public class UserConfig : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.HasIndex(u => u.Username, "IX_Users_Username")
            .IsUnique();

        builder.HasIndex(u => u.EmailAddress, "IX_Users_EmailAddress")
            .IsUnique();
        
        builder.Property(u => u.Role)
            .HasConversion(new RoleToStringConverter());
    }
}
