using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Learnst.Dao.Migrations
{
    /// <inheritdoc />
    public partial class UserUselessResumeFieldsRemoved : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ResumeFilePath",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "ResumeLink",
                table: "Users");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ResumeFilePath",
                table: "Users",
                type: "nvarchar(2048)",
                maxLength: 2048,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ResumeLink",
                table: "Users",
                type: "nvarchar(2048)",
                maxLength: 2048,
                nullable: true);
        }
    }
}
