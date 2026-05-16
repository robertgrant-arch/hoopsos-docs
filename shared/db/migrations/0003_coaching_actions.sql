CREATE TYPE "public"."coaching_action_type" AS ENUM('assign_clip', 'recommend_drill', 'add_to_idp', 'request_reupload', 'mark_addressed');--> statement-breakpoint
CREATE TYPE "public"."coaching_action_status" AS ENUM('open', 'in_progress', 'resolved', 'dismissed');--> statement-breakpoint
CREATE TABLE "coaching_actions" (
	"id" text PRIMARY KEY NOT NULL,
	"org_id" text NOT NULL,
	"session_id" text NOT NULL,
	"annotation_id" text,
	"player_id" text,
	"author_user_id" text NOT NULL,
	"issue_category" text,
	"issue_severity" text,
	"timestamp_ms" integer,
	"coach_note" text,
	"action_type" "coaching_action_type" NOT NULL,
	"status" "coaching_action_status" DEFAULT 'open' NOT NULL,
	"assignment_id" text,
	"idp_focus_area_id" text,
	"follow_up_session_id" text,
	"resolved_at" timestamp,
	"resolved_note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "coaching_actions_session_idx" ON "coaching_actions" ("session_id");--> statement-breakpoint
CREATE INDEX "coaching_actions_player_idx" ON "coaching_actions" ("player_id");--> statement-breakpoint
CREATE INDEX "coaching_actions_org_status_idx" ON "coaching_actions" ("org_id", "status");
