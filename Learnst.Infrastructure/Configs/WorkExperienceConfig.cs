using Learnst.Domain.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Learnst.Infrastructure.Configs;

public class WorkExperienceConfig : IEntityTypeConfiguration<WorkExperience>
{
    public void Configure(EntityTypeBuilder<WorkExperience> builder)
    {
        builder.ToTable(tbl => tbl.HasTrigger("TRG_WorkExperiences_CheckEndDateGreaterStartDate"));
    }
}
