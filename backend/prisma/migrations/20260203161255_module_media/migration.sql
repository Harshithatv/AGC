/*
  Warnings:

  - You are about to drop the column `presentationUrl` on the `CourseModule` table. All the data in the column will be lost.
  - You are about to drop the column `videoUrl` on the `CourseModule` table. All the data in the column will be lost.
  - Added the required column `mediaType` to the `CourseModule` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mediaUrl` to the `CourseModule` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ModuleMediaType" AS ENUM ('VIDEO', 'PRESENTATION');

-- AlterTable
ALTER TABLE "CourseModule" DROP COLUMN "presentationUrl",
DROP COLUMN "videoUrl",
ADD COLUMN     "mediaType" "ModuleMediaType" NOT NULL,
ADD COLUMN     "mediaUrl" TEXT NOT NULL;
