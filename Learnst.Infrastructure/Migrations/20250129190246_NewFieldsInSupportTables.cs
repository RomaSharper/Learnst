using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Learnst.Domain.Migrations
{
    /// <inheritdoc />
    public partial class NewFieldsInSupportTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "AuthorId",
                table: "Tickets",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "Tickets",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<Guid>(
                name: "AuthorId",
                table: "TicketAnswers",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "TicketAnswers",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_AuthorId",
                table: "Tickets",
                column: "AuthorId");

            migrationBuilder.CreateIndex(
                name: "IX_TicketAnswers_AuthorId",
                table: "TicketAnswers",
                column: "AuthorId");

            migrationBuilder.AddForeignKey(
                name: "FK_TicketAnswers_Users_AuthorId",
                table: "TicketAnswers",
                column: "AuthorId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.NoAction);

            migrationBuilder.AddForeignKey(
                name: "FK_Tickets_Users_AuthorId",
                table: "Tickets",
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

            migrationBuilder.DropForeignKey(
                name: "FK_Tickets_Users_AuthorId",
                table: "Tickets");

            migrationBuilder.DropIndex(
                name: "IX_Tickets_AuthorId",
                table: "Tickets");

            migrationBuilder.DropIndex(
                name: "IX_TicketAnswers_AuthorId",
                table: "TicketAnswers");

            migrationBuilder.DropColumn(
                name: "AuthorId",
                table: "Tickets");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "Tickets");

            migrationBuilder.DropColumn(
                name: "AuthorId",
                table: "TicketAnswers");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "TicketAnswers");
        }
    }
}
