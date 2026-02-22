-- AlterTable: 打刻申請に取り下げ日時を追加
ALTER TABLE "TimeCardRequest" ADD COLUMN "cancelledAt" TIMESTAMP(3);

-- AlterTable: 有給申請に取り下げ日時を追加
ALTER TABLE "LeaveRequest" ADD COLUMN "cancelledAt" TIMESTAMP(3);

-- AlterTable: 時間外業務届に取り下げ日時を追加
ALTER TABLE "OvertimeRequest" ADD COLUMN "cancelledAt" TIMESTAMP(3);
