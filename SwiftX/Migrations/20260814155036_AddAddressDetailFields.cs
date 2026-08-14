using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SwiftX.Migrations
{
    /// <inheritdoc />
    public partial class AddAddressDetailFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ContactName",
                table: "CustomerAddresses",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ContactPhone",
                table: "CustomerAddresses",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FloorUnit",
                table: "CustomerAddresses",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Notes",
                table: "CustomerAddresses",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ContactName",
                table: "CustomerAddresses");

            migrationBuilder.DropColumn(
                name: "ContactPhone",
                table: "CustomerAddresses");

            migrationBuilder.DropColumn(
                name: "FloorUnit",
                table: "CustomerAddresses");

            migrationBuilder.DropColumn(
                name: "Notes",
                table: "CustomerAddresses");
        }
    }
}
