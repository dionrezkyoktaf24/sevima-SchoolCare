-- CreateEnum
CREATE TYPE "severity_level" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "report_status" AS ENUM ('RECEIVED', 'UNDER_REVIEW', 'ACTION_TAKEN', 'RESOLVED');

-- CreateEnum
CREATE TYPE "sender_role" AS ENUM ('STUDENT', 'COUNSELOR');

-- CreateTable
CREATE TABLE "schools" (
    "id" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" UUID NOT NULL,
    "school_id" VARCHAR(50) NOT NULL,
    "secret_token" VARCHAR(20) NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "incident_location" VARCHAR(150) NOT NULL,
    "incident_time" VARCHAR(100),
    "description" TEXT NOT NULL,
    "evidence_url" TEXT,
    "status" "report_status" NOT NULL DEFAULT 'RECEIVED',
    "ai_severity" "severity_level" NOT NULL DEFAULT 'MEDIUM',
    "ai_confidence" DECIMAL(4,3),
    "ai_risk_summary" TEXT,
    "ai_action_plan" JSONB NOT NULL DEFAULT '[]',
    "ai_draft_response" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_messages" (
    "id" UUID NOT NULL,
    "report_id" UUID NOT NULL,
    "sender" "sender_role" NOT NULL,
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reports_secret_token_key" ON "reports"("secret_token");

-- CreateIndex
CREATE INDEX "idx_reports_school_status" ON "reports"("school_id", "status");

-- CreateIndex
CREATE INDEX "idx_reports_school_severity" ON "reports"("school_id", "ai_severity");

-- CreateIndex
CREATE INDEX "idx_messages_report_created" ON "report_messages"("report_id", "created_at" ASC);

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_messages" ADD CONSTRAINT "report_messages_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
