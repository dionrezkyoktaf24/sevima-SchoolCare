import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getSessionFromCookie } from "@/lib/auth/session";
import { ReportDetailClient } from "@/components/dashboard/report-detail-client";

export const dynamic = "force-dynamic";

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSessionFromCookie();
  if (!session) {
    redirect("/dashboard/login");
  }

  const { id } = await params;

  const report = await prisma.report.findUnique({
    where: { id },
    include: {
      school: true,
      messages: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          sender: true,
          message: true,
          createdAt: true,
        },
      },
    },
  });

  if (!report) {
    notFound();
  }

  return (
    <ReportDetailClient
      username={session.username}
      report={{
        id: report.id,
        category: report.category,
        status: report.status,
        aiSeverity: report.aiSeverity,
        aiConfidence: report.aiConfidence ? Number(report.aiConfidence) : null,
        aiRiskSummary: report.aiRiskSummary,
        aiActionPlan: (report.aiActionPlan as Array<{ priority: number; action: string; reason: string }>) ?? [],
        aiDraftResponse: report.aiDraftResponse,
        incidentLocation: report.incidentLocation,
        incidentTime: report.incidentTime,
        description: report.description,
        evidenceUrl: report.evidenceUrl,
        schoolName: report.school.name,
        city: report.school.city,
        createdAt: report.createdAt.toISOString(),
        updatedAt: report.updatedAt.toISOString(),
        messages: report.messages.map((message) => ({
          id: message.id,
          sender_role: message.sender,
          message: message.message,
          created_at: message.createdAt.toISOString(),
        })),
      }}
    />
  );
}
