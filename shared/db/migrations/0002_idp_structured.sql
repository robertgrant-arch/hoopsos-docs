CREATE TYPE "public"."idp_focus_area_status" AS ENUM('draft', 'active', 'completed', 'paused');--> statement-breakpoint
CREATE TYPE "public"."idp_comment_type" AS ENUM('weekly_review', 'film_note', 'assessment', 'general');--> statement-breakpoint
CREATE TABLE "idp_focus_areas" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"idp_id" text NOT NULL,
	"player_id" text NOT NULL,
	"priority" integer DEFAULT 1 NOT NULL,
	"category" text NOT NULL,
	"sub_skill" text NOT NULL,
	"emoji" text DEFAULT '🏀',
	"current_score" integer,
	"target_score" integer,
	"deadline" text,
	"status" "idp_focus_area_status" DEFAULT 'active' NOT NULL,
	"coach_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "idp_milestones" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"focus_area_id" text NOT NULL,
	"idp_id" text NOT NULL,
	"title" text NOT NULL,
	"due_date" text,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "idp_drill_links" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"focus_area_id" text NOT NULL,
	"idp_id" text NOT NULL,
	"drill_id" text,
	"drill_title" text NOT NULL,
	"reps" text,
	"frequency" text,
	"is_due_today" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "idp_comments" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"idp_id" text NOT NULL,
	"focus_area_id" text,
	"author_user_id" text NOT NULL,
	"type" "idp_comment_type" DEFAULT 'general' NOT NULL,
	"body" text NOT NULL,
	"linked_film_session_id" text,
	"linked_annotation_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
