using Learnst.Dao.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Learnst.Dao.Configs;

public class WorkExperienceConfig : IEntityTypeConfiguration<WorkExperience>
{
    public void Configure(EntityTypeBuilder<WorkExperience> builder)
    {
        builder.ToTable(tbl => tbl.HasTrigger("TRG_WorkExperiences_CheckEndDateGreaterStartDate"));
    }
}
