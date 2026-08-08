using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace SwiftX.Migrations
{
    /// <inheritdoc />
    public partial class NormalizeDatabase : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BirthDate",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "BirthMonth",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "BirthYear",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "AgreementPath",
                table: "Riders");

            migrationBuilder.DropColumn(
                name: "AgreementStatus",
                table: "Riders");

            migrationBuilder.DropColumn(
                name: "FrontVehiclePath",
                table: "Riders");

            migrationBuilder.DropColumn(
                name: "FrontVehicleStatus",
                table: "Riders");

            migrationBuilder.DropColumn(
                name: "IDPath",
                table: "Riders");

            migrationBuilder.DropColumn(
                name: "IDStatus",
                table: "Riders");

            migrationBuilder.DropColumn(
                name: "LicensePath",
                table: "Riders");

            migrationBuilder.DropColumn(
                name: "LicenseStatus",
                table: "Riders");

            migrationBuilder.DropColumn(
                name: "ORCRPath",
                table: "Riders");

            migrationBuilder.DropColumn(
                name: "ORCRStatus",
                table: "Riders");

            migrationBuilder.DropColumn(
                name: "SideVehiclePath",
                table: "Riders");

            migrationBuilder.DropColumn(
                name: "SideVehicleStatus",
                table: "Riders");

            migrationBuilder.DropColumn(
                name: "ClosingTime",
                table: "Merchants");

            migrationBuilder.DropColumn(
                name: "CoverImagePath",
                table: "Merchants");

            migrationBuilder.DropColumn(
                name: "Latitude",
                table: "Merchants");

            migrationBuilder.DropColumn(
                name: "LogoPath",
                table: "Merchants");

            migrationBuilder.DropColumn(
                name: "Longitude",
                table: "Merchants");

            migrationBuilder.DropColumn(
                name: "OpeningTime",
                table: "Merchants");

            migrationBuilder.DropColumn(
                name: "DefaultDeliveryAddress",
                table: "Customers");

            migrationBuilder.DropColumn(
                name: "DefaultLatitude",
                table: "Customers");

            migrationBuilder.DropColumn(
                name: "DefaultLongitude",
                table: "Customers");

            migrationBuilder.AddColumn<DateTime>(
                name: "DateOfBirth",
                table: "Users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ClosingTime",
                table: "Stores",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CoverImagePath",
                table: "Stores",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "Latitude",
                table: "Stores",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "Longitude",
                table: "Stores",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MerchantId",
                table: "Stores",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "OpeningTime",
                table: "Stores",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ProductId",
                table: "OrderItems",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Products",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    StoreId = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    Price = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    ImagePath = table.Column<string>(type: "text", nullable: true),
                    IsAvailable = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Products", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Products_Stores_StoreId",
                        column: x => x.StoreId,
                        principalTable: "Stores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RiderDocuments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RiderId = table.Column<int>(type: "integer", nullable: false),
                    DocumentType = table.Column<string>(type: "text", nullable: false),
                    FilePath = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false),
                    UploadedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RiderDocuments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RiderDocuments_Riders_RiderId",
                        column: x => x.RiderId,
                        principalTable: "Riders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Stores_MerchantId",
                table: "Stores",
                column: "MerchantId");

            migrationBuilder.CreateIndex(
                name: "IX_OrderItems_ProductId",
                table: "OrderItems",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_Products_StoreId",
                table: "Products",
                column: "StoreId");

            migrationBuilder.CreateIndex(
                name: "IX_RiderDocuments_RiderId",
                table: "RiderDocuments",
                column: "RiderId");

            migrationBuilder.AddForeignKey(
                name: "FK_OrderItems_Products_ProductId",
                table: "OrderItems",
                column: "ProductId",
                principalTable: "Products",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Stores_Merchants_MerchantId",
                table: "Stores",
                column: "MerchantId",
                principalTable: "Merchants",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_OrderItems_Products_ProductId",
                table: "OrderItems");

            migrationBuilder.DropForeignKey(
                name: "FK_Stores_Merchants_MerchantId",
                table: "Stores");

            migrationBuilder.DropTable(
                name: "Products");

            migrationBuilder.DropTable(
                name: "RiderDocuments");

            migrationBuilder.DropIndex(
                name: "IX_Stores_MerchantId",
                table: "Stores");

            migrationBuilder.DropIndex(
                name: "IX_OrderItems_ProductId",
                table: "OrderItems");

            migrationBuilder.DropColumn(
                name: "DateOfBirth",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "ClosingTime",
                table: "Stores");

            migrationBuilder.DropColumn(
                name: "CoverImagePath",
                table: "Stores");

            migrationBuilder.DropColumn(
                name: "Latitude",
                table: "Stores");

            migrationBuilder.DropColumn(
                name: "Longitude",
                table: "Stores");

            migrationBuilder.DropColumn(
                name: "MerchantId",
                table: "Stores");

            migrationBuilder.DropColumn(
                name: "OpeningTime",
                table: "Stores");

            migrationBuilder.DropColumn(
                name: "ProductId",
                table: "OrderItems");

            migrationBuilder.AddColumn<string>(
                name: "BirthDate",
                table: "Users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BirthMonth",
                table: "Users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BirthYear",
                table: "Users",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AgreementPath",
                table: "Riders",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "AgreementStatus",
                table: "Riders",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "FrontVehiclePath",
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
                name: "IDPath",
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
                name: "LicensePath",
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
                name: "ORCRPath",
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
                name: "SideVehiclePath",
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

            migrationBuilder.AddColumn<string>(
                name: "ClosingTime",
                table: "Merchants",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CoverImagePath",
                table: "Merchants",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "Latitude",
                table: "Merchants",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LogoPath",
                table: "Merchants",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "Longitude",
                table: "Merchants",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OpeningTime",
                table: "Merchants",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DefaultDeliveryAddress",
                table: "Customers",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "DefaultLatitude",
                table: "Customers",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "DefaultLongitude",
                table: "Customers",
                type: "double precision",
                nullable: true);
        }
    }
}
