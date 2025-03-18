using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Learnst.Domain.Migrations
{
    /// <inheritdoc />
    public partial class WorkExperienceDateTypeChanged : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<DateTime>(
                name: "StartDate",
                table: "WorkExperiences",
                type: "date",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "datetime",
                oldNullable: false);
            migrationBuilder.AlterColumn<DateTime>(
                name: "EndDate",
                table: "WorkExperiences",
                type: "date",
                nullable: true,
                oldClrType: typeof(DateTime?),
                oldType: "datetime",
                oldNullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<DateTime>(
                name: "StartDate",
                table: "WorkExperiences",
                type: "datetime",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "date",
                oldNullable: false);
            migrationBuilder.AlterColumn<DateTime>(
                name: "EndDate",
                table: "WorkExperiences",
                type: "datetime",
                nullable: true,
                oldClrType: typeof(DateTime?),
                oldType: "date",
                oldNullable: false);
        }
    }
}
