using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Learnst.Domain.Migrations
{
    /// <inheritdoc />
    public partial class UserTicketAnswersCascading : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TicketAnswers_Users_AuthorId",
                table: "TicketAnswers");

            migrationBuilder.AddForeignKey(
                name: "FK_TicketAnswers_Users_AuthorId",
                table: "TicketAnswers",
                column: "AuthorId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.NoAction);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TicketAnswers_Users_AuthorId",
                table: "TicketAnswers");

            migrationBuilder.AddForeignKey(
                name: "FK_TicketAnswers_Users_AuthorId",
                table: "TicketAnswers",
                column: "AuthorId",
                principalTable: "Users",
                principalColumn: "Id");
        }
    }
}
