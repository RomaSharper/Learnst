using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Learnst.Dao.Migrations
{
    /// <inheritdoc />
    public partial class UserYandexIdAdded : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "YandexId",
                table: "Users",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "YandexId",
                table: "Users");
        }
    }
}
