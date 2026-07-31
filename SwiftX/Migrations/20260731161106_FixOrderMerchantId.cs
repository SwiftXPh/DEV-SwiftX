using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SwiftX.Migrations
{
    /// <inheritdoc />
    public partial class FixOrderMerchantId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
DO $$
BEGIN
  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='Orders' and column_name='StoreId') THEN
      ALTER TABLE ""Orders"" RENAME COLUMN ""StoreId"" TO ""MerchantId"";
      ALTER INDEX ""IX_Orders_StoreId"" RENAME TO ""IX_Orders_MerchantId"";
      
      ALTER TABLE ""Merchants"" ADD COLUMN ""ClosingTime"" text;
      ALTER TABLE ""Merchants"" ADD COLUMN ""CoverImagePath"" text;
      ALTER TABLE ""Merchants"" ADD COLUMN ""Latitude"" double precision;
      ALTER TABLE ""Merchants"" ADD COLUMN ""LogoPath"" text;
      ALTER TABLE ""Merchants"" ADD COLUMN ""Longitude"" double precision;
      ALTER TABLE ""Merchants"" ADD COLUMN ""OpeningTime"" text;

      ALTER TABLE ""Orders"" ADD CONSTRAINT ""FK_Orders_Merchants_MerchantId"" FOREIGN KEY (""MerchantId"") REFERENCES ""Merchants"" (""Id"") ON DELETE CASCADE;
  END IF;
END $$;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {

        }
    }
}
