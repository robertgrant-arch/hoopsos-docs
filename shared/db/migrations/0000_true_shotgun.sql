CREATE TYPE "public"."analysis_job_kind" AS ENUM('ingest', 'transcode', 'shot_chart', 'play_breakdown', 'player_tracking', 'highlight_reel', 'scouting_report');--> statement-breakpoint
CREATE TYPE "public"."analysis_job_status" AS ENUM('queued', 'running', 'succeeded', 'failed', 'cancelled', 'retrying');--> statement-breakpoint
CREATE TYPE "public"."annotation_kind" AS ENUM('note', 'tag', 'play', 'possession', 'shot', 'foul', 'highlight');--> statement-breakpoint
CREATE TYPE "public"."annotation_source" AS ENUM('coach', 'ai', 'player', 'import');--> statement-breakpoint
CREATE TYPE "public"."film_asset_kind" AS ENUM('source', 'hls', 'mp4_720p', 'mp4_1080p', 'thumbnail', 'sprite', 'caption');--> statement-breakpoint
CREATE TYPE "public"."film_asset_status" AS ENUM('pending', 'uploading', 'stored', 'transcoding', 'ready', 'failed');--> statement-breakpoint
CREATE TYPE "public"."film_session_kind" AS ENUM('game', 'practice', 'scrimmage', 'workout', 'scout', 'other');--> statement-breakpoint
CREATE TYPE "public"."film_session_status" AS ENUM('draft', 'uploading', 'queued', 'processing', 'ready', 'failed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."org_plan" AS ENUM('free', 'team', 'club', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."org_role" AS ENUM('owner', 'admin', 'coach', 'analyst', 'player', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('trialing', 'active', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'paused');--> statement-breakpoint
CREATE TYPE "public"."player_status" AS ENUM('active', 'injured', 'suspended', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."attendance_status" AS ENUM('present', 'absent', 'late', 'excused');--> statement-breakpoint
CREATE TYPE "public"."availability_response" AS ENUM('yes', 'no', 'maybe');--> statement-breakpoint
CREATE TYPE "public"."event_status" AS ENUM('scheduled', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('practice', 'game', 'scrimmage', 'film_session', 'optional', 'tournament', 'team_meal');--> statement-breakpoint
CREATE TYPE "public"."assignment_status" AS ENUM('draft', 'assigned', 'in_progress', 'submitted', 'reviewed', 'overdue');--> statement-breakpoint
CREATE TYPE "public"."practice_plan_status" AS ENUM('draft', 'published', 'completed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."idp_status" AS ENUM('active', 'paused', 'completed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."audience_mode" AS ENUM('players', 'parents', 'both', 'individuals');--> statement-breakpoint
CREATE TYPE "public"."delivery_status" AS ENUM('pending', 'sent', 'delivered', 'failed', 'opted_out');--> statement-breakpoint
CREATE TYPE "public"."recipient_type" AS ENUM('player', 'guardian');--> statement-breakpoint
CREATE TYPE "public"."thread_type" AS ENUM('broadcast', 'dm', 'parent_dm', 'staff');--> statement-breakpoint
CREATE TYPE "public"."wearable_connection_status" AS ENUM('connected', 'disconnected', 'error', 'pending');--> statement-breakpoint
CREATE TYPE "public"."wearable_provider" AS ENUM('apple_health', 'whoop', 'garmin', 'oura');--> statement-breakpoint
CREATE TABLE "org_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"role" "org_role" DEFAULT 'viewer' NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "orgs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"plan" "org_plan" DEFAULT 'free' NOT NULL,
	"stripe_customer_id" text,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "film_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"created_by_user_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"kind" "film_session_kind" DEFAULT 'game' NOT NULL,
	"status" "film_session_status" DEFAULT 'draft' NOT NULL,
	"opponent" text,
	"home_away" text,
	"season" text,
	"played_at" timestamp with time zone,
	"duration_seconds" integer,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "film_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"kind" "film_asset_kind" NOT NULL,
	"status" "film_asset_status" DEFAULT 'pending' NOT NULL,
	"storage_provider" text,
	"storage_bucket" text,
	"storage_key" text,
	"provider_id" text,
	"playback_id" text,
	"mime_type" text,
	"size_bytes" bigint,
	"duration_seconds" integer,
	"width" integer,
	"height" integer,
	"checksum_sha256" text,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "analysis_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"kind" "analysis_job_kind" NOT NULL,
	"status" "analysis_job_status" DEFAULT 'queued' NOT NULL,
	"inngest_run_id" text,
	"inngest_event_id" text,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 5 NOT NULL,
	"last_error" text,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"result" jsonb,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "annotations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"job_id" uuid,
	"kind" "annotation_kind" NOT NULL,
	"source" "annotation_source" DEFAULT 'coach' NOT NULL,
	"author_user_id" text,
	"start_ms" integer NOT NULL,
	"end_ms" integer,
	"label" text,
	"body" text,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"user_id" text,
	"name" text NOT NULL,
	"position" text,
	"jersey_number" integer,
	"grade" text,
	"grad_year" integer,
	"height" text,
	"weight" integer,
	"handedness" text DEFAULT 'right',
	"status" "player_status" DEFAULT 'active' NOT NULL,
	"role" text DEFAULT 'player',
	"parent_guardian_name" text,
	"parent_guardian_email" text,
	"parent_guardian_phone" text,
	"medical_notes" text,
	"created_by_user_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "event_attendance" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"player_id" text NOT NULL,
	"org_id" text NOT NULL,
	"status" "attendance_status" NOT NULL,
	"note" text,
	"recorded_by_user_id" text NOT NULL,
	"recorded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_availability" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"player_id" text NOT NULL,
	"org_id" text NOT NULL,
	"response" "availability_response" NOT NULL,
	"note" text,
	"responded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"title" text NOT NULL,
	"type" "event_type" DEFAULT 'practice' NOT NULL,
	"status" "event_status" DEFAULT 'scheduled' NOT NULL,
	"starts_at" timestamp NOT NULL,
	"ends_at" timestamp,
	"location" text,
	"home_away" text,
	"opponent" text,
	"notes" text,
	"availability_deadline" timestamp,
	"film_session_id" text,
	"practice_plan_id" text,
	"created_by_user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "assignments" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" "assignment_status" DEFAULT 'assigned' NOT NULL,
	"due_at" timestamp,
	"created_by_user_id" text NOT NULL,
	"player_id" text,
	"film_clip_id" text,
	"practice_plan_id" text,
	"idp_focus_area_id" text,
	"submitted_at" timestamp,
	"reviewed_at" timestamp,
	"reviewed_by_user_id" text,
	"payload" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "practice_plans" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"title" text NOT NULL,
	"scheduled_at" timestamp,
	"status" "practice_plan_status" DEFAULT 'draft' NOT NULL,
	"location" text,
	"duration_mins" integer,
	"payload" jsonb,
	"coach_notes" text,
	"post_practice_notes" text,
	"created_by_user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "idps" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"player_id" text NOT NULL,
	"season" text NOT NULL,
	"status" "idp_status" DEFAULT 'active' NOT NULL,
	"coach_id" text NOT NULL,
	"payload" jsonb,
	"ai_recommendations" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "readiness_checkins" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"player_id" text NOT NULL,
	"fatigue" integer NOT NULL,
	"sleep" integer NOT NULL,
	"soreness" integer NOT NULL,
	"mood" integer,
	"note" text,
	"flagged" boolean DEFAULT false NOT NULL,
	"checked_in_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message_recipients" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"thread_id" text NOT NULL,
	"message_id" text NOT NULL,
	"recipient_type" "recipient_type" NOT NULL,
	"player_id" text NOT NULL,
	"guardian_id" text,
	"user_id" text,
	"contact_email" text,
	"contact_phone" text,
	"delivery_status" "delivery_status" DEFAULT 'pending' NOT NULL,
	"read_at" timestamp,
	"sms_delivered_at" timestamp,
	"sms_status" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message_threads" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"type" "thread_type" NOT NULL,
	"audience_mode" "audience_mode",
	"title" text,
	"participant_ids" text[] DEFAULT '{}' NOT NULL,
	"resolved_recipient_count" integer DEFAULT 0 NOT NULL,
	"created_by_user_id" text NOT NULL,
	"last_message_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"thread_id" text NOT NULL,
	"sender_user_id" text NOT NULL,
	"body" text NOT NULL,
	"read_by" text[] DEFAULT '{}' NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "wearable_connections" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"player_id" text NOT NULL,
	"provider" "wearable_provider" NOT NULL,
	"status" "wearable_connection_status" DEFAULT 'pending' NOT NULL,
	"provider_user_id" text,
	"access_token" text,
	"refresh_token" text,
	"token_expires_at" timestamp,
	"last_synced_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "wearable_metrics" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"player_id" text NOT NULL,
	"connection_id" text NOT NULL,
	"provider" text NOT NULL,
	"recorded_date" date NOT NULL,
	"recovery_score" integer,
	"hrv" numeric,
	"resting_hr" integer,
	"sleep_score" integer,
	"sleep_duration_mins" integer,
	"deep_sleep_mins" integer,
	"rem_sleep_mins" integer,
	"strain_score" numeric,
	"steps" integer,
	"active_calories" integer,
	"raw_payload" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "wearable_metrics_player_provider_date_key" UNIQUE("player_id","provider","recorded_date")
);
--> statement-breakpoint
CREATE TABLE "wearable_sharing" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"player_id" text NOT NULL,
	"share_recovery" boolean DEFAULT false NOT NULL,
	"share_sleep" boolean DEFAULT false NOT NULL,
	"share_strain" boolean DEFAULT false NOT NULL,
	"share_heart_rate" boolean DEFAULT false NOT NULL,
	"share_with_coaches" boolean DEFAULT false NOT NULL,
	"share_with_team" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "wearable_sharing_org_player_key" UNIQUE("org_id","player_id")
);
--> statement-breakpoint
ALTER TABLE "org_members" ADD CONSTRAINT "org_members_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "film_sessions" ADD CONSTRAINT "film_sessions_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "film_assets" ADD CONSTRAINT "film_assets_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "film_assets" ADD CONSTRAINT "film_assets_session_id_film_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."film_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analysis_jobs" ADD CONSTRAINT "analysis_jobs_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analysis_jobs" ADD CONSTRAINT "analysis_jobs_session_id_film_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."film_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "annotations" ADD CONSTRAINT "annotations_org_id_orgs_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."orgs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "annotations" ADD CONSTRAINT "annotations_session_id_film_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."film_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "annotations" ADD CONSTRAINT "annotations_job_id_analysis_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."analysis_jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "org_members_org_user_unique" ON "org_members" USING btree ("org_id","user_id");--> statement-breakpoint
CREATE INDEX "org_members_user_idx" ON "org_members" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "orgs_slug_unique" ON "orgs" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "film_sessions_org_idx" ON "film_sessions" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "film_sessions_org_status_idx" ON "film_sessions" USING btree ("org_id","status");--> statement-breakpoint
CREATE INDEX "film_sessions_org_played_at_idx" ON "film_sessions" USING btree ("org_id","played_at");--> statement-breakpoint
CREATE INDEX "film_assets_session_idx" ON "film_assets" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "film_assets_session_kind_idx" ON "film_assets" USING btree ("session_id","kind");--> statement-breakpoint
CREATE INDEX "film_assets_org_status_idx" ON "film_assets" USING btree ("org_id","status");--> statement-breakpoint
CREATE INDEX "analysis_jobs_session_idx" ON "analysis_jobs" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "analysis_jobs_session_kind_idx" ON "analysis_jobs" USING btree ("session_id","kind");--> statement-breakpoint
CREATE INDEX "analysis_jobs_org_status_idx" ON "analysis_jobs" USING btree ("org_id","status");--> statement-breakpoint
CREATE INDEX "annotations_session_idx" ON "annotations" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "annotations_session_time_idx" ON "annotations" USING btree ("session_id","start_ms");--> statement-breakpoint
CREATE INDEX "annotations_session_kind_idx" ON "annotations" USING btree ("session_id","kind");