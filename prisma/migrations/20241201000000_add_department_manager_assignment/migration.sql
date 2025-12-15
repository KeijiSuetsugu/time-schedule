-- AlterTable
ALTER TABLE "User" ADD COLUMN "managedDepartment" TEXT;

-- AlterTable
ALTER TABLE "TimeCardRequest" ADD COLUMN "assignedDepartmentManagerId" TEXT;

-- AlterTable
ALTER TABLE "LeaveRequest" ADD COLUMN "assignedDepartmentManagerId" TEXT;

-- AlterTable
ALTER TABLE "OvertimeRequest" ADD COLUMN "assignedDepartmentManagerId" TEXT;

-- AddForeignKey
ALTER TABLE "TimeCardRequest" ADD CONSTRAINT "TimeCardRequest_assignedDepartmentManagerId_fkey" FOREIGN KEY ("assignedDepartmentManagerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_assignedDepartmentManagerId_fkey" FOREIGN KEY ("assignedDepartmentManagerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OvertimeRequest" ADD CONSTRAINT "OvertimeRequest_assignedDepartmentManagerId_fkey" FOREIGN KEY ("assignedDepartmentManagerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "TimeCardRequest_assignedDepartmentManagerId_idx" ON "TimeCardRequest"("assignedDepartmentManagerId");

-- CreateIndex
CREATE INDEX "LeaveRequest_assignedDepartmentManagerId_idx" ON "LeaveRequest"("assignedDepartmentManagerId");

-- CreateIndex
CREATE INDEX "OvertimeRequest_assignedDepartmentManagerId_idx" ON "OvertimeRequest"("assignedDepartmentManagerId");

