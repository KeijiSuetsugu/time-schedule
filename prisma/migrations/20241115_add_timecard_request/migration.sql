-- CreateTable
CREATE TABLE "TimeCardRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requestType" TEXT NOT NULL,
    "requestedTime" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewComment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimeCardRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TimeCardRequest_userId_idx" ON "TimeCardRequest"("userId");

-- CreateIndex
CREATE INDEX "TimeCardRequest_status_idx" ON "TimeCardRequest"("status");

-- CreateIndex
CREATE INDEX "TimeCardRequest_createdAt_idx" ON "TimeCardRequest"("createdAt");

-- AddForeignKey
ALTER TABLE "TimeCardRequest" ADD CONSTRAINT "TimeCardRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

