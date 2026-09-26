import "dotenv/config";
import { POST as createReportHandler } from "../src/app/api/reports/route";
import { GET as trackReportHandler } from "../src/app/api/reports/track/route";
import { PATCH as updateStatusHandler } from "../src/app/api/reports/status/route";
import { NextRequest } from "next/server";
import { prisma } from "../src/lib/db/prisma";

async function runTests() {
  console.log("=== STARTING BACKEND PHASE 2 VERIFICATION TESTS ===\n");
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

  try {
    // -------------------------------------------------------------
    // Test 1: POST valid payload → report created + secure token returned
    // -------------------------------------------------------------
    const validBody = {
      school_id: "SMK-TELKOM-SBY",
      category: "Bullying",
      incident_location: "Kelas XII RPL 1",
      incident_time: "2026-09-26T08:30:00.000Z",
      description: "Terjadi pemalakan dan intimidasi di lorong kelas XII RPL 1 secara berulang.",
      evidence_url: null,
    };

    const req1 = new NextRequest("http://localhost:3000/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validBody),
    });

    const res1 = await createReportHandler(req1);
    const json1 = await res1.json();

    assert(res1.status === 201, "Test 1.1: POST /api/reports returns status 201");
    assert(json1.success === true, "Test 1.2: Response indicates success");
    assert(!!json1.data.report_id, "Test 1.3: Returns report_id UUID");
    assert(
      /^CARE-[0-9A-F]{4}-[0-9A-F]{4}$/.test(json1.data.secret_token),
      "Test 1.4: Returns valid CARE-XXXX-XXXX token format"
    );
    assert(json1.data.status === "RECEIVED", "Test 1.5: Status defaults to RECEIVED");

    const createdReportId = json1.data.report_id;
    const createdSecretToken = json1.data.secret_token;

    // -------------------------------------------------------------
    // Test 2: POST invalid payload (description too short < 20 chars)
    // -------------------------------------------------------------
    const shortBody = {
      school_id: "SMK-TELKOM-SBY",
      category: "Bullying",
      incident_location: "Kantin",
      description: "Terlalu pendek",
    };

    const req2 = new NextRequest("http://localhost:3000/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(shortBody),
    });

    const res2 = await createReportHandler(req2);
    const json2 = await res2.json();

    assert(res2.status === 400, "Test 2.1: Invalid payload returns status 400");
    assert(json2.success === false, "Test 2.2: Response indicates failure");
    assert(
      json2.error?.code === "VALIDATION_ERROR",
      "Test 2.3: Error code is VALIDATION_ERROR"
    );

    // -------------------------------------------------------------
    // Test 3: POST unknown school → safe 404 NOT_FOUND
    // -------------------------------------------------------------
    const unknownSchoolBody = {
      school_id: "UNKNOWN-SCHOOL-XYZ",
      category: "Bullying",
      incident_location: "Lapangan",
      description: "Laporan kejadian untuk sekolah yang tidak terdaftar di database.",
    };

    const req3 = new NextRequest("http://localhost:3000/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(unknownSchoolBody),
    });

    const res3 = await createReportHandler(req3);
    const json3 = await res3.json();

    assert(res3.status === 404, "Test 3.1: Unknown school returns status 404");
    assert(json3.error?.code === "NOT_FOUND", "Test 3.2: Error code is NOT_FOUND");

    // -------------------------------------------------------------
    // Test 4: GET /api/reports/track with valid token → correct report returned
    // -------------------------------------------------------------
    const req4 = new NextRequest(
      `http://localhost:3000/api/reports/track?token=${createdSecretToken}`,
      { method: "GET" }
    );

    const res4 = await trackReportHandler(req4);
    const json4 = await res4.json();

    assert(res4.status === 200, "Test 4.1: GET /api/reports/track returns status 200");
    assert(json4.success === true, "Test 4.2: Response indicates success");
    assert(json4.data.report_id === createdReportId, "Test 4.3: Returns correct report_id");
    assert(json4.data.secret_token === undefined, "Test 4.4: Does not expose secret_token in track data");
    assert(json4.data.status === "RECEIVED", "Test 4.5: Returns status RECEIVED");
    assert(json4.data.school?.id === "SMK-TELKOM-SBY", "Test 4.6: Includes school info");

    // -------------------------------------------------------------
    // Test 5: GET /api/reports/track with invalid / unknown token
    // -------------------------------------------------------------
    const req5a = new NextRequest(
      `http://localhost:3000/api/reports/track?token=CARE-0000-0000`,
      { method: "GET" }
    );
    const res5a = await trackReportHandler(req5a);
    const json5a = await res5a.json();

    assert(res5a.status === 404, "Test 5.1: Non-existent token returns 404");
    assert(json5a.error?.code === "NOT_FOUND", "Test 5.2: Error code is NOT_FOUND");

    const req5b = new NextRequest(
      `http://localhost:3000/api/reports/track?token=INVALID_FORMAT`,
      { method: "GET" }
    );
    const res5b = await trackReportHandler(req5b);
    assert(res5b.status === 404, "Test 5.3: Malformed token format returns 404");

    // -------------------------------------------------------------
    // Test 6: PATCH /api/reports/status with unauthorized access / student token
    // -------------------------------------------------------------
    const req6a = new NextRequest("http://localhost:3000/api/reports/status", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${createdSecretToken}`, // Student token attempted
      },
      body: JSON.stringify({
        report_id: createdReportId,
        status: "UNDER_REVIEW",
      }),
    });
    const res6a = await updateStatusHandler(req6a);
    assert(
      res6a.status === 401,
      "Test 6.1: Student secret token is strictly rejected for status mutations (401)"
    );

    // -------------------------------------------------------------
    // Test 7: PATCH /api/reports/status with authorized internal guard
    // -------------------------------------------------------------
    const req7 = new NextRequest("http://localhost:3000/api/reports/status", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SESSION_SECRET}`,
      },
      body: JSON.stringify({
        report_id: createdReportId,
        status: "UNDER_REVIEW",
      }),
    });
    const res7 = await updateStatusHandler(req7);
    const json7 = await res7.json();

    assert(res7.status === 200, "Test 7.1: Authorized counselor updates status to 200");
    assert(json7.data?.status === "UNDER_REVIEW", "Test 7.2: Status updated to UNDER_REVIEW");

    // Verify in database
    const dbCheck = await prisma.report.findUnique({
      where: { id: createdReportId },
    });
    assert(dbCheck?.status === "UNDER_REVIEW", "Test 7.3: Database state matches updated status");

    // -------------------------------------------------------------
    // Test 8: Security checks - prevent mass assignment & credential leakage
    // -------------------------------------------------------------
    const maliciousBody = {
      school_id: "SMK-TELKOM-SBY",
      category: "Bullying",
      incident_location: "Kantin",
      description: "Uji coba laporan dengan data injeksi yang tidak diizinkan pada payload.",
      status: "RESOLVED", // Should NOT override
      ai_severity: "CRITICAL", // Should NOT override
      secret_token: "CARE-HACK-0000", // Should NOT override
    };

    const req8 = new NextRequest("http://localhost:3000/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(maliciousBody),
    });
    const res8 = await createReportHandler(req8);
    const json8 = await res8.json();

    assert(res8.status === 201, "Test 8.1: Valid payload accepted");
    assert(
      json8.data.secret_token !== "CARE-HACK-0000",
      "Test 8.2: Client-supplied secret_token is ignored"
    );
    assert(
      json8.data.status === "RECEIVED",
      "Test 8.3: Client-supplied status override is ignored"
    );

    const report8 = await prisma.report.findUnique({
      where: { id: json8.data.report_id },
    });
    assert(
      report8?.aiSeverity === "MEDIUM",
      "Test 8.4: Client-supplied ai_severity override is ignored"
    );

    // Clean up test reports
    await prisma.report.deleteMany({
      where: {
        id: { in: [createdReportId, json8.data.report_id] },
      },
    });
    console.log("\nTest records cleaned up successfully.");
  } catch (err) {
    console.error("Test execution error:", err);
    failed++;
  } finally {
    await prisma.$disconnect();
  }

  console.log(`\n=== TEST RESULTS: ${passed} PASSED, ${failed} FAILED ===\n`);
  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
