using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Learnst.Dao.Migrations
{
    /// <inheritdoc />
    public partial class WorkExperienceInsertUpdateTrigger : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                CREATE TRIGGER TRG_WorkExperiences_CheckEndDateGreaterStartDate
                ON WorkExperiences
                FOR INSERT, UPDATE
                AS
                BEGIN
                    IF EXISTS (SELECT * FROM inserted WHERE EndDate <= StartDate)
                    BEGIN
                        RAISERROR('EndDate must be greater than StartDate.', 16, 1)
                        ROLLBACK TRANSACTION
                        RETURN
                    END
                END
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP TRIGGER IF EXISTS TRG_WorkExperiences_CheckEndDateGreaterStartDate;");
        }
    }
}
