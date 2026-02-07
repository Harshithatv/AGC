/*
  Warnings:

  - Changed the type of `type` on the `Organization` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `packageType` on the `PackagePrice` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `packageType` on the `PackagePurchase` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Organization"
  ALTER COLUMN "type" TYPE TEXT USING "type"::text;

-- AlterTable
ALTER TABLE "PackagePrice"
  ADD COLUMN     "features" JSONB,
  ADD COLUMN     "highlight" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN     "label" TEXT,
  ADD COLUMN     "summary" TEXT,
  ALTER COLUMN "packageType" TYPE TEXT USING "packageType"::text;

-- AlterTable
ALTER TABLE "PackagePurchase"
  ALTER COLUMN "packageType" TYPE TEXT USING "packageType"::text;

-- DropEnum
DROP TYPE "OrganizationType";

-- DropIndex
DROP INDEX IF EXISTS "PackagePrice_packageType_key";

-- CreateIndex
CREATE UNIQUE INDEX "PackagePrice_packageType_key" ON "PackagePrice"("packageType");
