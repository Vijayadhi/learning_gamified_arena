import { sql } from "drizzle-orm";
import { index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  displayName: text("display_name").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  lastSeenAt: text("last_seen_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("idx_users_email").on(table.email)]);

/** Classroom administration is separate from the activity `users` table. */
export const subjects = sqliteTable("subjects", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  color: text("color").notNull().default("#65d8b3"),
  isActive: integer("is_active").notNull().default(1),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const learnerProfiles = sqliteTable("learner_profiles", {
  email: text("email").primaryKey(),
  displayName: text("display_name").notNull().default(""),
  isActive: integer("is_active").notNull().default(1),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const learnerSubjects = sqliteTable("learner_subjects", {
  email: text("email").notNull(), subjectId: text("subject_id").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [primaryKey({ columns: [table.email, table.subjectId] })]);

export const learningContents = sqliteTable("learning_contents", {
  id: text("id").primaryKey(), subjectId: text("subject_id").notNull(), title: text("title").notNull(), body: text("body").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const managedQuestions = sqliteTable("managed_questions", {
  id: text("id").primaryKey(), subjectId: text("subject_id").notNull(), contentId: text("content_id"), prompt: text("prompt").notNull(), answer: text("answer").notNull(), why: text("why").notNull().default(""), keywords: text("keywords").notNull().default("[]"), difficulty: text("difficulty").notNull().default("Applied"), isActive: integer("is_active").notNull().default(1),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const courseAccess = sqliteTable("course_access", {
  id: text("id").primaryKey(), subjectId: text("subject_id").notNull(), email: text("email").notNull(), accessCode: text("access_code").notNull(), validFrom: text("valid_from").notNull(), validUntil: text("valid_until").notNull(), isActive: integer("is_active").notNull().default(1),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const adminAccounts = sqliteTable("admin_accounts", {
  email: text("email").primaryKey(), displayName: text("display_name").notNull().default(""), passwordHash: text("password_hash").notNull(), isActive: integer("is_active").notNull().default(1),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const learnerBatches = sqliteTable("learner_batches", {
  id: text("id").primaryKey(), subjectId: text("subject_id").notNull(), name: text("name").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const learnerBatchMembers = sqliteTable("learner_batch_members", {
  batchId: text("batch_id").notNull(), email: text("email").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [primaryKey({ columns: [table.batchId, table.email] })]);

export const subjectAccessKeys = sqliteTable("subject_access_keys", {
  id: text("id").primaryKey(), subjectId: text("subject_id").notNull(), batchId: text("batch_id").notNull(), accessCode: text("access_code").notNull(), validFrom: text("valid_from").notNull(), validUntil: text("valid_until").notNull(), isActive: integer("is_active").notNull().default(1),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const learnerSubjectStatus = sqliteTable("learner_subject_status", {
  email: text("email").notNull(), subjectId: text("subject_id").notNull(), isActive: integer("is_active").notNull().default(1),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [primaryKey({ columns: [table.email, table.subjectId] })]);

export const attempts = sqliteTable("attempts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  questionId: text("question_id").notNull(),
  topicId: text("topic_id").notNull(),
  source: text("source").notNull(),
  answer: text("answer").notNull(),
  score: integer("score").notNull(),
  matchedCount: integer("matched_count").notNull(),
  totalCount: integer("total_count").notNull(),
  confidence: integer("confidence").notNull().default(3),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_attempts_user_created").on(table.userId, table.createdAt),
  index("idx_attempts_topic").on(table.topicId),
]);

export const questionProgress = sqliteTable("question_progress", {
  userId: text("user_id").notNull(),
  questionId: text("question_id").notNull(),
  topicId: text("topic_id").notNull(),
  bestScore: integer("best_score").notNull().default(0),
  attemptCount: integer("attempt_count").notNull().default(0),
  clearedAt: text("cleared_at"),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  primaryKey({ columns: [table.userId, table.questionId] }),
  index("idx_question_progress_user").on(table.userId),
  index("idx_question_progress_topic").on(table.userId, table.topicId),
]);

export const dailyActivity = sqliteTable("daily_activity", {
  userId: text("user_id").notNull(),
  activityDate: text("activity_date").notNull(),
  attempts: integer("attempts").notNull().default(0),
  bestScore: integer("best_score").notNull().default(0),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  primaryKey({ columns: [table.userId, table.activityDate] }),
  index("idx_daily_activity_user_date").on(table.userId, table.activityDate),
]);
