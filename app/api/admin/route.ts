import { NextResponse } from "next/server";
import { env } from "cloudflare:workers";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getClassroomState, normalizeEmail, passwordHash, validEmail } from "@/db/classroom";
import { isFacilitator } from "@/lib/access";

const database = () => { if (!env.DB) throw new Error("Learning database is not available."); return env.DB; };
const clean = (value: unknown) => String(value ?? "").trim();
const id = (prefix: string) => `${prefix}-${crypto.randomUUID().slice(0, 12)}`;

async function guard() {
  const user = await getChatGPTUser();
  if (!user || !isFacilitator(user)) throw new Error("Administrator access required.");
  return user;
}

export async function GET() {
  try { await guard(); return NextResponse.json(await getClassroomState()); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Unauthorized" }, { status: 403 }); }
}

export async function POST(request: Request) {
  try {
    await guard();
    const body = await request.json() as Record<string, unknown>;
    const action = clean(body.action);
    const db = database();
    if (action === "subject") {
      const title = clean(body.title); if (!title) throw new Error("A subject name is required.");
      const subjectId = clean(body.id) || `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${crypto.randomUUID().slice(0, 5)}`;
      await db.prepare("INSERT INTO subjects (id, title, description, color) VALUES (?, ?, ?, ?)").bind(subjectId, title, clean(body.description), clean(body.color) || "#65d8b3").run();
    } else if (action === "content" || action === "question") {
      const subjectId = clean(body.subjectId); if (!subjectId) throw new Error("Select a subject first.");
      if (action === "content") {
        const title = clean(body.title), content = clean(body.body); if (!title || !content) throw new Error("Learning title and content are required.");
        await db.prepare("INSERT INTO learning_contents (id, subject_id, title, body) VALUES (?, ?, ?, ?)").bind(id("content"), subjectId, title, content).run();
      } else {
        const prompt = clean(body.prompt), answer = clean(body.answer); if (!prompt || !answer) throw new Error("Question prompt and model answer are required.");
        await db.prepare("INSERT INTO managed_questions (id, subject_id, content_id, prompt, answer, why, keywords, difficulty) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(id("question"), subjectId, clean(body.contentId) || null, prompt, answer, clean(body.why), JSON.stringify(keywordGroups(body.keywords)), validDifficulty(clean(body.difficulty))).run();
      }
    } else if (action === "bulk-content" || action === "bulk-questions") {
      const subjectId = clean(body.subjectId); const records = Array.isArray(body.records) ? body.records as Array<Record<string, unknown>> : [];
      if (!subjectId || !records.length) throw new Error("Select a subject and provide at least one valid row.");
      const statements = records.map((record) => action === "bulk-content"
        ? db.prepare("INSERT INTO learning_contents (id, subject_id, title, body) VALUES (?, ?, ?, ?)").bind(id("content"), subjectId, clean(record.title) || "Untitled lesson", clean(record.body) || clean(record.content))
        : db.prepare("INSERT INTO managed_questions (id, subject_id, prompt, answer, why, keywords, difficulty) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(id("question"), subjectId, clean(record.prompt) || clean(record.question), clean(record.answer) || clean(record.modelAnswer), clean(record.why), JSON.stringify(keywordGroups(record.keywords)), validDifficulty(clean(record.difficulty))));
      if (statements.some((_, index) => action === "bulk-content" ? !clean(records[index].body) && !clean(records[index].content) : (!clean(records[index].prompt) && !clean(records[index].question)) || (!clean(records[index].answer) && !clean(records[index].modelAnswer)))) throw new Error("Every row needs learning content, or both a question and model answer.");
      await db.batch(statements);
    } else if (action === "learners") {
      const records = Array.isArray(body.records) ? body.records as Array<Record<string, unknown>> : [];
      const statements = [] as D1PreparedStatement[];
      for (const record of records) {
        const email = normalizeEmail(clean(record.email)); if (!validEmail(email)) continue;
        statements.push(db.prepare("INSERT INTO learner_profiles (email, display_name, is_active) VALUES (?, ?, 1) ON CONFLICT(email) DO UPDATE SET display_name = CASE WHEN excluded.display_name <> '' THEN excluded.display_name ELSE learner_profiles.display_name END, is_active = 1").bind(email, clean(record.name) || clean(record.displayName)));
      }
      if (!statements.length) throw new Error("No valid email addresses were found."); await db.batch(statements);
    } else if (action === "assignment") {
      const email = normalizeEmail(clean(body.email)); const subjectIds = Array.isArray(body.subjectIds) ? body.subjectIds.map(clean).filter(Boolean) : [];
      if (!validEmail(email)) throw new Error("Choose a learner.");
      await db.batch([db.prepare("DELETE FROM learner_subjects WHERE email = ?").bind(email), ...subjectIds.map((subjectId) => db.prepare("INSERT INTO learner_subjects (email, subject_id) VALUES (?, ?)").bind(email, subjectId))]);
    } else if (action === "access") {
      const email = normalizeEmail(clean(body.email)); const subjectId = clean(body.subjectId); const validFrom = clean(body.validFrom); const validUntil = clean(body.validUntil);
      if (!validEmail(email) || !subjectId || !validFrom || !validUntil || new Date(validUntil) <= new Date(validFrom)) throw new Error("Choose a learner, subject, and a valid date window.");
      const accessCode = String(Math.floor(1000 + Math.random() * 9000));
      await db.prepare("INSERT INTO course_access (id, subject_id, email, access_code, valid_from, valid_until) VALUES (?, ?, ?, ?, ?, ?)").bind(id("access"), subjectId, email, accessCode, new Date(validFrom).toISOString(), new Date(validUntil).toISOString()).run();
    } else if (action === "admin") {
      const email = normalizeEmail(clean(body.email)), password = clean(body.password); if (!validEmail(email) || password.length < 8) throw new Error("Admin email and an 8-character password are required.");
      await db.prepare("INSERT INTO admin_accounts (email, display_name, password_hash, is_active) VALUES (?, ?, ?, 1) ON CONFLICT(email) DO UPDATE SET display_name = excluded.display_name, password_hash = excluded.password_hash, is_active = 1").bind(email, clean(body.displayName), await passwordHash(password)).run();
    } else throw new Error("Unknown admin action.");
    return NextResponse.json(await getClassroomState());
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Could not save changes." }, { status: 400 }); }
}

export async function PATCH(request: Request) {
  try {
    await guard(); const body = await request.json() as Record<string, unknown>; const db = database(); const action = clean(body.action);
    if (action === "learner-active") await db.prepare("UPDATE learner_profiles SET is_active = ? WHERE email = ?").bind(body.isActive ? 1 : 0, normalizeEmail(clean(body.email))).run();
    else if (action === "admin-active") await db.prepare("UPDATE admin_accounts SET is_active = ? WHERE email = ?").bind(body.isActive ? 1 : 0, normalizeEmail(clean(body.email))).run();
    else if (action === "subject-active") await db.prepare("UPDATE subjects SET is_active = ? WHERE id = ?").bind(body.isActive ? 1 : 0, clean(body.id)).run();
    else if (action === "password") { const password = clean(body.password); if (password.length < 8) throw new Error("Use at least 8 characters."); await db.prepare("UPDATE admin_accounts SET password_hash = ? WHERE email = ?").bind(await passwordHash(password), normalizeEmail(clean(body.email))).run(); }
    else throw new Error("Unknown update.");
    return NextResponse.json(await getClassroomState());
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Could not update." }, { status: 400 }); }
}

function keywordGroups(value: unknown) { if (Array.isArray(value)) return value.map((item) => Array.isArray(item) ? item.map(clean).filter(Boolean) : [clean(item)]).filter((item) => item.length); return clean(value).split(";").map((group) => group.split(",").map(clean).filter(Boolean)).filter((group) => group.length); }
function validDifficulty(value: string) { return value === "Foundation" || value === "Challenge" ? value : "Applied"; }
