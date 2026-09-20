import { NextResponse } from "next/server";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { isFacilitator } from "@/lib/access";
import { env } from "cloudflare:workers";

const database = () => { if (!env.DB) throw new Error("Learning database is not available."); return env.DB; };
const clean = (value: unknown) => String(value ?? "").trim();
const id = () => `exam-attempt-${crypto.randomUUID().slice(0, 12)}`;
const row = (value: unknown) => value as Record<string, unknown>;

async function learner() {
  const user = await getChatGPTUser();
  if (!user) throw new Error("Sign in required.");
  return user;
}

async function canTake(examId: string, email: string) {
  const access = await database().prepare(`
    SELECT e.id FROM mcq_exams e
    WHERE e.id = ? AND e.is_active = 1 AND EXISTS (
      SELECT 1 FROM learner_subjects ls WHERE ls.email = ? AND ls.subject_id = e.subject_id
    ) AND (
      NOT EXISTS (SELECT 1 FROM mcq_exam_batches eb WHERE eb.exam_id = e.id)
      OR EXISTS (
        SELECT 1 FROM mcq_exam_batches eb JOIN learner_batch_members lbm ON lbm.batch_id = eb.batch_id
        WHERE eb.exam_id = e.id AND lbm.email = ?
      )
  `).bind(examId, email, email).first();
  return Boolean(access);
}

export async function GET(request: Request) {
  try {
    const user = await learner();
    const url = new URL(request.url);
    if (url.searchParams.get("report") === "true") {
      if (!isFacilitator(user)) return NextResponse.json({ error: "Facilitator access required." }, { status: 403 });
      const result = await database().prepare(`
        SELECT a.id, e.title, e.subject_id, u.email, COALESCE(u.display_name, '') AS display_name,
          a.score, a.total_points, a.duration_seconds, a.started_at, a.completed_at,
          CASE WHEN a.total_points > 0 THEN ROUND(a.score * 100.0 / a.total_points, 1) ELSE 0 END AS percentage
        FROM mcq_attempts a JOIN mcq_exams e ON e.id = a.exam_id
        LEFT JOIN learner_profiles u ON u.email = a.email
        WHERE a.completed_at IS NOT NULL ORDER BY a.completed_at DESC
      `).all();
      return NextResponse.json({ reports: (result.results ?? []).map(row) });
    }
    const result = await database().prepare(`
      SELECT e.id, e.subject_id, e.title, e.duration_seconds, COUNT(q.id) AS question_count,
        CASE WHEN a.completed_at IS NOT NULL THEN 1 ELSE 0 END AS completed
      FROM mcq_exams e JOIN mcq_questions q ON q.exam_id = e.id
      LEFT JOIN mcq_attempts a ON a.exam_id = e.id AND a.email = ?
      WHERE e.is_active = 1 AND EXISTS (SELECT 1 FROM learner_subjects ls WHERE ls.email = ? AND ls.subject_id = e.subject_id)
        AND (NOT EXISTS (SELECT 1 FROM mcq_exam_batches eb WHERE eb.exam_id = e.id) OR EXISTS (SELECT 1 FROM mcq_exam_batches eb JOIN learner_batch_members lbm ON lbm.batch_id = eb.batch_id WHERE eb.exam_id = e.id AND lbm.email = ?))
      GROUP BY e.id ORDER BY e.created_at DESC
    `).bind(user.email, user.email, user.email).all();
    return NextResponse.json({ exams: (result.results ?? []).map(row) });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Could not load exams." }, { status: 400 }); }
}

export async function POST(request: Request) {
  try {
    const user = await learner();
    const body = await request.json() as Record<string, unknown>;
    const action = clean(body.action); const examId = clean(body.examId); const db = database();
    if (!examId || !(await canTake(examId, user.email))) return NextResponse.json({ error: "This exam is not assigned to you." }, { status: 403 });
    if (action === "start") {
      const existing = await db.prepare("SELECT id, started_at, completed_at FROM mcq_attempts WHERE exam_id = ? AND email = ? LIMIT 1").bind(examId, user.email).first<Record<string, unknown>>();
      if (existing?.completed_at) return NextResponse.json({ error: "You have already completed this exam." }, { status: 409 });
      const attemptId = existing ? String(existing.id) : id();
      if (!existing) await db.prepare("INSERT INTO mcq_attempts (id, exam_id, email, started_at) VALUES (?, ?, ?, ?)").bind(attemptId, examId, user.email, new Date().toISOString()).run();
      const exam = await db.prepare("SELECT id, title, duration_seconds FROM mcq_exams WHERE id = ?").bind(examId).first<Record<string, unknown>>();
      const questions = await db.prepare("SELECT id, question, options FROM mcq_questions WHERE exam_id = ? ORDER BY created_at").bind(examId).all();
      return NextResponse.json({ attemptId, exam, questions: (questions.results ?? []).map((value) => { const item = row(value); return { id: String(item.id), question: String(item.question), options: JSON.parse(String(item.options)) }; }) });
    }
    if (action === "submit") {
      const attemptId = clean(body.attemptId); const answers = Array.isArray(body.answers) ? body.answers as Array<Record<string, unknown>> : [];
      const attempt = await db.prepare("SELECT a.started_at, a.completed_at, e.duration_seconds FROM mcq_attempts a JOIN mcq_exams e ON e.id = a.exam_id WHERE a.id = ? AND a.exam_id = ? AND a.email = ?").bind(attemptId, examId, user.email).first<Record<string, unknown>>();
      if (!attempt || attempt.completed_at) return NextResponse.json({ error: "Exam attempt is invalid or already submitted." }, { status: 409 });
      const elapsed = Math.max(0, Math.round((Date.now() - new Date(String(attempt.started_at)).getTime()) / 1000));
      if (elapsed > Number(attempt.duration_seconds)) return NextResponse.json({ error: "The exam time limit has expired." }, { status: 409 });
      const questions = await db.prepare("SELECT id, correct_option, points FROM mcq_questions WHERE exam_id = ?").bind(examId).all();
      const questionRows = (questions.results ?? []).map(row); let score = 0; let total = 0;
      const answerStatements = questionRows.map((question) => { const selected = Number(answers.find((answer) => clean(answer.questionId) === String(question.id))?.selectedOption ?? 0); const correct = selected === Number(question.correct_option); total += Number(question.points ?? 1); if (correct) score += Number(question.points ?? 1); return db.prepare("INSERT INTO mcq_answers (attempt_id, question_id, selected_option, is_correct) VALUES (?, ?, ?, ?)").bind(attemptId, String(question.id), selected, correct ? 1 : 0); });
      const duration = elapsed;
      answerStatements.push(db.prepare("UPDATE mcq_attempts SET completed_at = ?, score = ?, total_points = ?, duration_seconds = ? WHERE id = ?").bind(new Date().toISOString(), score, total, duration, attemptId));
      await db.batch(answerStatements);
      return NextResponse.json({ score, totalPoints: total, durationSeconds: duration, percentage: total ? Math.round(score / total * 1000) / 10 : 0 });
    }
    return NextResponse.json({ error: "Unknown exam action." }, { status: 400 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Could not process exam." }, { status: 400 }); }
}
