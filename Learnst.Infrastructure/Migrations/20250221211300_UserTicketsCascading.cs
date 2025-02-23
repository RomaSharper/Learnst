using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Learnst.Domain.Migrations
{
    /// <inheritdoc />
    public partial class UserTicketsCascading : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Tickets_Users_AuthorId",
                table: "Tickets");

            migrationBuilder.AddForeignKey(
                name: "FK_Tickets_Users_AuthorId",
                table: "Tickets",
                column: "AuthorId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Tickets_Users_AuthorId",
                table: "Tickets");

            migrationBuilder.AddForeignKey(
                name: "FK_Tickets_Users_AuthorId",
                table: "Tickets",
                column: "AuthorId",
                principalTable: "Users",
                principalColumn: "Id");
        }
    }
}
