-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ModuleMediaType" ADD VALUE 'PDF';
ALTER TYPE "ModuleMediaType" ADD VALUE 'DOCUMENT';

-- CreateTable
CREATE TABLE "ModuleFile" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT,
    "mediaType" "ModuleMediaType" NOT NULL,
    "mediaUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModuleFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModuleFileProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "moduleFileId" TEXT NOT NULL,
    "status" "ModuleStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ModuleFileProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ModuleFile_moduleId_order_key" ON "ModuleFile"("moduleId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "ModuleFileProgress_userId_moduleFileId_key" ON "ModuleFileProgress"("userId", "moduleFileId");

-- AddForeignKey
ALTER TABLE "ModuleFile" ADD CONSTRAINT "ModuleFile_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "CourseModule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModuleFileProgress" ADD CONSTRAINT "ModuleFileProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModuleFileProgress" ADD CONSTRAINT "ModuleFileProgress_moduleFileId_fkey" FOREIGN KEY ("moduleFileId") REFERENCES "ModuleFile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
