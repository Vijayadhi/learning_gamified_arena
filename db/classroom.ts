import { env } from "cloudflare:workers";

export type ClassroomSubject = { id: string; title: string; description: string; color: string; isActive: boolean };
export type ClassroomContent = { id: string; subjectId: string; title: string; body: string };
export type ClassroomQuestion = { id: string; subjectId: string; contentId: string | null; prompt: string; answer: string; why: string; keywords: string[][]; difficulty: "Foundation" | "Applied" | "Challenge" };
export type ClassroomBatch = { id: string; subjectId: string; name: string; members: number };
export type ClassroomExam = { id: string; subjectId: string; title: string; durationSeconds: number; questionCount: number; batchIds: string[] };

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const normalizeEmail = (value: string) => value.trim().toLowerCase();
export const validEmail = (value: string) => emailPattern.test(normalizeEmail(value));
const db = () => { if (!env.DB) throw new Error("Learning database is not available."); return env.DB; };
const row = (value: unknown) => value as Record<string, unknown>;

export async function getClassroomState() {
  const [subjectResult, learnerResult, assignmentResult, contentResult, questionResult, accessResult, accessKeyResult, adminResult, batchResult, examResult] = await Promise.all([
    db().prepare("SELECT id, title, description, color, is_active FROM subjects ORDER BY title").all(),
    db().prepare("SELECT email, display_name, is_active FROM learner_profiles ORDER BY email").all(),
    db().prepare("SELECT email, subject_id FROM learner_subjects ORDER BY email").all(),
    db().prepare("SELECT id, subject_id, title, body FROM learning_contents ORDER BY created_at DESC").all(),
    db().prepare("SELECT id, subject_id, content_id, prompt, answer, why, keywords, difficulty, is_active FROM managed_questions ORDER BY created_at DESC").all(),
    db().prepare("SELECT id, subject_id, email, access_code, valid_from, valid_until, is_active FROM course_access ORDER BY valid_from DESC").all(),
    db().prepare("SELECT k.id, k.subject_id, k.batch_id, b.name AS batch_name, k.access_code, k.valid_from, k.valid_until, k.is_active FROM subject_access_keys k JOIN learner_batches b ON b.id = k.batch_id ORDER BY k.valid_from DESC").all(),
    db().prepare("SELECT email, display_name, is_active FROM admin_accounts ORDER BY email").all(),
    db().prepare("SELECT b.id, b.subject_id, b.name, COUNT(m.email) AS members FROM learner_batches b LEFT JOIN learner_batch_members m ON m.batch_id = b.id GROUP BY b.id ORDER BY b.name").all(),
    db().prepare("SELECT e.id, e.subject_id, e.title, e.duration_seconds, COUNT(DISTINCT q.id) AS question_count, GROUP_CONCAT(DISTINCT eb.batch_id) AS batch_ids FROM mcq_exams e LEFT JOIN mcq_questions q ON q.exam_id = e.id LEFT JOIN mcq_exam_batches eb ON eb.exam_id = e.id GROUP BY e.id ORDER BY e.created_at DESC").all(),
  ]);
  const subjects = (subjectResult.results ?? []).map(row).map((r) => ({ id: String(r.id), title: String(r.title), description: String(r.description), color: String(r.color), isActive: Boolean(r.is_active) }));
  return {
    subjects,
    learners: (learnerResult.results ?? []).map(row).map((r) => ({ email: String(r.email), displayName: String(r.display_name), isActive: Boolean(r.is_active) })),
    assignments: (assignmentResult.results ?? []).map(row).map((r) => ({ email: String(r.email), subjectId: String(r.subject_id) })),
    contents: (contentResult.results ?? []).map(row).map((r) => ({ id: String(r.id), subjectId: String(r.subject_id), title: String(r.title), body: String(r.body) })),
    questions: (questionResult.results ?? []).map(row).map((r) => ({ id: String(r.id), subjectId: String(r.subject_id), contentId: r.content_id ? String(r.content_id) : null, prompt: String(r.prompt), answer: String(r.answer), why: String(r.why), keywords: readKeywords(String(r.keywords)), difficulty: validDifficulty(String(r.difficulty)), isActive: Boolean(r.is_active) })),
    accessWindows: (accessResult.results ?? []).map(row).map((r) => ({ id: String(r.id), subjectId: String(r.subject_id), email: String(r.email), accessCode: String(r.access_code), validFrom: String(r.valid_from), validUntil: String(r.valid_until), isActive: Boolean(r.is_active) })),
    accessKeys: (accessKeyResult.results ?? []).map(row).map((r) => ({ id: String(r.id), subjectId: String(r.subject_id), batchId: String(r.batch_id), batchName: String(r.batch_name), accessCode: String(r.access_code), validFrom: String(r.valid_from), validUntil: String(r.valid_until), isActive: Boolean(r.is_active) })),
    admins: (adminResult.results ?? []).map(row).map((r) => ({ email: String(r.email), displayName: String(r.display_name), isActive: Boolean(r.is_active) })),
    batches: (batchResult.results ?? []).map(row).map((r) => ({ id: String(r.id), subjectId: String(r.subject_id), name: String(r.name), members: Number(r.members ?? 0) })),
    exams: (examResult.results ?? []).map(row).map((r) => ({ id: String(r.id), subjectId: String(r.subject_id), title: String(r.title), durationSeconds: Number(r.duration_seconds), questionCount: Number(r.question_count ?? 0), batchIds: String(r.batch_ids ?? "").split(",").filter(Boolean) })),
  };
}

