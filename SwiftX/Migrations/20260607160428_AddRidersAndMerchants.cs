using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace SwiftX.Migrations
{
    /// <inheritdoc />
    public partial class AddRidersAndMerchants : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Merchants",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    BusinessName = table.Column<string>(type: "text", nullable: false),
                    OwnerFirstName = table.Column<string>(type: "text", nullable: false),
                    OwnerLastName = table.Column<string>(type: "text", nullable: false),
                    BusinessAddress = table.Column<string>(type: "text", nullable: false),
                    BusinessContact = table.Column<string>(type: "text", nullable: false),
                    BusinessEmail = table.Column<string>(type: "text", nullable: false),
                    BIRFormPath = table.Column<string>(type: "text", nullable: false),
                    DTICertificatePath = table.Column<string>(type: "text", nullable: false),
                    BarangayClearancePath = table.Column<string>(type: "text", nullable: false),
                    GCContact = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Merchants", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Merchants_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Riders",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    LicensePath = table.Column<string>(type: "text", nullable: false),
                    IDPath = table.Column<string>(type: "text", nullable: false),
                    ORCRPath = table.Column<string>(type: "text", nullable: false),
                    AgreementPath = table.Column<string>(type: "text", nullable: false),
                    FrontVehiclePath = table.Column<string>(type: "text", nullable: false),
                    SideVehiclePath = table.Column<string>(type: "text", nullable: false),
                    GCContact = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Riders", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Riders_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Merchants_UserId",
                table: "Merchants",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Riders_UserId",
                table: "Riders",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Merchants");

            migrationBuilder.DropTable(
                name: "Riders");
        }
    }
}
