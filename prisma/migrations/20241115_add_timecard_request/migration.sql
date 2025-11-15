-- CreateTable
CREATE TABLE "TimeCardRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "requestType" TEXT NOT NULL,
    "requestedTime" TIMESTAMP NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP,
    "reviewComment" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    CONSTRAINT "TimeCardRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "TimeCardRequest_userId_idx" ON "TimeCardRequest"("userId");

-- CreateIndex
CREATE INDEX "TimeCardRequest_status_idx" ON "TimeCardRequest"("status");

-- CreateIndex
CREATE INDEX "TimeCardRequest_createdAt_idx" ON "TimeCardRequest"("createdAt");

