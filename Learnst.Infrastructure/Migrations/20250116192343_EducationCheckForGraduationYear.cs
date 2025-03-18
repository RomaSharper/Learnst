using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Learnst.Domain.Migrations
{
    /// <inheritdoc />
    public partial class EducationCheckForGraduationYear : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddCheckConstraint(
                name: "CK_Education_GraduationYear_NotMoreThanCurrentYear",
                table: "Educations",
                sql: "[GraduationYear] <= YEAR(GETDATE())");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_Education_GraduationYear_NotMoreThanCurrentYear",
                table: "Educations");
        }
    }
}
