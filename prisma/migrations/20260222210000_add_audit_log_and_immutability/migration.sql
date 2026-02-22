-- 監査ログテーブル作成（append-only: 労働基準法第109条対応）
CREATE TABLE "AuditLog" (
  "id"          TEXT NOT NULL,
  "entityType"  TEXT NOT NULL,
  "entityId"    TEXT NOT NULL,
  "action"      TEXT NOT NULL,
  "performedBy" TEXT NOT NULL,
  "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "detail"      TEXT,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
CREATE INDEX "AuditLog_performedBy_idx" ON "AuditLog"("performedBy");
CREATE INDEX "AuditLog_performedAt_idx" ON "AuditLog"("performedAt");

-- Location にソフトデリートフィールド追加（打刻場所情報の永久保存）
ALTER TABLE "Location" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- TimeCard の FK を Cascade → Restrict に変更（打刻記録の保護）
ALTER TABLE "TimeCard" DROP CONSTRAINT "TimeCard_userId_fkey";
ALTER TABLE "TimeCard" ADD CONSTRAINT "TimeCard_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- LeaveRequest の FK を Cascade → Restrict に変更（有給管理簿の保護）
ALTER TABLE "LeaveRequest" DROP CONSTRAINT "LeaveRequest_userId_fkey";
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- OvertimeRequest の FK を Cascade → Restrict に変更（時間外労働記録の保護）
ALTER TABLE "OvertimeRequest" DROP CONSTRAINT "OvertimeRequest_userId_fkey";
ALTER TABLE "OvertimeRequest" ADD CONSTRAINT "OvertimeRequest_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
