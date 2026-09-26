import { NextResponse } from "next/server";
import { TPPK_SESSION_COOKIE } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function POST() {
  const response = NextResponse.json({ success: true, data: { logged_out: true } }, { status: 200 });
  response.cookies.set({
    name: TPPK_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
    maxAge: 0,
  });

  return response;
}
