import "dotenv/config";
import { POST as triageHandler } from "../src/app/api/reports/[reportId]/triage/route";
import { POST as createReportHandler } from "../src/app/api/reports/route";
import { NextRequest } from "next/server";
import { prisma } from "../src/lib/db/prisma";
import { aiTriageService } from "../src/server/services/ai-triage.service";
import type { TriagePromptPackage } from "../src/server/ai/prompt";

async function runPhase3Tests() {
  console.log("=== STARTING BACKEND PHASE 3 (GEMINI AI TRIAGE) VERIFICATION TESTS ===\n");
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} - ${detail ?? "Condition not met"}`);
      failed++;
    }
  }

  let testReportId = "";
  let testSecretToken = "";

  try {
    // Setup: Create a test report in database
    const setupReq = new NextRequest("http://localhost:3000/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        school_id: "SMK-TELKOM-SBY",
        category: "Kekerasan fisik",
        incident_location: "Toilet Lantai 2",
        incident_time: "2026-09-26T10:00:00.000Z",
        description: "Ada siswa yang dipukul di bagian perut dan diancam agar tidak memberitahu guru piket.",
      }),
    });
    const setupRes = await createReportHandler(setupReq);
    const setupJson = await setupRes.json();
    testReportId = setupJson.data.report_id;
    testSecretToken = setupJson.data.secret_token;

    assert(!!testReportId, "Setup: Test report successfully created in PostgreSQL");

    // -------------------------------------------------------------
    // Test 1: Unauthorized request (Missing token & Student token rejected)
    // -------------------------------------------------------------
    const unauthReq1 = new NextRequest(
      `http://localhost:3000/api/reports/${testReportId}/triage`,
      { method: "POST" }
    );
    const unauthRes1 = await triageHandler(unauthReq1, {
      params: Promise.resolve({ reportId: testReportId }),
    });
    assert(
      unauthRes1.status === 401,
      "Test 1.1: Request without authorization is rejected (401)"
    );

    const studentTokenReq = new NextRequest(
      `http://localhost:3000/api/reports/${testReportId}/triage`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${testSecretToken}`,
        },
      }
    );
    const studentTokenRes = await triageHandler(studentTokenReq, {
      params: Promise.resolve({ reportId: testReportId }),
    });
    const studentTokenJson = await studentTokenRes.json();
    assert(
      studentTokenRes.status === 401,
      "Test 1.2: Student secret token is strictly rejected for AI triage (401)"
    );
    assert(
      studentTokenJson.error?.code === "UNAUTHORIZED",
      "Test 1.3: Returns UNAUTHORIZED error code"
    );

    // -------------------------------------------------------------
    // Test 2: Invalid / Unknown report ID
    // -------------------------------------------------------------
    const unknownIdReq = new NextRequest(
      "http://localhost:3000/api/reports/00000000-0000-0000-0000-000000000000/triage",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.SESSION_SECRET}`,
        },
      }
    );
    const unknownIdRes = await triageHandler(unknownIdReq, {
      params: Promise.resolve({ reportId: "00000000-0000-0000-0000-000000000000" }),
    });
    const unknownIdJson = await unknownIdRes.json();
    assert(unknownIdRes.status === 404, "Test 2.1: Non-existent report returns 404");
    assert(unknownIdJson.error?.code === "NOT_FOUND", "Test 2.2: Returns NOT_FOUND error code");

    const malformedIdReq = new NextRequest(
      "http://localhost:3000/api/reports/not-a-uuid/triage",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.SESSION_SECRET}`,
        },
      }
    );
    const malformedIdRes = await triageHandler(malformedIdReq, {
      params: Promise.resolve({ reportId: "not-a-uuid" }),
    });
    assert(malformedIdRes.status === 400, "Test 2.3: Malformed reportId returns 400");

    // -------------------------------------------------------------
    // Test 3: Valid AI response mocked execution
    // -------------------------------------------------------------
    let promptCaptured: TriagePromptPackage | null = null;
    const mockValidOutput = {
      severity: "HIGH",
      confidence: 0.88,
      risk_summary: "Terjadi kekerasan fisik langsung di area tersembunyi (toilet) dengan ancaman intimidasi lanjutan.",
      action_plans: [
        {
          priority: 1,
          action: "Lakukan pemeriksaan medis awal di UKS untuk memastikan kondisi fisik korban.",
          reason: "Prioritas keselamatan fisik korban pasca pemukulan di bagian perut.",
        },
        {
          priority: 2,
          action: "Koordinasi tertutup dengan wali kelas dan guru piket terkait pengawasan area toilet.",
          reason: "Mencegah intimidasi susulan dan menjaga kerahasiaan pelapor.",
        },
      ],
      draft_response: "Halo, terima kasih atas keberanianmu melapor. Kami segera mengambil langkah perlindungan dan memastikan kamu aman.",
    };

    aiTriageService.setRunnerForTesting(async (promptPkg) => {
      promptCaptured = promptPkg;
      return JSON.stringify(mockValidOutput);
    });

    const validReq = new NextRequest(
      `http://localhost:3000/api/reports/${testReportId}/triage`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.SESSION_SECRET}`,
        },
      }
    );

    const validRes = await triageHandler(validReq, {
      params: Promise.resolve({ reportId: testReportId }),
    });
    const validJson = await validRes.json();

    assert(validRes.status === 200, "Test 3.1: Valid triage execution returns status 200");
    assert(validJson.success === true, "Test 3.2: Success flag is true");
    assert(validJson.data.triage.severity === "HIGH", "Test 3.3: Triage severity is HIGH");
    assert(validJson.data.triage.confidence === 0.88, "Test 3.4: Confidence is preserved");
    assert(
      validJson.data.triage.action_plans.length === 2,
      "Test 3.5: Action plans array preserved"
    );

    // Verify database persistence
    const dbReport = await prisma.report.findUnique({
      where: { id: testReportId },
    });
    assert(dbReport?.aiSeverity === "HIGH", "Test 3.6: aiSeverity persisted in PostgreSQL");
    assert(
      Number(dbReport?.aiConfidence) === 0.88,
      "Test 3.7: aiConfidence persisted in PostgreSQL"
    );
    assert(
      dbReport?.aiRiskSummary === mockValidOutput.risk_summary,
      "Test 3.8: aiRiskSummary persisted in PostgreSQL"
    );
    assert(
      Array.isArray(dbReport?.aiActionPlan) && dbReport?.aiActionPlan.length === 2,
      "Test 3.9: aiActionPlan JSON persisted in PostgreSQL"
    );
    assert(
      dbReport?.aiDraftResponse === mockValidOutput.draft_response,
      "Test 3.10: aiDraftResponse persisted in PostgreSQL"
    );

    // Security check: Verify prompt never contained secret ticket token or database UUIDs
    assert(
      promptCaptured !== null && !JSON.stringify(promptCaptured).includes(testSecretToken),
      "Test 3.11: AI prompt strictly excludes student secret token"
    );
    assert(
      promptCaptured !== null && !JSON.stringify(promptCaptured).includes(testReportId),
      "Test 3.12: AI prompt strictly excludes database report UUID"
    );

    // -------------------------------------------------------------
    // Test 4: Invalid AI response (malformed JSON / Zod failure)
    // -------------------------------------------------------------
    aiTriageService.setRunnerForTesting(async () => {
      return "This is not json at all { invalid: 123 }";
    });

    const malformedReq = new NextRequest(
      `http://localhost:3000/api/reports/${testReportId}/triage`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.SESSION_SECRET}`,
        },
      }
    );
    const malformedRes = await triageHandler(malformedReq, {
      params: Promise.resolve({ reportId: testReportId }),
    });
    const malformedJson = await malformedRes.json();

    assert(
      malformedRes.status === 500,
      "Test 4.1: Malformed AI output returns safe 500 server error"
    );
    assert(
      malformedJson.error?.code === "INTERNAL_SERVER_ERROR",
      "Test 4.2: Error code is sanitized INTERNAL_SERVER_ERROR"
    );

    // Zod schema rejection: invalid severity enum
    aiTriageService.setRunnerForTesting(async () => {
      return JSON.stringify({
        ...mockValidOutput,
        severity: "EXTREME_DANGER", // Invalid enum!
      });
    });

    const invalidEnumRes = await triageHandler(malformedReq, {
      params: Promise.resolve({ reportId: testReportId }),
    });
    assert(
      invalidEnumRes.status === 500,
      "Test 4.3: Invalid severity enum in AI output is strictly rejected by Zod"
    );

    // Verify report in DB was NOT corrupted or destroyed
    const dbReportAfterFail = await prisma.report.findUnique({
      where: { id: testReportId },
    });
    assert(
      dbReportAfterFail?.aiSeverity === "HIGH",
      "Test 4.4: Failure behavior preserves existing report integrity without destruction"
    );

    // -------------------------------------------------------------
    // Test 5: Simulated Gemini API Provider Failure
    // -------------------------------------------------------------
    aiTriageService.setRunnerForTesting(async () => {
      throw new Error("Simulated network timeout connecting to generativelanguage.googleapis.com");
    });

    const failureRes = await triageHandler(malformedReq, {
      params: Promise.resolve({ reportId: testReportId }),
    });
    const failureJson = await failureRes.json();

    assert(
      failureRes.status === 500,
      "Test 5.1: Gemini provider failure returns safe 500 error"
    );
    assert(
      !JSON.stringify(failureJson).includes("generativelanguage.googleapis.com"),
      "Test 5.2: Internal Gemini network details are not leaked to client"
    );

    // -------------------------------------------------------------
    // Test 6: Missing Gemini Configuration (API Key / Model missing)
    // -------------------------------------------------------------
    aiTriageService.setRunnerForTesting(null); // Reset to real runner
    const savedKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    const noKeyRes = await triageHandler(malformedReq, {
      params: Promise.resolve({ reportId: testReportId }),
    });
    assert(
      noKeyRes.status === 500,
      "Test 6.1: Missing GEMINI_API_KEY returns safe controlled error (500)"
    );

    // Restore key
    process.env.GEMINI_API_KEY = savedKey;

    // -------------------------------------------------------------
    // Test 7: Security check on response payload
    // -------------------------------------------------------------
    assert(
      !JSON.stringify(validJson).includes(process.env.SESSION_SECRET || "impossible-secret"),
      "Test 7.1: SESSION_SECRET is never exposed in response"
    );
    assert(
      !JSON.stringify(validJson).includes(process.env.GEMINI_API_KEY || "impossible-key"),
      "Test 7.2: GEMINI_API_KEY is never exposed in response"
    );

    // Cleanup test report
    await prisma.report.delete({
      where: { id: testReportId },
    });
    console.log("\nPhase 3 test records cleaned up successfully.");
  } catch (err) {
    console.error("Test execution error:", err);
    failed++;
  } finally {
    aiTriageService.setRunnerForTesting(null);
    await prisma.$disconnect();
  }

  console.log(`\n=== TEST RESULTS: ${passed} PASSED, ${failed} FAILED ===\n`);
  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPhase3Tests();
