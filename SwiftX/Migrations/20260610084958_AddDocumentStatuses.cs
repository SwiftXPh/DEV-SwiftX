using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SwiftX.Migrations
{
    /// <inheritdoc />
    public partial class AddDocumentStatuses : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BIRFormStatus",
                table: "Merchants",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "BarangayClearanceStatus",
                table: "Merchants",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "DTICertificateStatus",
                table: "Merchants",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BIRFormStatus",
                table: "Merchants");

            migrationBuilder.DropColumn(
                name: "BarangayClearanceStatus",
                table: "Merchants");

            migrationBuilder.DropColumn(
                name: "DTICertificateStatus",
                table: "Merchants");
        }
    }
}
