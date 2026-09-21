CREATE TABLE IF NOT EXISTS `learner_batches` (`id` text PRIMARY KEY NOT NULL, `subject_id` text NOT NULL, `name` text NOT NULL, `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL);
CREATE UNIQUE INDEX IF NOT EXISTS `idx_learner_batches_subject_name` ON `learner_batches` (`subject_id`, `name`);
CREATE TABLE IF NOT EXISTS `learner_batch_members` (`batch_id` text NOT NULL, `email` text NOT NULL, `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL, PRIMARY KEY(`batch_id`, `email`));
CREATE INDEX IF NOT EXISTS `idx_learner_batch_members_email` ON `learner_batch_members` (`email`);
CREATE TABLE IF NOT EXISTS `mcq_exams` (`id` text PRIMARY KEY NOT NULL, `subject_id` text NOT NULL, `title` text NOT NULL, `duration_seconds` integer DEFAULT 1800 NOT NULL, `is_active` integer DEFAULT 1 NOT NULL, `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL);
CREATE TABLE IF NOT EXISTS `mcq_questions` (`id` text PRIMARY KEY NOT NULL, `exam_id` text NOT NULL, `question` text NOT NULL, `options` text NOT NULL, `correct_option` integer NOT NULL, `explanation` text DEFAULT '' NOT NULL, `points` integer DEFAULT 1 NOT NULL, `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL);
CREATE INDEX IF NOT EXISTS `idx_mcq_questions_exam` ON `mcq_questions` (`exam_id`);
CREATE TABLE IF NOT EXISTS `mcq_exam_batches` (`exam_id` text NOT NULL, `batch_id` text NOT NULL, PRIMARY KEY(`exam_id`, `batch_id`));
CREATE TABLE IF NOT EXISTS `mcq_attempts` (`id` text PRIMARY KEY NOT NULL, `exam_id` text NOT NULL, `email` text NOT NULL, `started_at` text NOT NULL, `completed_at` text, `score` integer DEFAULT 0 NOT NULL, `total_points` integer DEFAULT 0 NOT NULL, `duration_seconds` integer DEFAULT 0 NOT NULL);
CREATE UNIQUE INDEX IF NOT EXISTS `idx_mcq_attempts_exam_email` ON `mcq_attempts` (`exam_id`, `email`);
CREATE TABLE IF NOT EXISTS `mcq_answers` (`attempt_id` text NOT NULL, `question_id` text NOT NULL, `selected_option` integer NOT NULL, `is_correct` integer NOT NULL, PRIMARY KEY(`attempt_id`, `question_id`));

INSERT OR IGNORE INTO subjects (id, title, description, color, is_active) VALUES ('ai-services', 'AI Services', 'AI Services learning materials and assessments', '#65d8b3', 1);
INSERT OR IGNORE INTO learner_subjects (email, subject_id)
SELECT email, 'ai-services'
FROM learner_profiles
WHERE is_active = 1
  AND NOT EXISTS (SELECT 1 FROM learner_subjects WHERE learner_subjects.email = learner_profiles.email);
