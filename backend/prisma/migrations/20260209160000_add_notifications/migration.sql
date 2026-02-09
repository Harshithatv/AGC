-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "recipientRole" TEXT NOT NULL,
    "recipientOrgId" TEXT,
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex for fast lookups
CREATE INDEX "Notification_recipientRole_read_idx" ON "Notification"("recipientRole", "read");
CREATE INDEX "Notification_recipientOrgId_idx" ON "Notification"("recipientOrgId");
