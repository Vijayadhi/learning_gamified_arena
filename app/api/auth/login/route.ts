import { NextResponse } from "next/server";
import { createStandaloneSession, facilitatorEmails, isAllowedStandaloneEmail, isStandaloneMode, standaloneCookie } from "@/app/chatgpt-auth";
import { adminPasswordMatches, verifyAccessCode } from "@/db/classroom";

export async function POST(request: Request) {
  if (!isStandaloneMode()) return NextResponse.json({ error: "Standalone login is disabled." }, { status: 404 });
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const accessCode = String(form.get("access_code") ?? "").trim();
  const mode = String(form.get("mode") ?? "learner");
  const returnTo = safeReturnPath(String(form.get("return_to") ?? "/"));
  const isAdmin = mode === "admin";
  const bootstrapAdmin = !isAdmin && facilitatorEmails().has(email);
  const allowed = isAdmin ? await adminPasswordMatches(email, String(form.get("password") ?? "")) : await isAllowedStandaloneEmail(email);
  const access = !isAdmin && /^\d{4}$/.test(accessCode) ? await verifyAccessCode(email, accessCode) : null;
  const accessGranted = isAdmin || bootstrapAdmin || Boolean(access);
  if (!allowed || !accessGranted) {
    const url = new URL("/login", request.url);
    url.searchParams.set("return_to", returnTo);
    url.searchParams.set("error", isAdmin ? "Admin email or password is incorrect." : "Email, active 4-digit access code, or course window is invalid.");
    return NextResponse.redirect(url, 303);
  }
  const token = await createStandaloneSession(email, (isAdmin || bootstrapAdmin) ? "admin" : "learner", access ? String((access as Record<string, unknown>).subject_id) : undefined);
  const response = NextResponse.redirect(new URL(returnTo, request.url), 303);
  response.cookies.set(standaloneCookie(token));
  return response;
}

function safeReturnPath(value: string) {
  return value.startsWith("/") && !value.startsWith("//") ? value : "/";
}
