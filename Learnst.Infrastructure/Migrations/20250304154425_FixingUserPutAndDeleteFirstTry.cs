using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Learnst.Domain.Migrations
{
    /// <inheritdoc />
    public partial class FixingUserPutAndDeleteFirstTry : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TicketAnswers_Users_AuthorId",
                table: "TicketAnswers");

            migrationBuilder.AlterColumn<Guid>(
                name: "AuthorId",
                table: "TicketAnswers",
                type: "uniqueidentifier",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier");

            migrationBuilder.AddForeignKey(
                name: "FK_TicketAnswers_Users_AuthorId",
                table: "TicketAnswers",
                column: "AuthorId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.NoAction,
                onUpdate: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TicketAnswers_Users_AuthorId",
                table: "TicketAnswers");

            migrationBuilder.AlterColumn<Guid>(
                name: "AuthorId",
                table: "TicketAnswers",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_TicketAnswers_Users_AuthorId",
                table: "TicketAnswers",
                column: "AuthorId",
                principalTable: "Users",
                principalColumn: "Id");
        }
    }
}
