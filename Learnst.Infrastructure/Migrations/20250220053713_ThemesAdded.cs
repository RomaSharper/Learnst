using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Learnst.Domain.Migrations
{
    /// <inheritdoc />
    public partial class ThemesAdded : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AuthCodes_Applications_ClientId",
                table: "AuthCodes");

            migrationBuilder.DropIndex(
                name: "IX_AuthCodes_ClientId",
                table: "AuthCodes");

            migrationBuilder.DropColumn(
                name: "RedirectUri",
                table: "AuthCodes");

            migrationBuilder.AddColumn<string>(
                name: "ThemeId",
                table: "Users",
                type: "nvarchar(100)",
                nullable: false,
                defaultValue: "light");

            migrationBuilder.AddColumn<string>(
                name: "ApplicationClientId",
                table: "AuthCodes",
                type: "nvarchar(450)",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "RedirectUri",
                table: "Applications",
                type: "nvarchar(2048)",
                maxLength: 2048,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "Applications",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)");

            migrationBuilder.CreateTable(
                name: "Themes",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Premium = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Themes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "UserSubscriptions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SubscriptionType = table.Column<int>(type: "int", nullable: false),
                    StartDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EndDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserSubscriptions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserSubscriptions_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "Themes",
                columns: new[] { "Id", "Premium" },
                values: new object[,]
                {
                    { "aurora", true },
                    { "blurple-twilight", true },
                    { "chroma-glow", true },
                    { "citrus-sherbet", true },
                    { "cotton-candy", true },
                    { "crimson-moon", true },
                    { "dark", false },
                    { "desert-khaki", true },
                    { "dusk", true },
                    { "forest", true },
                    { "hanami", true },
                    { "light", false },
                    { "lofi-vibes", true },
                    { "mars", true },
                    { "midnight-blurple", true },
                    { "mint-apple", true },
                    { "neon-nights", true },
                    { "retro-raincloud", true },
                    { "retro-storm", true },
                    { "sepia", true },
                    { "strawberry-lemonade", true }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Users_ThemeId",
                table: "Users",
                column: "ThemeId");

            migrationBuilder.CreateIndex(
                name: "IX_AuthCodes_ApplicationClientId",
                table: "AuthCodes",
                column: "ApplicationClientId");

            migrationBuilder.CreateIndex(
                name: "IX_UserSubscriptions_UserId",
                table: "UserSubscriptions",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_AuthCodes_Applications_ApplicationClientId",
                table: "AuthCodes",
                column: "ApplicationClientId",
                principalTable: "Applications",
                principalColumn: "ClientId");

            migrationBuilder.AddForeignKey(
                name: "FK_Users_Themes_ThemeId",
                table: "Users",
                column: "ThemeId",
                principalTable: "Themes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AuthCodes_Applications_ApplicationClientId",
                table: "AuthCodes");

            migrationBuilder.DropForeignKey(
                name: "FK_Users_Themes_ThemeId",
                table: "Users");

            migrationBuilder.DropTable(
                name: "Themes");

            migrationBuilder.DropTable(
                name: "UserSubscriptions");

            migrationBuilder.DropIndex(
                name: "IX_Users_ThemeId",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_AuthCodes_ApplicationClientId",
                table: "AuthCodes");

            migrationBuilder.DropColumn(
                name: "ThemeId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "ApplicationClientId",
                table: "AuthCodes");

            migrationBuilder.AddColumn<string>(
                name: "RedirectUri",
                table: "AuthCodes",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AlterColumn<string>(
                name: "RedirectUri",
                table: "Applications",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(2048)",
                oldMaxLength: 2048);

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "Applications",
                type: "nvarchar(450)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50);

            migrationBuilder.CreateIndex(
                name: "IX_AuthCodes_ClientId",
                table: "AuthCodes",
                column: "ClientId");

            migrationBuilder.AddForeignKey(
                name: "FK_AuthCodes_Applications_ClientId",
                table: "AuthCodes",
                column: "ClientId",
                principalTable: "Applications",
                principalColumn: "ClientId",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
