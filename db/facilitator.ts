import { env } from "cloudflare:workers";

export type FacilitatorDashboard = {
  totals: { learners: number; attempts: number; cleared: number; averageScore: number };
  learners: Array<{
    id: string; email: string; displayName: string; attempts: number; cleared: number;
    averageScore: number; lastAttemptAt: string | null; lastSeenAt: string;
  }>;
  recentAttempts: Array<{
    id: string; userId: string; email: string; displayName: string; questionId: string;
    topicId: string; source: string; answer: string; score: number; confidence: number; createdAt: string;
  }>;
  topicStats: Array<{ topicId: string; attempts: number; learners: number; averageScore: number }>;
};

function database() {
  if (!env.DB) throw new Error("Learning database is not available.");
  return env.DB;
}

export async function getFacilitatorDashboard(): Promise<FacilitatorDashboard> {
  const db = database();
  const [learnersResult, attemptsResult, topicsResult, totalsResult] = await Promise.all([
    db.prepare(`
      SELECT u.id, u.email, u.display_name, u.last_seen_at,
        COALESCE(a.attempts, 0) AS attempts,
        COALESCE(a.average_score, 0) AS average_score,
        a.last_attempt_at,
        COALESCE(p.cleared, 0) AS cleared
      FROM users u
      LEFT JOIN (
        SELECT user_id, COUNT(*) AS attempts, AVG(score) AS average_score, MAX(created_at) AS last_attempt_at
        FROM attempts GROUP BY user_id
      ) a ON a.user_id = u.id
      LEFT JOIN (
        SELECT user_id, COUNT(*) AS cleared FROM question_progress
        WHERE cleared_at IS NOT NULL GROUP BY user_id
      ) p ON p.user_id = u.id
      ORDER BY COALESCE(a.last_attempt_at, u.last_seen_at) DESC
    `).all(),
    db.prepare(`
      SELECT a.id, a.user_id, u.email, u.display_name, a.question_id, a.topic_id,
        a.source, a.answer, a.score, a.confidence, a.created_at
      FROM attempts a JOIN users u ON u.id = a.user_id
      ORDER BY a.created_at DESC LIMIT 150
    `).all(),
    db.prepare(`
      SELECT topic_id, COUNT(*) AS attempts, COUNT(DISTINCT user_id) AS learners,
        COALESCE(AVG(score), 0) AS average_score
      FROM attempts GROUP BY topic_id ORDER BY attempts DESC
    `).all(),
    db.prepare(`
      SELECT
        (SELECT COUNT(*) FROM users) AS learners,
        (SELECT COUNT(*) FROM attempts) AS attempts,
        (SELECT COUNT(*) FROM question_progress WHERE cleared_at IS NOT NULL) AS cleared,
        (SELECT COALESCE(AVG(score), 0) FROM attempts) AS average_score
    `).all(),
  ]);

  const learners = (learnersResult.results ?? []) as Array<Record<string, unknown>>;
  const attempts = (attemptsResult.results ?? []) as Array<Record<string, unknown>>;
  const topics = (topicsResult.results ?? []) as Array<Record<string, unknown>>;
  const totals = ((totalsResult.results ?? [])[0] ?? {}) as Record<string, unknown>;
  return {
    totals: {
      learners: Number(totals.learners ?? 0), attempts: Number(totals.attempts ?? 0),
      cleared: Number(totals.cleared ?? 0), averageScore: Math.round(Number(totals.average_score ?? 0)),
    },
    learners: learners.map((row) => ({
      id: String(row.id), email: String(row.email), displayName: String(row.display_name),
      attempts: Number(row.attempts), cleared: Number(row.cleared),
      averageScore: Math.round(Number(row.average_score)),
      lastAttemptAt: row.last_attempt_at ? String(row.last_attempt_at) : null,
      lastSeenAt: String(row.last_seen_at),
    })),
    recentAttempts: attempts.map((row) => ({
      id: String(row.id), userId: String(row.user_id), email: String(row.email),
      displayName: String(row.display_name), questionId: String(row.question_id),
      topicId: String(row.topic_id), source: String(row.source), answer: String(row.answer),
      score: Number(row.score), confidence: Number(row.confidence), createdAt: String(row.created_at),
    })),
    topicStats: topics.map((row) => ({
      topicId: String(row.topic_id), attempts: Number(row.attempts), learners: Number(row.learners),
      averageScore: Math.round(Number(row.average_score)),
    })),
  };
}
