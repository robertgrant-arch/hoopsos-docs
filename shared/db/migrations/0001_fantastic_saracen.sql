CREATE TYPE "public"."player_note_type" AS ENUM('coach', 'academic', 'health', 'behavioral', 'recruiting', 'general');--> statement-breakpoint
CREATE TYPE "public"."injury_status" AS ENUM('active', 'monitoring', 'cleared');--> statement-breakpoint
CREATE TABLE "player_notes" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"player_id" text NOT NULL,
	"note_type" "player_note_type" DEFAULT 'coach' NOT NULL,
	"body" text NOT NULL,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"created_by_user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "skill_assessments" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"player_id" text NOT NULL,
	"assessed_by_user_id" text NOT NULL,
	"season" text,
	"category" text NOT NULL,
	"sub_skill" text NOT NULL,
	"score" integer NOT NULL,
	"notes" text,
	"assessed_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "injury_records" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"player_id" text NOT NULL,
	"description" text NOT NULL,
	"body_part" text,
	"status" "injury_status" DEFAULT 'active' NOT NULL,
	"restrictions" text,
	"injured_at" timestamp NOT NULL,
	"expected_return_at" timestamp,
	"cleared_at" timestamp,
	"clearance_notes" text,
	"created_by_user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "bio" text;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "recruiting_status" text;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "academic_notes" text;--> statement-breakpoint
ALTER TABLE "players" ADD COLUMN "years_playing" integer;