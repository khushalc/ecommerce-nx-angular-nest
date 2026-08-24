/*
  Warnings:

  - You are about to drop the column `discountType` on the `Sale` table. All the data in the column will be lost.
  - You are about to drop the column `discountValue` on the `Sale` table. All the data in the column will be lost.
  - The primary key for the `SaleTarget` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `categoryId` on the `SaleTarget` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `SaleTarget` table. All the data in the column will be lost.
  - Made the column `productId` on table `SaleTarget` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "SaleTarget" DROP CONSTRAINT "SaleTarget_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "SaleTarget" DROP CONSTRAINT "SaleTarget_productId_fkey";

-- DropIndex
DROP INDEX "SaleTarget_categoryId_idx";

-- DropIndex
DROP INDEX "SaleTarget_saleId_categoryId_productId_key";

-- AlterTable
ALTER TABLE "Sale" DROP COLUMN "discountType",
DROP COLUMN "discountValue",
ADD COLUMN     "bannerImageUrl" TEXT,
ADD COLUMN     "bannerLabel" TEXT,
ADD COLUMN     "ctaHref" TEXT,
ADD COLUMN     "ctaLabel" TEXT,
ADD COLUMN     "defaultDiscountPct" DECIMAL(5,2),
ADD COLUMN     "maxDiscountPerCart" DECIMAL(12,2),
ADD COLUMN     "showInBanner" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "SaleTarget" DROP CONSTRAINT "SaleTarget_pkey",
DROP COLUMN "categoryId",
DROP COLUMN "id",
ADD COLUMN     "discountPctOverride" DECIMAL(5,2),
ALTER COLUMN "productId" SET NOT NULL,
ADD CONSTRAINT "SaleTarget_pkey" PRIMARY KEY ("saleId", "productId");

-- AddForeignKey
ALTER TABLE "SaleTarget" ADD CONSTRAINT "SaleTarget_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
