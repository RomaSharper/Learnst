using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Learnst.Dao.Migrations
{
    /// <inheritdoc />
    public partial class LearnstOAuth2Fixed : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_AuthCodes_ClientId",
                table: "AuthCodes",
                column: "ClientId");

            migrationBuilder.CreateIndex(
                name: "IX_AuthCodes_UserId",
                table: "AuthCodes",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_AuthCodes_ClientApplications_ClientId",
                table: "AuthCodes",
                column: "ClientId",
                principalTable: "Applications",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_AuthCodes_Users_UserId",
                table: "AuthCodes",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AuthCodes_ClientApplications_ClientId",
                table: "AuthCodes");

            migrationBuilder.DropForeignKey(
                name: "FK_AuthCodes_Users_UserId",
                table: "AuthCodes");

            migrationBuilder.DropIndex(
                name: "IX_AuthCodes_ClientId",
                table: "AuthCodes");

            migrationBuilder.DropIndex(
                name: "IX_AuthCodes_UserId",
                table: "AuthCodes");
        }
    }
}
