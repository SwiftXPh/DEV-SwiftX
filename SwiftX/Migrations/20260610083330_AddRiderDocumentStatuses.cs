using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SwiftX.Migrations
{
    /// <inheritdoc />
    public partial class AddRiderDocumentStatuses : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AgreementStatus",
                table: "Riders",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "FrontVehicleStatus",
                table: "Riders",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "IDStatus",
                table: "Riders",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "LicenseStatus",
                table: "Riders",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ORCRStatus",
                table: "Riders",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "SideVehicleStatus",
                table: "Riders",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AgreementStatus",
                table: "Riders");

            migrationBuilder.DropColumn(
                name: "FrontVehicleStatus",
                table: "Riders");

            migrationBuilder.DropColumn(
                name: "IDStatus",
                table: "Riders");

            migrationBuilder.DropColumn(
                name: "LicenseStatus",
                table: "Riders");

            migrationBuilder.DropColumn(
                name: "ORCRStatus",
                table: "Riders");

            migrationBuilder.DropColumn(
                name: "SideVehicleStatus",
                table: "Riders");
        }
    }
}
