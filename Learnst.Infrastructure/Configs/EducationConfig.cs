using Learnst.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Learnst.Infrastructure.Configs;

public class EducationConfig : IEntityTypeConfiguration<Education>
{
    public void Configure(EntityTypeBuilder<Education> builder)
    {
        builder.ToTable(tbl => tbl.HasCheckConstraint(
            "CK_Education_GraduationYear_NotMoreThanCurrentYear",
            "[GraduationYear] <= YEAR(GETDATE())"));
    }
}
