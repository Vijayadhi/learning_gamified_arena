import { NextResponse } from "next/server";
import { expiredStandaloneCookie, isStandaloneMode } from "@/app/chatgpt-auth";

export async function GET(request: Request) {
  if (!isStandaloneMode()) return NextResponse.redirect(new URL("/signout-with-chatgpt?return_to=%2F", request.url));
  const response = NextResponse.redirect(new URL("/login", request.url));
  response.cookies.set(expiredStandaloneCookie());
  return response;
}
