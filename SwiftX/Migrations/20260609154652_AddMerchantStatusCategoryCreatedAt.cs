using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SwiftX.Migrations
{
    /// <inheritdoc />
    public partial class AddMerchantStatusCategoryCreatedAt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Category",
                table: "Merchants",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "Merchants",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "Merchants",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Category",
                table: "Merchants");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "Merchants");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Merchants");
        }
    }
}
