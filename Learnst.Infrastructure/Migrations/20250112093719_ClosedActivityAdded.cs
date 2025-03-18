using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Learnst.Domain.Migrations
{
    /// <inheritdoc />
    public partial class ClosedActivityAdded : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsClosed",
                table: "Activities",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsClosed",
                table: "Activities");
        }
    }
}