export async function userCatalog(emailValue: string, accessSubjectId?: string) {
  const email = normalizeEmail(emailValue);
  if (accessSubjectId) {
    const now = new Date().toISOString();
    const activeSubject = await db().prepare("SELECT ls.email FROM learner_subjects ls LEFT JOIN learner_subject_status lss ON lss.email = ls.email AND lss.subject_id = ls.subject_id WHERE ls.email = ? AND ls.subject_id = ? AND COALESCE(lss.is_active, 1) = 1 LIMIT 1").bind(email, accessSubjectId).first();
    if (!activeSubject) throw new Error("Your access to this subject has been deactivated.");
    const activeWindow = await db().prepare(`
      SELECT 1 FROM course_access WHERE email = ? AND subject_id = ? AND is_active = 1 AND valid_from <= ? AND valid_until >= ?
      UNION ALL
      SELECT 1 FROM subject_access_keys k JOIN learner_batch_members m ON m.batch_id = k.batch_id
      WHERE m.email = ? AND k.subject_id = ? AND k.is_active = 1 AND k.valid_from <= ? AND k.valid_until >= ?
      LIMIT 1
    `).bind(email, accessSubjectId, now, now, email, accessSubjectId, now, now).first();
    if (!activeWindow) throw new Error("This subject's access window has ended or its common key was invalidated.");
  }
  const profile = await db().prepare("SELECT is_active FROM learner_profiles WHERE email = ?").bind(email).first<Record<string, unknown>>();
  const assigned = await db().prepare("SELECT ls.subject_id FROM learner_subjects ls LEFT JOIN learner_subject_status lss ON lss.email = ls.email AND lss.subject_id = ls.subject_id WHERE ls.email = ? AND COALESCE(lss.is_active, 1) = 1").bind(email).all();
  const assignedIds = (assigned.results ?? []).map(row).map((r) => String(r.subject_id));
  const subjectIds = accessSubjectId ? assignedIds.filter((subjectId) => subjectId === accessSubjectId) : assignedIds;
  const restricted = Boolean(profile); // uploaded learners see only explicitly assigned subjects
  if (profile && !Boolean(profile.is_active)) throw new Error("Your learner account has been deactivated.");
  const placeholders = subjectIds.length ? subjectIds.map(() => "?").join(",") : "''";
  const [subjects, contents, questions] = await Promise.all([
    db().prepare(`SELECT id, title, description, color FROM subjects WHERE is_active = 1 ${restricted ? `AND id IN (${placeholders})` : ""} ORDER BY title`).bind(...(restricted ? subjectIds : [])).all(),
    db().prepare(`SELECT id, subject_id, title, body FROM learning_contents ${restricted ? `WHERE subject_id IN (${placeholders})` : ""} ORDER BY created_at`).bind(...(restricted ? subjectIds : [])).all(),
    db().prepare(`SELECT id, subject_id, content_id, prompt, answer, why, keywords, difficulty FROM managed_questions WHERE is_active = 1 ${restricted ? `AND subject_id IN (${placeholders})` : ""} ORDER BY created_at`).bind(...(restricted ? subjectIds : [])).all(),
  ]);
  return {
    restricted, subjectIds,
    subjects: (subjects.results ?? []).map(row).map((r) => ({ id: String(r.id), title: String(r.title), description: String(r.description), color: String(r.color) })),
    contents: (contents.results ?? []).map(row).map((r) => ({ id: String(r.id), subjectId: String(r.subject_id), title: String(r.title), body: String(r.body) })),
    questions: (questions.results ?? []).map(row).map((r) => ({ id: String(r.id), subjectId: String(r.subject_id), contentId: r.content_id ? String(r.content_id) : null, prompt: String(r.prompt), answer: String(r.answer), why: String(r.why), keywords: readKeywords(String(r.keywords)), difficulty: validDifficulty(String(r.difficulty)) })),
  };
}

export async function isActiveLearner(emailValue: string) {
  const email = normalizeEmail(emailValue);
  const profile = await db().prepare("SELECT is_active FROM learner_profiles WHERE email = ?").bind(email).first<Record<string, unknown>>();
  return profile ? Boolean(profile.is_active) : false;
}

export async function verifyAccessCode(emailValue: string, code: string) {
  const email = normalizeEmail(emailValue);
  const now = new Date().toISOString();
  return db().prepare(`
    SELECT subject_id FROM course_access WHERE email = ? AND access_code = ? AND is_active = 1 AND valid_from <= ? AND valid_until >= ?
    UNION ALL
    SELECT k.subject_id FROM subject_access_keys k JOIN learner_batch_members m ON m.batch_id = k.batch_id
    JOIN learner_subjects ls ON ls.email = m.email AND ls.subject_id = k.subject_id
    LEFT JOIN learner_subject_status lss ON lss.email = m.email AND lss.subject_id = k.subject_id
    WHERE m.email = ? AND k.access_code = ? AND k.is_active = 1 AND COALESCE(lss.is_active, 1) = 1 AND k.valid_from <= ? AND k.valid_until >= ?
    LIMIT 1
  `).bind(email, code, now, now, email, code, now, now).first();
}

export async function adminPasswordMatches(emailValue: string, password: string) {
  const account = await db().prepare("SELECT password_hash, is_active FROM admin_accounts WHERE email = ?").bind(normalizeEmail(emailValue)).first<Record<string, unknown>>();
  return Boolean(account && account.is_active && (await passwordHash(password)) === String(account.password_hash));
}

export async function passwordHash(password: string) {
  const bytes = new TextEncoder().encode(`arena-admin:v1:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((value) => value.toString(16).padStart(2, "0")).join("");
}

function readKeywords(value: string): string[][] { try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed.filter(Array.isArray).map((group) => group.map(String)) : []; } catch { return []; } }
function validDifficulty(value: string): ClassroomQuestion["difficulty"] { return value === "Foundation" || value === "Challenge" ? value : "Applied"; }
