import "dotenv/config";
import { GET as getChatHandler, POST as postChatHandler } from "../src/app/api/chat/route";
import {
  GET as getCounselorChatHandler,
  POST as postCounselorChatHandler,
} from "../src/app/api/chat/counselor/route";
import { GET as realtimeHandler } from "../src/app/api/realtime/route";
import { POST as createReportHandler } from "../src/app/api/reports/route";
import { sseHub } from "../src/server/realtime/sse-hub";
import { prisma } from "../src/lib/db/prisma";
import { NextRequest } from "next/server";

async function runPhase5Tests() {
  console.log("=== STARTING BACKEND PHASE 5 (PRIVATE REPORT CHAT) VERIFICATION TESTS ===\n");
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
    // Setup: Create Report A and Report B
    // -------------------------------------------------------------
    const createReqA = new NextRequest("http://localhost:3000/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        school_id: "SMK-TELKOM-SBY",
        category: "Bullying",
        incident_location: "Ruang Kelas X",
        incident_time: "2026-09-26T08:00:00.000Z",
        description: "Laporan A untuk pengujian fungsionalitas chat siswa dan konselor.",
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
        category: "Pemalakan",
        incident_location: "Kantin Belakang",
        incident_time: "2026-09-26T08:30:00.000Z",
        description: "Laporan B untuk pengujian isolasi pesan chat antar laporan berbeda.",
      }),
    });
    const resB = await createReportHandler(createReqB);
    const jsonB = await resB.json();
    reportBId = jsonB.data.report_id;
    reportBToken = jsonB.data.secret_token;

    assert(!!reportAId && !!reportAToken, "Setup: Report A created in database");
    assert(!!reportBId && !!reportBToken, "Setup: Report B created in database");

    // -------------------------------------------------------------
    // Group 1: Student Messaging (POST /api/chat)
    // -------------------------------------------------------------
    console.log("\n--- Group 1: Student Messaging (POST /api/chat) ---");

    // 1. Valid message sent by student
    const studentMsg1 = {
      token: reportAToken,
      message: "Halo Bapak/Ibu guru BK, saya ingin memberikan informasi tambahan mengenai kejadian ini.",
    };
    const sendReq1 = new NextRequest("http://localhost:3000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(studentMsg1),
    });
    const sendRes1 = await postChatHandler(sendReq1);
    const sendJson1 = await sendRes1.json();

    assert(sendRes1.status === 201, "Test 1.1: Student successfully sends message (201 Created)");
    assert(sendJson1.success === true, "Test 1.2: Response indicates success");
    assert(!!sendJson1.data.id, "Test 1.3: Message ID is returned");
    assert(sendJson1.data.sender_role === "STUDENT", "Test 1.4: sender_role is STUDENT");
    assert(sendJson1.data.message === studentMsg1.message, "Test 1.5: Stored message matches input");
    assert(!!sendJson1.data.created_at, "Test 1.6: created_at timestamp is returned");
    assert(!sendJson1.data.secret_token, "Test 1.7: Secret token is NOT returned in response");

    // 2. Student cannot spoof sender_role=COUNSELOR
    const spoofRoleMsg = {
      token: reportAToken,
      message: "Pesan mencoba menyamar sebagai konselor.",
      sender_role: "COUNSELOR",
      sender: "COUNSELOR",
    };
    const spoofReq = new NextRequest("http://localhost:3000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(spoofRoleMsg),
    });
    const spoofRes = await postChatHandler(spoofReq);
    const spoofJson = await spoofRes.json();
    assert(spoofRes.status === 201, "Test 2.1: Message accepted but role sanitized");
    assert(
      spoofJson.data.sender_role === "STUDENT",
      "Test 2.2: Client-supplied sender_role is completely ignored, hardcoded to STUDENT"
    );

    // Verify in database
    const dbMsgSpoof = await prisma.reportMessage.findUnique({
      where: { id: spoofJson.data.id },
    });
    assert(
      dbMsgSpoof?.sender === "STUDENT",
      "Test 2.3: Database record strictly stores sender as STUDENT"
    );

    // 3. Student cannot target arbitrary report_id without token
    const arbitraryIdMsg = {
      report_id: reportBId,
      message: "Mencoba mengirim pesan menggunakan report_id langsung.",
    };
    const arbitraryIdReq = new NextRequest("http://localhost:3000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(arbitraryIdMsg),
    });
    const arbitraryIdRes = await postChatHandler(arbitraryIdReq);
    assert(
      arbitraryIdRes.status === 400,
      "Test 3.1: Request without valid token is rejected with 400"
    );

    // 4. Reject empty message (after whitespace trim)
    const emptyMsgReq = new NextRequest("http://localhost:3000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: reportAToken,
        message: "   ",
      }),
    });
    const emptyMsgRes = await postChatHandler(emptyMsgReq);
    assert(emptyMsgRes.status === 400, "Test 4.1: Empty message rejected with 400");

    // 5. Reject message over 2000 characters
    const overlongMsgReq = new NextRequest("http://localhost:3000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: reportAToken,
        message: "X".repeat(2001),
      }),
    });
    const overlongMsgRes = await postChatHandler(overlongMsgReq);
    assert(overlongMsgRes.status === 400, "Test 5.1: Message > 2000 chars rejected with 400");

    // 6. Invalid token rejected
    const invalidTokenMsgReq = new NextRequest("http://localhost:3000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: "CARE-9999-9999",
        message: "Pesan dengan token tidak dikenal.",
      }),
    });
    const invalidTokenMsgRes = await postChatHandler(invalidTokenMsgReq);
    assert(invalidTokenMsgRes.status === 404, "Test 6.1: Non-existent token rejected with 404");

    // -------------------------------------------------------------
    // Group 2: Student Message Retrieval (GET /api/chat)
    // -------------------------------------------------------------
    console.log("\n--- Group 2: Student Message Retrieval (GET /api/chat) ---");

    // 7. Student retrieves own messages
    const getReqA = new NextRequest(`http://localhost:3000/api/chat?token=${reportAToken}`, {
      method: "GET",
    });
    const getResA = await getChatHandler(getReqA);
    const getJsonA = await getResA.json();

    assert(getResA.status === 200, "Test 7.1: GET /api/chat returns status 200");
    assert(Array.isArray(getJsonA.data.messages), "Test 7.2: Returns messages array");
    assert(getJsonA.data.messages.length >= 2, "Test 7.3: Contains the messages sent previously");
    assert(
      getJsonA.data.messages[0].sender_role === "STUDENT",
      "Test 7.4: Message item contains sender_role"
    );
    assert(
      !JSON.stringify(getJsonA).includes(reportAToken),
      "Test 7.5: Secret token is not leaked in messages payload"
    );

    // 8. Missing token returns 400
    const noTokenGetReq = new NextRequest("http://localhost:3000/api/chat", { method: "GET" });
    const noTokenGetRes = await getChatHandler(noTokenGetReq);
    assert(noTokenGetRes.status === 400, "Test 8.1: Missing token returns 400");

    // 9. Malformed token returns 404
    const malformedGetReq = new NextRequest(
      "http://localhost:3000/api/chat?token=MALFORMED-TOKEN",
      { method: "GET" }
    );
    const malformedGetRes = await getChatHandler(malformedGetReq);
    assert(malformedGetRes.status === 404, "Test 9.1: Malformed token safely rejected with 404");

    // 10. Student for Report B sees ZERO messages from Report A
    const getReqB = new NextRequest(`http://localhost:3000/api/chat?token=${reportBToken}`, {
      method: "GET",
    });
    const getResB = await getChatHandler(getReqB);
    const getJsonB = await getResB.json();
    assert(getResB.status === 200, "Test 10.1: Report B chat query succeeds");
    assert(
      getJsonB.data.messages.length === 0,
      "Test 10.2: Report isolation - Report B has 0 messages, none from Report A"
    );

    // -------------------------------------------------------------
    // Group 3: Counselor Messaging (POST /api/chat/counselor)
    // -------------------------------------------------------------
    console.log("\n--- Group 3: Counselor Messaging (POST & GET /api/chat/counselor) ---");

    // 11. Unauthorized counselor request rejected
    const unauthCounselorReq = new NextRequest("http://localhost:3000/api/chat/counselor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        report_id: reportAId,
        message: "Pesan tanpa token counselor.",
      }),
    });
    const unauthCounselorRes = await postCounselorChatHandler(unauthCounselorReq);
    assert(unauthCounselorRes.status === 401, "Test 11.1: Missing counselor auth returns 401");

    // 12. Student secret token strictly rejected on counselor endpoint
    const studentTokenOnCounselorReq = new NextRequest(
      "http://localhost:3000/api/chat/counselor",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${reportAToken}`,
        },
        body: JSON.stringify({
          report_id: reportAId,
          message: "Siswa mencoba akses endpoint konselor.",
        }),
      }
    );
    const studentTokenOnCounselorRes = await postCounselorChatHandler(
      studentTokenOnCounselorReq
    );
    assert(
      studentTokenOnCounselorRes.status === 401,
      "Test 12.1: Student secret token is strictly rejected for counselor endpoint (401)"
    );

    // 13. Authorized counselor sends message to Report A
    const counselorMsgText =
      "Terima kasih atas informasinya. Tim TPPK sedang menindaklanjuti laporan ini secara rahasia.";
    const validCounselorReq = new NextRequest(
      "http://localhost:3000/api/chat/counselor",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.SESSION_SECRET}`,
        },
        body: JSON.stringify({
          report_id: reportAId,
          message: counselorMsgText,
        }),
      }
    );
    const validCounselorRes = await postCounselorChatHandler(validCounselorReq);
    const validCounselorJson = await validCounselorRes.json();

    assert(validCounselorRes.status === 201, "Test 13.1: Counselor message created with 201");
    assert(validCounselorJson.success === true, "Test 13.2: Success flag is true");
    assert(
      validCounselorJson.data.sender_role === "COUNSELOR",
      "Test 13.3: Counselor message has sender_role COUNSELOR"
    );
    assert(
      validCounselorJson.data.message === counselorMsgText,
      "Test 13.4: Message content matches"
    );

    // Verify in database
    const dbCounselorMsg = await prisma.reportMessage.findUnique({
      where: { id: validCounselorJson.data.id },
    });
    assert(
      dbCounselorMsg?.sender === "COUNSELOR",
      "Test 13.5: Database stores sender as COUNSELOR"
    );

    // 14. Counselor can retrieve messages via GET /api/chat/counselor
    const counselorGetReq = new NextRequest(
      `http://localhost:3000/api/chat/counselor?report_id=${reportAId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.SESSION_SECRET}`,
        },
      }
    );
    const counselorGetRes = await getCounselorChatHandler(counselorGetReq);
    const counselorGetJson = await counselorGetRes.json();
    assert(counselorGetRes.status === 200, "Test 14.1: Counselor retrieves messages with 200");
    assert(
      counselorGetJson.data.messages.length === 3,
      "Test 14.2: Counselor sees all 3 messages in Report A"
    );
    assert(
      counselorGetJson.data.messages[2].sender_role === "COUNSELOR",
      "Test 14.3: Last message is from COUNSELOR"
    );

    // 15. Student retrieving messages now sees counselor's response
    const studentGetUpdatedReq = new NextRequest(
      `http://localhost:3000/api/chat?token=${reportAToken}`,
      { method: "GET" }
    );
    const studentGetUpdatedRes = await getChatHandler(studentGetUpdatedReq);
    const studentGetUpdatedJson = await studentGetUpdatedRes.json();
    assert(
      studentGetUpdatedJson.data.messages.some(
        (m: { sender_role: string; message: string }) =>
          m.sender_role === "COUNSELOR" && m.message === counselorMsgText
      ),
      "Test 15.1: Student successfully sees counselor's response in chronological history"
    );

    // -------------------------------------------------------------
    // Group 4: Realtime SSE Integration for Chat (new_message event)
    // -------------------------------------------------------------
    console.log("\n--- Group 4: SSE Integration for Chat (new_message) ---");
    sseHub.clear();

    // Connect SSE client for Report A
    const controllerSSE_A = new AbortController();
    const sseReqA = new NextRequest(`http://localhost:3000/api/realtime?token=${reportAToken}`, {
      method: "GET",
      signal: controllerSSE_A.signal,
    });
    const sseResA = await realtimeHandler(sseReqA);
    const readerA = sseResA.body!.getReader();
    // Read initial status_updated event
    await readerA.read();

    // Connect SSE client for Report B
    const controllerSSE_B = new AbortController();
    const sseReqB = new NextRequest(`http://localhost:3000/api/realtime?token=${reportBToken}`, {
      method: "GET",
      signal: controllerSSE_B.signal,
    });
    const sseResB = await realtimeHandler(sseReqB);
    const readerB = sseResB.body!.getReader();
    // Read initial status_updated event
    await readerB.read();

    assert(
      sseHub.getSubscriberCount(reportAId) === 1,
      "Test 16.1: Report A subscriber active in sseHub"
    );
    assert(
      sseHub.getSubscriberCount(reportBId) === 1,
      "Test 16.2: Report B subscriber active in sseHub"
    );

    // Send counselor message to Report A
    const liveCounselorMsg = "Halo, kami memantau laporan kamu secara berkala.";
    const liveCounselorReq = new NextRequest(
      "http://localhost:3000/api/chat/counselor",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.SESSION_SECRET}`,
        },
        body: JSON.stringify({
          report_id: reportAId,
          message: liveCounselorMsg,
        }),
      }
    );
    await postCounselorChatHandler(liveCounselorReq);

    // Read SSE event for Report A subscriber
    const chunkA = await readerA.read();
    const textA = new TextDecoder().decode(chunkA.value);

    assert(
      textA.includes("event: new_message"),
      "Test 16.3: Subscriber A received 'event: new_message'"
    );
    assert(
      textA.includes('"sender_role":"COUNSELOR"'),
      "Test 16.4: SSE event data has sender_role COUNSELOR"
    );
    assert(
      textA.includes(liveCounselorMsg),
      "Test 16.5: SSE event data contains the message body"
    );
    assert(
      !textA.includes(reportAToken),
      "Test 16.6: Secret token is NOT present in SSE new_message payload"
    );

    // Send student message to Report B
    const liveStudentMsgB = "Informasi baru untuk laporan B.";
    const liveStudentReqB = new NextRequest("http://localhost:3000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: reportBToken,
        message: liveStudentMsgB,
      }),
    });
    await postChatHandler(liveStudentReqB);

    // Read SSE event for Report B subscriber
    const chunkB = await readerB.read();
    const textB = new TextDecoder().decode(chunkB.value);

    assert(
      textB.includes("event: new_message"),
      "Test 16.7: Subscriber B received 'event: new_message'"
    );
    assert(
      textB.includes('"sender_role":"STUDENT"'),
      "Test 16.8: SSE event data has sender_role STUDENT"
    );
    assert(
      textB.includes(liveStudentMsgB) && !textB.includes(liveCounselorMsg),
      "Test 16.9: Report isolation: Subscriber B received ONLY Report B message, never Report A message"
    );

    // Clean up SSE subscribers
    controllerSSE_A.abort();
    controllerSSE_B.abort();
    await new Promise((r) => setTimeout(r, 50));
    assert(
      sseHub.getSubscriberCount() === 0,
      "Test 16.10: All SSE subscribers cleaned up after disconnect"
    );

    // -------------------------------------------------------------
    // Group 5: Failure Boundaries & Edge Cases
    // -------------------------------------------------------------
    console.log("\n--- Group 5: Failure Boundaries & Resilience ---");

    // 17. Database failure / validation failure produces NO SSE event
    let sseTriggeredOnFailure = false;
    const mockClient: import("../src/server/realtime/sse-hub").SSEClient = {
      id: "mock-fail-client",
      reportId: reportAId,
      send: () => {
        sseTriggeredOnFailure = true;
      },
      sendComment: () => {},
      close: () => {},
    };
    sseHub.subscribe(mockClient);

    // Send invalid payload to trigger failure before DB insert
    const failedMsgReq = new NextRequest("http://localhost:3000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: reportAToken,
        message: "", // Empty message
      }),
    });
    const failedMsgRes = await postChatHandler(failedMsgReq);
    assert(failedMsgRes.status === 400, "Test 17.1: Invalid message fails validation");
    assert(
      sseTriggeredOnFailure === false,
      "Test 17.2: Failed message produces NO SSE event"
    );
    sseHub.unsubscribe(mockClient);

    // 18. SSE publish failure does not rollback or delete persisted message
    const throwingClient: import("../src/server/realtime/sse-hub").SSEClient = {
      id: "throwing-client",
      reportId: reportAId,
      send: () => {
        throw new Error("Simulated stream sink failure");
      },
      sendComment: () => {},
      close: () => {},
    };
    sseHub.subscribe(throwingClient);

    const resilientMsgText = "Pesan ini harus tetap tersimpan meskipun pengiriman SSE gagal.";
    const resilientReq = new NextRequest("http://localhost:3000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: reportAToken,
        message: resilientMsgText,
      }),
    });
    const resilientRes = await postChatHandler(resilientReq);
    const resilientJson = await resilientRes.json();

    assert(
      resilientRes.status === 201,
      "Test 18.1: API returns 201 success even when SSE broadcast encounters sink failure"
    );

    // Verify in database that message was not deleted
    const dbResilientCheck = await prisma.reportMessage.findUnique({
      where: { id: resilientJson.data.id },
    });
    assert(
      dbResilientCheck !== null && dbResilientCheck.message === resilientMsgText,
      "Test 18.2: Message remains safely stored in PostgreSQL despite SSE broadcast failure"
    );

    sseHub.clear();

    // -------------------------------------------------------------
    // Clean up test reports & messages
    // -------------------------------------------------------------
    await prisma.reportMessage.deleteMany({
      where: { reportId: { in: [reportAId, reportBId] } },
    });
    await prisma.report.deleteMany({
      where: { id: { in: [reportAId, reportBId] } },
    });
    console.log("\nPhase 5 test records cleaned up successfully.");
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

runPhase5Tests();
