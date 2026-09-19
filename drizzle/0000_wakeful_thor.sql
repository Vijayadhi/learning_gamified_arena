CREATE TABLE `attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`question_id` text NOT NULL,
	`topic_id` text NOT NULL,
	`source` text NOT NULL,
	`answer` text NOT NULL,
	`score` integer NOT NULL,
	`matched_count` integer NOT NULL,
	`total_count` integer NOT NULL,
	`confidence` integer DEFAULT 3 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_attempts_user_created` ON `attempts` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_attempts_topic` ON `attempts` (`topic_id`);--> statement-breakpoint
CREATE TABLE `daily_activity` (
	`user_id` text NOT NULL,
	`activity_date` text NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`best_score` integer DEFAULT 0 NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`user_id`, `activity_date`)
);
--> statement-breakpoint
CREATE INDEX `idx_daily_activity_user_date` ON `daily_activity` (`user_id`,`activity_date`);--> statement-breakpoint
CREATE TABLE `question_progress` (
	`user_id` text NOT NULL,
	`question_id` text NOT NULL,
	`topic_id` text NOT NULL,
	`best_score` integer DEFAULT 0 NOT NULL,
	`attempt_count` integer DEFAULT 0 NOT NULL,
	`cleared_at` text,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`user_id`, `question_id`)
);
--> statement-breakpoint
CREATE INDEX `idx_question_progress_user` ON `question_progress` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_question_progress_topic` ON `question_progress` (`user_id`,`topic_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`display_name` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`last_seen_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_users_email` ON `users` (`email`);