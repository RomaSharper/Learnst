using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Learnst.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UserIpPropertyAdded : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Ip",
                table: "Users",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "unknown");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Ip",
                table: "Users");
        }
    }
}
