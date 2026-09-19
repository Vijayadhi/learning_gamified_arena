import { NextResponse } from "next/server";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { ensureUser, getDashboard } from "@/db/arena";

export async function GET() {
  const authenticated = await getChatGPTUser();
  const isDevelopment = process.env.NODE_ENV === "development";
  const user = authenticated ?? (isDevelopment ? {
    userId: "preview-learner",
    email: "preview@arena.local",
    displayName: "Preview Learner",
    fullName: "Preview Learner",
  } : null);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  await ensureUser(user);
  return NextResponse.json(await getDashboard(user.userId));
}
