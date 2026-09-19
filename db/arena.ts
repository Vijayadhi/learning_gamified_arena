import { env } from "cloudflare:workers";
import { QUESTIONS } from "@/lib/content";

export type DashboardData = {
  totalAttempts: number;
  clearedQuestions: number;
  clearedQuestionIds: string[];
  averageScore: number;
  xp: number;
  streak: number;
  lastActiveDate: string | null;
  topicStats: Array<{ topicId: string; attempts: number; cleared: number; average: number; total: number }>;
  recentAttempts: Array<{ id: string; questionId: string; answer: string; score: number; confidence: number; createdAt: string }>;
  cohort: { learners: number; attempts: number; averageScore: number };
  activity: Array<{ date: string; attempts: number; bestScore: number }>;
};

export type ArenaUser = { userId: string; email: string; displayName: string };

function database() {
  if (!env.DB) throw new Error("Learning database is not available.");
  return env.DB;
}

export async function ensureUser(user: ArenaUser) {
  const db = database();
  await db.prepare(`
    INSERT INTO users (id, email, display_name, created_at, last_seen_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      email = excluded.email,
      display_name = excluded.display_name,
      last_seen_at = CURRENT_TIMESTAMP
  `).bind(user.userId, user.email, user.displayName).run();
}

export async function recordAttempt(input: {
  user: ArenaUser;
  questionId: string;
  topicId: string;
  source: string;
  answer: string;
  score: number;
  matchedCount: number;
  totalCount: number;
  confidence: number;
  localDate: string;
}) {
  const db = database();
  const id = crypto.randomUUID();
  const clearedAt = input.score >= 70 ? new Date().toISOString() : null;
  await db.batch([
    db.prepare(`
      INSERT INTO users (id, email, display_name, created_at, last_seen_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET email = excluded.email, display_name = excluded.display_name, last_seen_at = CURRENT_TIMESTAMP
    `).bind(input.user.userId, input.user.email, input.user.displayName),
    db.prepare(`
      INSERT INTO attempts (id, user_id, question_id, topic_id, source, answer, score, matched_count, total_count, confidence, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(id, input.user.userId, input.questionId, input.topicId, input.source, input.answer, input.score, input.matchedCount, input.totalCount, input.confidence),
    db.prepare(`
      INSERT INTO question_progress (user_id, question_id, topic_id, best_score, attempt_count, cleared_at, updated_at)
      VALUES (?, ?, ?, ?, 1, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id, question_id) DO UPDATE SET
        best_score = MAX(best_score, excluded.best_score),
        attempt_count = attempt_count + 1,
        cleared_at = CASE WHEN cleared_at IS NOT NULL THEN cleared_at ELSE excluded.cleared_at END,
        updated_at = CURRENT_TIMESTAMP
    `).bind(input.user.userId, input.questionId, input.topicId, input.score, clearedAt),
    db.prepare(`
      INSERT INTO daily_activity (user_id, activity_date, attempts, best_score, updated_at)
      VALUES (?, ?, 1, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id, activity_date) DO UPDATE SET
        attempts = attempts + 1,
        best_score = MAX(best_score, excluded.best_score),
        updated_at = CURRENT_TIMESTAMP
    `).bind(input.user.userId, input.localDate, input.score),
  ]);
  return id;
}

function calculateStreak(dates: string[]) {
  if (!dates.length) return 0;
  const unique = [...new Set(dates)].sort().reverse();
  let streak = 1;
  let cursor = new Date(`${unique[0]}T00:00:00Z`);
  for (let index = 1; index < unique.length; index += 1) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
    if (unique[index] === cursor.toISOString().slice(0, 10)) streak += 1;
    else break;
  }
  return streak;
}

export async function getDashboard(userId: string): Promise<DashboardData> {
  const db = database();
  const [attemptResult, progressResult, activityResult, cohortResult, totalsResult] = await Promise.all([
    db.prepare(`SELECT id, question_id, answer, score, confidence, created_at FROM attempts WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`).bind(userId).all(),
    db.prepare(`SELECT question_id, topic_id, best_score, attempt_count, cleared_at FROM question_progress WHERE user_id = ?`).bind(userId).all(),
    db.prepare(`SELECT activity_date, attempts, best_score FROM daily_activity WHERE user_id = ? ORDER BY activity_date DESC LIMIT 60`).bind(userId).all(),
    db.prepare(`SELECT COUNT(DISTINCT user_id) AS learners, COUNT(*) AS attempts, COALESCE(AVG(score), 0) AS average_score FROM attempts`).all(),
    db.prepare(`SELECT COUNT(*) AS attempts, COALESCE(SUM(score), 0) AS score_sum FROM attempts WHERE user_id = ?`).bind(userId).all(),
  ]);

  const attempts = (attemptResult.results ?? []) as Array<Record<string, unknown>>;
  const progress = (progressResult.results ?? []) as Array<Record<string, unknown>>;
  const activityRows = (activityResult.results ?? []) as Array<Record<string, unknown>>;
  const cohortRow = ((cohortResult.results ?? [])[0] ?? {}) as Record<string, unknown>;
  const totalsRow = ((totalsResult.results ?? [])[0] ?? {}) as Record<string, unknown>;
  const totalAttempts = progress.reduce((sum, row) => sum + Number(row.attempt_count ?? 0), 0);
  const clearedQuestions = progress.filter((row) => row.cleared_at).length;
  const bestScores = progress.map((row) => Number(row.best_score ?? 0));
  const averageScore = bestScores.length ? Math.round(bestScores.reduce((sum, score) => sum + score, 0) / bestScores.length) : 0;
  const xp = Number(totalsRow.score_sum ?? 0) + clearedQuestions * 50;
  const topicIds = [...new Set(QUESTIONS.map((question) => question.topicId))];
  const topicStats = topicIds.map((topicId) => {
    const rows = progress.filter((row) => row.topic_id === topicId);
    const total = QUESTIONS.filter((question) => question.topicId === topicId).length;
    return {
      topicId,
      attempts: rows.reduce((sum, row) => sum + Number(row.attempt_count ?? 0), 0),
      cleared: rows.filter((row) => row.cleared_at).length,
      average: rows.length ? Math.round(rows.reduce((sum, row) => sum + Number(row.best_score ?? 0), 0) / rows.length) : 0,
      total,
    };
  });
  const activity = activityRows.map((row) => ({ date: String(row.activity_date), attempts: Number(row.attempts), bestScore: Number(row.best_score) }));

  return {
    totalAttempts,
    clearedQuestions,
    clearedQuestionIds: progress.filter((row) => row.cleared_at).map((row) => String(row.question_id)),
    averageScore,
    xp,
    streak: calculateStreak(activity.map((row) => row.date)),
    lastActiveDate: activity[0]?.date ?? null,
    topicStats,
    recentAttempts: attempts.map((row) => ({ id: String(row.id), questionId: String(row.question_id), answer: String(row.answer), score: Number(row.score), confidence: Number(row.confidence), createdAt: String(row.created_at) })),
    cohort: { learners: Number(cohortRow.learners ?? 0), attempts: Number(cohortRow.attempts ?? 0), averageScore: Math.round(Number(cohortRow.average_score ?? 0)) },
    activity,
  };
}

export function emptyDashboard(): DashboardData {
  return { totalAttempts: 0, clearedQuestions: 0, clearedQuestionIds: [], averageScore: 0, xp: 0, streak: 0, lastActiveDate: null, topicStats: [...new Set(QUESTIONS.map((q) => q.topicId))].map((topicId) => ({ topicId, attempts: 0, cleared: 0, average: 0, total: QUESTIONS.filter((q) => q.topicId === topicId).length })), recentAttempts: [], cohort: { learners: 0, attempts: 0, averageScore: 0 }, activity: [] };
}
