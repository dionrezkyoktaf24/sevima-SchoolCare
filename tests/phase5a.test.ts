import "dotenv/config";
import { NextRequest } from "next/server";
import { POST as registerHandler } from "../src/app/api/auth/register/route";
import { POST as loginHandler } from "../src/app/api/auth/login/route";
import { GET as dashboardGuard } from "../src/app/api/auth/session/route";

async function runPhase5aTests() {
  console.log("=== STARTING FRONTEND PHASE 5A (TPPK AUTH) VERIFICATION TESTS ===\n");
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
    const invalidReq = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "admin",
        password: "wrong-password",
      }),
    });
    const invalidRes = await loginHandler(invalidReq);
    assert(invalidRes.status === 401, "Test 1.1: Invalid credentials return 401");

    const registerReq = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "bkadmin",
        password: "bkpass123",
        confirmPassword: "bkpass123",
      }),
    });
    const registerRes = await registerHandler(registerReq);
    const registerJson = await registerRes.json();
    assert(registerRes.status === 200, "Test 1.2: Valid registration succeeds with 200");
    assert(registerJson.success === true, "Test 1.3: Registration returns success flag");

    const validReq = new NextRequest("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "bkadmin",
        password: "bkpass123",
      }),
    });
    const validRes = await loginHandler(validReq);
    const validJson = await validRes.json();
    assert(validRes.status === 200, "Test 1.4: Registered login succeeds with 200");
    assert(validJson.success === true, "Test 1.5: Registered login returns success flag");

    const sessionRes = await dashboardGuard(new NextRequest("http://localhost:3000/api/auth/session"));
    assert(sessionRes.status === 401, "Test 2.1: Session check rejects unauthenticated user");

    console.log("\n=== PHASE 5A TEST RESULTS ===");
    console.log(`PASSED: ${passed}`);
    console.log(`FAILED: ${failed}`);
  } catch (error) {
    console.error("PHASE 5A test runner failed:", error);
    failed++;
  }

  if (failed > 0) {
    process.exitCode = 1;
  }
}

void runPhase5aTests();
