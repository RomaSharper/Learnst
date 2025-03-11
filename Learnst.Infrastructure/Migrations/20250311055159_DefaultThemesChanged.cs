using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Learnst.Domain.Migrations
{
    /// <inheritdoc />
    public partial class DefaultThemesChanged : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Premium",
                table: "Themes");

            migrationBuilder.InsertData(
                table: "Themes",
                column: "Id",
                values: new object[]
                {
                    "sunrise",
                    "sunset",
                    "under-the-sea"
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Themes",
                keyColumn: "Id",
                keyValue: "sunrise");

            migrationBuilder.DeleteData(
                table: "Themes",
                keyColumn: "Id",
                keyValue: "sunset");

            migrationBuilder.DeleteData(
                table: "Themes",
                keyColumn: "Id",
                keyValue: "under-the-sea");

            migrationBuilder.AddColumn<bool>(
                name: "Premium",
                table: "Themes",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.UpdateData(
                table: "Themes",
                keyColumn: "Id",
                keyValue: "aurora",
                column: "Premium",
                value: true);

            migrationBuilder.UpdateData(
                table: "Themes",
                keyColumn: "Id",
                keyValue: "blurple-twilight",
                column: "Premium",
                value: true);

            migrationBuilder.UpdateData(
                table: "Themes",
                keyColumn: "Id",
                keyValue: "chroma-glow",
                column: "Premium",
                value: true);

            migrationBuilder.UpdateData(
                table: "Themes",
                keyColumn: "Id",
                keyValue: "citrus-sherbet",
                column: "Premium",
                value: true);

            migrationBuilder.UpdateData(
                table: "Themes",
                keyColumn: "Id",
                keyValue: "cotton-candy",
                column: "Premium",
                value: true);

            migrationBuilder.UpdateData(
                table: "Themes",
                keyColumn: "Id",
                keyValue: "crimson-moon",
                column: "Premium",
                value: true);

            migrationBuilder.UpdateData(
                table: "Themes",
                keyColumn: "Id",
                keyValue: "dark",
                column: "Premium",
                value: false);

            migrationBuilder.UpdateData(
                table: "Themes",
                keyColumn: "Id",
                keyValue: "desert-khaki",
                column: "Premium",
                value: true);

            migrationBuilder.UpdateData(
                table: "Themes",
                keyColumn: "Id",
                keyValue: "dusk",
                column: "Premium",
                value: true);

            migrationBuilder.UpdateData(
                table: "Themes",
                keyColumn: "Id",
                keyValue: "forest",
                column: "Premium",
                value: true);

            migrationBuilder.UpdateData(
                table: "Themes",
                keyColumn: "Id",
                keyValue: "hanami",
                column: "Premium",
                value: true);

            migrationBuilder.UpdateData(
                table: "Themes",
                keyColumn: "Id",
                keyValue: "light",
                column: "Premium",
                value: false);

            migrationBuilder.UpdateData(
                table: "Themes",
                keyColumn: "Id",
                keyValue: "lofi-vibes",
                column: "Premium",
                value: true);

            migrationBuilder.UpdateData(
                table: "Themes",
                keyColumn: "Id",
                keyValue: "mars",
                column: "Premium",
                value: true);

            migrationBuilder.UpdateData(
                table: "Themes",
                keyColumn: "Id",
                keyValue: "midnight-blurple",
                column: "Premium",
                value: true);

            migrationBuilder.UpdateData(
                table: "Themes",
                keyColumn: "Id",
                keyValue: "mint-apple",
                column: "Premium",
                value: true);

            migrationBuilder.UpdateData(
                table: "Themes",
                keyColumn: "Id",
                keyValue: "neon-nights",
                column: "Premium",
                value: true);

            migrationBuilder.UpdateData(
                table: "Themes",
                keyColumn: "Id",
                keyValue: "retro-raincloud",
                column: "Premium",
                value: true);

            migrationBuilder.UpdateData(
                table: "Themes",
                keyColumn: "Id",
                keyValue: "retro-storm",
                column: "Premium",
                value: true);

            migrationBuilder.UpdateData(
                table: "Themes",
                keyColumn: "Id",
                keyValue: "sepia",
                column: "Premium",
                value: true);

            migrationBuilder.UpdateData(
                table: "Themes",
                keyColumn: "Id",
                keyValue: "strawberry-lemonade",
                column: "Premium",
                value: true);
        }
    }
}
