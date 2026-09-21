CREATE TABLE IF NOT EXISTS `subject_access_keys` (`id` text PRIMARY KEY NOT NULL, `subject_id` text NOT NULL, `batch_id` text NOT NULL, `access_code` text NOT NULL, `valid_from` text NOT NULL, `valid_until` text NOT NULL, `is_active` integer DEFAULT 1 NOT NULL, `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL);
CREATE UNIQUE INDEX IF NOT EXISTS `idx_subject_access_keys_code` ON `subject_access_keys` (`access_code`);
CREATE INDEX IF NOT EXISTS `idx_subject_access_keys_batch` ON `subject_access_keys` (`batch_id`, `subject_id`);
CREATE TABLE IF NOT EXISTS `learner_subject_status` (`email` text NOT NULL, `subject_id` text NOT NULL, `is_active` integer DEFAULT 1 NOT NULL, `updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL, PRIMARY KEY(`email`, `subject_id`));

INSERT OR IGNORE INTO learner_subject_status (email, subject_id, is_active)
SELECT email, subject_id, 1 FROM learner_subjects;
