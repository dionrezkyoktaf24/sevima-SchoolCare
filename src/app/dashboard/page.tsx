import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getSessionFromCookie } from "@/lib/auth/session";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSessionFromCookie();
  if (!session) {
    redirect("/dashboard/login");
  }

  const reports = await prisma.report.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      school: true,
      _count: { select: { messages: true } },
    },
  });

  return (
    <DashboardShell
      username={session.username}
      reports={reports.map((report) => ({
        id: report.id,
        status: report.status,
        category: report.category,
        aiSeverity: report.aiSeverity,
        incidentLocation: report.incidentLocation,
        incidentTime: report.incidentTime,
        description: report.description,
        schoolName: report.school.name,
        city: report.school.city,
        createdAt: report.createdAt.toISOString(),
        updatedAt: report.updatedAt.toISOString(),
        messageCount: report._count.messages,
      }))}
    />
  );
}
