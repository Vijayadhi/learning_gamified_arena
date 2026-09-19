import { NextResponse } from "next/server";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getFacilitatorDashboard } from "@/db/facilitator";
import { isFacilitator } from "@/lib/access";

export async function GET() {
  const authenticated = await getChatGPTUser();
  const user = authenticated ?? (process.env.NODE_ENV === "development" ? {
    userId: "ff22af82-61d2-4af7-a92f-ab3120e4fecb",
    email: "venerablevignesh@gmail.com",
    displayName: "Facilitator Preview",
    fullName: "Facilitator Preview",
  } : null);
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (!isFacilitator(user)) return NextResponse.json({ error: "Facilitator access required." }, { status: 403 });
  return NextResponse.json(await getFacilitatorDashboard());
}
