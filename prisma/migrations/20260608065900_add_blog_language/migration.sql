/*
  Warnings:

  - You are about to drop the column `createdAt` on the `CouponProduct` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "BlogPost" ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'en';

-- AlterTable
ALTER TABLE "Coupon" ALTER COLUMN "type" DROP DEFAULT;

-- AlterTable
ALTER TABLE "CouponProduct" DROP COLUMN "createdAt";

-- CreateTable
CREATE TABLE "AutoImportState" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "currentCategory" TEXT,
    "currentPage" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'IDLE',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutoImportState_pkey" PRIMARY KEY ("id")
);
