import { NextResponse } from "next/server";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { userCatalog } from "@/db/classroom";

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  try { return NextResponse.json(await userCatalog(user.email, user.subjectId)); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Catalog unavailable." }, { status: 403 }); }
}
