import "dotenv/config";
import { GET as realtimeHandler } from "../src/app/api/realtime/route";
import { POST as createReportHandler } from "../src/app/api/reports/route";
import { PATCH as updateStatusHandler } from "../src/app/api/reports/status/route";
import { SSEHub, sseHub, type SSEClient } from "../src/server/realtime/sse-hub";
import { prisma } from "../src/lib/db/prisma";
import { NextRequest } from "next/server";

async function runPhase4Tests() {
  console.log("=== STARTING BACKEND PHASE 4 (SSE REALTIME INFRASTRUCTURE) VERIFICATION TESTS ===\n");
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

  let reportAId = "";
  let reportAToken = "";
  let reportBId = "";
  let reportBToken = "";

  try {
    // -------------------------------------------------------------
    // Setup: Create two separate reports (Report A and Report B)
    // -------------------------------------------------------------
    const createReqA = new NextRequest("http://localhost:3000/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        school_id: "SMK-TELKOM-SBY",
        category: "Bullying",
        incident_location: "Kantin Sekolah",
        incident_time: "2026-09-26T09:00:00.000Z",
        description: "Uji coba laporan A untuk pengujian infrastruktur SSE SchoolCare.",
      }),
    });
    const resA = await createReportHandler(createReqA);
    const jsonA = await resA.json();
    reportAId = jsonA.data.report_id;
    reportAToken = jsonA.data.secret_token;

    const createReqB = new NextRequest("http://localhost:3000/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        school_id: "SMK-TELKOM-SBY",
        category: "Kekerasan fisik",
        incident_location: "Lapangan Basket",
        incident_time: "2026-09-26T09:30:00.000Z",
        description: "Uji coba laporan B untuk pengujian isolasi subscription SSE.",
      }),
    });
    const resB = await createReportHandler(createReqB);
    const jsonB = await resB.json();
    reportBId = jsonB.data.report_id;
    reportBToken = jsonB.data.secret_token;

    assert(!!reportAId && !!reportAToken, "Setup: Report A created in database");
    assert(!!reportBId && !!reportBToken, "Setup: Report B created in database");

    // -------------------------------------------------------------
    // Test 1: SSE Hub Unit Tests (Isolated instance)
    // -------------------------------------------------------------
    console.log("\n--- Group 1: In-Memory SSE Hub Unit Tests ---");
    const testHub = new SSEHub();
    const receivedEvents: Array<{ event: string; data: unknown }> = [];

    const mockClient1: SSEClient = {
      id: "client-1",
      reportId: "rep-100",
      send: (event, data) => {
        receivedEvents.push({ event, data });
      },
      sendComment: () => {},
      close: () => {},
    };

    const mockClient2: SSEClient = {
      id: "client-2",
      reportId: "rep-200",
      send: (event, data) => {
        receivedEvents.push({ event, data });
      },
      sendComment: () => {},
      close: () => {},
    };

    const unsubscribe1 = testHub.subscribe(mockClient1);
    testHub.subscribe(mockClient2);

    assert(testHub.getSubscriberCount("rep-100") === 1, "Test 1.1: Hub tracks subscriber count for rep-100");
    assert(testHub.getSubscriberCount("rep-200") === 1, "Test 1.2: Hub tracks subscriber count for rep-200");
    assert(testHub.getSubscriberCount() === 2, "Test 1.3: Hub tracks total subscriber count");

    // Publish to rep-100
    testHub.publishStatusUpdate("rep-100", "UNDER_REVIEW", "2026-09-26T10:00:00.000Z");
    assert(receivedEvents.length === 1, "Test 1.4: rep-100 receives published status update");
    assert(
      (receivedEvents[0].data as { status: string }).status === "UNDER_REVIEW",
      "Test 1.5: Event payload contains status UNDER_REVIEW"
    );

    // Unsubscribe client 1
    unsubscribe1();
    assert(testHub.getSubscriberCount("rep-100") === 0, "Test 1.6: rep-100 subscriber removed on unsubscribe");
    assert(testHub.getSubscriberCount() === 1, "Test 1.7: Total subscribers decreased after unsubscribe");

    // Broken client resilience
    const brokenClient: SSEClient = {
      id: "broken-client",
      reportId: "rep-300",
      send: () => {
        throw new Error("Broken pipe socket closed");
      },
      sendComment: () => {},
      close: () => {},
    };
    testHub.subscribe(brokenClient);
    assert(testHub.getSubscriberCount("rep-300") === 1, "Test 1.8: Broken client registered");
    testHub.publishStatusUpdate("rep-300", "RESOLVED", "2026-09-26T11:00:00.000Z");
    assert(testHub.getSubscriberCount("rep-300") === 0, "Test 1.9: Broken client automatically unsubscribed on write error");

    // -------------------------------------------------------------
    // Test 2: GET /api/realtime - Invalid & Missing Token Handling
    // -------------------------------------------------------------
    console.log("\n--- Group 2: Token Validation & Endpoint Protection ---");
    // Missing token
    const noTokenReq = new NextRequest("http://localhost:3000/api/realtime", { method: "GET" });
    const noTokenRes = await realtimeHandler(noTokenReq);
    assert(noTokenRes.status === 400, "Test 2.1: Missing token returns 400 Bad Request");

    // Malformed token format
    const invalidFormatReq = new NextRequest("http://localhost:3000/api/realtime?token=INVALID-TOKEN-FORMAT", {
      method: "GET",
    });
    const invalidFormatRes = await realtimeHandler(invalidFormatReq);
    assert(invalidFormatRes.status === 404, "Test 2.2: Malformed token format safely rejected with 404");

    // Non-existent token (valid syntax CARE-XXXX-XXXX)
    const notFoundReq = new NextRequest("http://localhost:3000/api/realtime?token=CARE-0000-0000", {
      method: "GET",
    });
    const notFoundRes = await realtimeHandler(notFoundReq);
    assert(notFoundRes.status === 404, "Test 2.3: Non-existent token safely rejected with 404");

    // Arbitrary reportId cannot be passed as authorization
    const arbitraryIdReq = new NextRequest(
      `http://localhost:3000/api/realtime?report_id=${reportAId}`,
      { method: "GET" }
    );
    const arbitraryIdRes = await realtimeHandler(arbitraryIdReq);
    assert(
      arbitraryIdRes.status === 400,
      "Test 2.4: Arbitrary reportId parameter without valid token is rejected with 400"
    );

    // -------------------------------------------------------------
    // Test 3: GET /api/realtime - Valid Token Connection & Initial State
    // -------------------------------------------------------------
    console.log("\n--- Group 3: Valid Subscription & Initial State ---");
    sseHub.clear(); // Reset singleton

    const controllerA = new AbortController();
    const sseReqA = new NextRequest(`http://localhost:3000/api/realtime?token=${reportAToken}`, {
      method: "GET",
      signal: controllerA.signal,
    });

    const sseResA = await realtimeHandler(sseReqA);
    assert(sseResA.status === 200, "Test 3.1: Valid token returns status 200 OK");
    assert(
      sseResA.headers.get("content-type")?.includes("text/event-stream") === true,
      "Test 3.2: Content-Type header is text/event-stream"
    );
    assert(
      sseResA.headers.get("cache-control")?.includes("no-cache") === true,
      "Test 3.3: Cache-Control header specifies no-cache"
    );

    // Read initial event from stream
    const readerA = sseResA.body!.getReader();
    const firstChunk = await readerA.read();
    const firstText = new TextDecoder().decode(firstChunk.value);

    assert(firstText.includes("event: status_updated"), "Test 3.4: Initial event name is status_updated");
    assert(firstText.includes('"status":"RECEIVED"'), "Test 3.5: Initial status payload has status RECEIVED");
    assert(firstText.includes("updated_at"), "Test 3.6: Initial status payload contains updated_at");
    assert(!firstText.includes(reportAToken), "Test 3.7: Security - Secret token is NOT leaked in initial event");
    assert(!firstText.includes("SMK-TELKOM-SBY"), "Test 3.8: Security - School internal ID is NOT leaked in SSE payload");

    assert(
      sseHub.getSubscriberCount(reportAId) === 1,
      "Test 3.9: Report A is registered with 1 subscriber in sseHub"
    );

    // -------------------------------------------------------------
    // Test 4: Report Isolation & Status Update Event Delivery
    // -------------------------------------------------------------
    console.log("\n--- Group 4: Report Isolation & Event Delivery ---");
    // Connect subscriber for Report B
    const controllerB = new AbortController();
    const sseReqB = new NextRequest(`http://localhost:3000/api/realtime?token=${reportBToken}`, {
      method: "GET",
      signal: controllerB.signal,
    });
    const sseResB = await realtimeHandler(sseReqB);
    const readerB = sseResB.body!.getReader();
    // Read initial event for Report B
    await readerB.read();

    assert(
      sseHub.getSubscriberCount(reportBId) === 1,
      "Test 4.1: Report B is registered with 1 subscriber in sseHub"
    );

    // Now update status of Report A via authorized PATCH /api/reports/status
    const patchReqA = new NextRequest("http://localhost:3000/api/reports/status", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SESSION_SECRET}`,
      },
      body: JSON.stringify({
        report_id: reportAId,
        status: "UNDER_REVIEW",
      }),
    });
    const patchResA = await updateStatusHandler(patchReqA);
    assert(patchResA.status === 200, "Test 4.2: Status update for Report A succeeds with 200");

    // Read next chunk for subscriber A
    const updateChunkA = await readerA.read();
    const updateTextA = new TextDecoder().decode(updateChunkA.value);

    assert(updateTextA.includes("event: status_updated"), "Test 4.3: Subscriber A received status_updated event");
    assert(updateTextA.includes('"status":"UNDER_REVIEW"'), "Test 4.4: Subscriber A received UNDER_REVIEW status");
    assert(!updateTextA.includes(reportAToken), "Test 4.5: Secret token is NOT included in event data");

    // Verify database state matches
    const dbReportA = await prisma.report.findUnique({ where: { id: reportAId } });
    assert(dbReportA?.status === "UNDER_REVIEW", "Test 4.6: Database status updated prior to SSE broadcast");

    // -------------------------------------------------------------
    // Test 5: Failed Status Update Does NOT Trigger SSE Event
    // -------------------------------------------------------------
    console.log("\n--- Group 5: Failed Status Updates & Isolation ---");

    // Attempt invalid status update (invalid status enum value)
    const failedPatchReq = new NextRequest("http://localhost:3000/api/reports/status", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SESSION_SECRET}`,
      },
      body: JSON.stringify({
        report_id: reportAId,
        status: "INVALID_STATUS_VALUE",
      }),
    });
    const failedPatchRes = await updateStatusHandler(failedPatchReq);
    assert(failedPatchRes.status === 400, "Test 5.1: Invalid status value returns 400 Bad Request");

    // Attempt unauthorized status update
    const unauthPatchReq = new NextRequest("http://localhost:3000/api/reports/status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        report_id: reportAId,
        status: "RESOLVED",
      }),
    });
    const unauthPatchRes = await updateStatusHandler(unauthPatchReq);
    assert(unauthPatchRes.status === 401, "Test 5.2: Unauthorized status update returns 401");

    // Check that subscriber B received NO events meant for Report A
    // (We test this by updating Report B to ACTION_TAKEN and verifying reader B receives ACTION_TAKEN)
    const patchReqB = new NextRequest("http://localhost:3000/api/reports/status", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SESSION_SECRET}`,
      },
      body: JSON.stringify({
        report_id: reportBId,
        status: "ACTION_TAKEN",
      }),
    });
    const patchResB = await updateStatusHandler(patchReqB);
    assert(patchResB.status === 200, "Test 5.3a: Status update for Report B succeeds with 200");

    const updateChunkB = await readerB.read();
    const updateTextB = new TextDecoder().decode(updateChunkB.value);
    assert(
      updateTextB.includes('"status":"ACTION_TAKEN"') && !updateTextB.includes("UNDER_REVIEW"),
      "Test 5.3: Report isolation verified: Subscriber B received ONLY Report B event (ACTION_TAKEN), never Report A event (UNDER_REVIEW)"
    );

    // -------------------------------------------------------------
    // Test 6: Disconnection & Lifecycle Cleanup
    // -------------------------------------------------------------
    console.log("\n--- Group 6: Connection Lifecycle & Resource Cleanup ---");
    assert(
      sseHub.getSubscriberCount(reportAId) === 1,
      "Test 6.1: Report A has 1 active subscriber before disconnect"
    );

    // Trigger abort on client A
    controllerA.abort();
    // Allow microtask tick for abort event listener to execute
    await new Promise((resolve) => setTimeout(resolve, 50));

    assert(
      sseHub.getSubscriberCount(reportAId) === 0,
      "Test 6.2: Report A subscriber cleanly removed on client abort"
    );

    // Cancel reader B via reader.cancel()
    await readerB.cancel();
    await new Promise((resolve) => setTimeout(resolve, 50));
    assert(
      sseHub.getSubscriberCount(reportBId) === 0,
      "Test 6.3: Report B subscriber cleanly removed on reader cancel"
    );
    assert(
      sseHub.getSubscriberCount() === 0,
      "Test 6.4: Total active subscribers in hub is 0 (no memory leaks)"
    );

    // -------------------------------------------------------------
    // Test 7: Security Verification
    // -------------------------------------------------------------
    console.log("\n--- Group 7: Security Verification ---");
    // Ensure student token cannot perform status mutations
    const studentStatusReq = new NextRequest("http://localhost:3000/api/reports/status", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${reportAToken}`,
      },
      body: JSON.stringify({
        report_id: reportAId,
        status: "RESOLVED",
      }),
    });
    const studentStatusRes = await updateStatusHandler(studentStatusReq);
    assert(
      studentStatusRes.status === 401,
      "Test 7.1: Student secret token is strictly rejected for status changes"
    );

    // Clean up test reports
    await prisma.report.deleteMany({
      where: { id: { in: [reportAId, reportBId] } },
    });
    console.log("\nTest records cleaned up successfully.");
  } catch (err) {
    console.error("Test execution error:", err);
    failed++;
  } finally {
    sseHub.clear();
    await prisma.$disconnect();
  }

  console.log(`\n=== TEST RESULTS: ${passed} PASSED, ${failed} FAILED ===\n`);
  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPhase4Tests();
