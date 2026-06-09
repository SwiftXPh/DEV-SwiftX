using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SwiftX.Migrations
{
    /// <inheritdoc />
    public partial class AddRiderStatusAndPlateNumber : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PlateNumber",
                table: "Riders",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "Riders",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PlateNumber",
                table: "Riders");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Riders");
        }
    }
}
