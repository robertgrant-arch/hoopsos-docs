-- Migration: 0012_club_ops
-- Adds the club/program operations layer:
--   seasons, teams, team_roster,
--   membership_plans, registrations,
--   invoices, invoice_items, payments, payment_plans

-- ── Enums ─────────────────────────────────────────────────────────────────────

CREATE TYPE IF NOT EXISTS season_status AS ENUM (
  'draft', 'open', 'active', 'completed', 'archived'
);

CREATE TYPE IF NOT EXISTS team_age_group AS ENUM (
  'u8','u10','u12','u13','u14','u15','u16','u17',
  'u18','varsity','jv','freshman','adult','other'
);

CREATE TYPE IF NOT EXISTS team_gender AS ENUM (
  'boys','girls','co_ed','open'
);

CREATE TYPE IF NOT EXISTS team_roster_status AS ENUM (
  'active','inactive','tryout','suspended'
);

CREATE TYPE IF NOT EXISTS plan_type AS ENUM (
  'season','monthly','annual','drop_in','tournament','custom'
);

CREATE TYPE IF NOT EXISTS plan_status AS ENUM (
  'draft','active','archived'
);

CREATE TYPE IF NOT EXISTS registration_status AS ENUM (
  'pending','waitlisted','accepted','active','cancelled','denied','incomplete'
);

CREATE TYPE IF NOT EXISTS invoice_status AS ENUM (
  'draft','open','paid','partial','overdue','void','refunded','write_off'
);

CREATE TYPE IF NOT EXISTS payment_method AS ENUM (
  'stripe_card','stripe_ach','cash','check','zelle','venmo','paypal','other'
);

CREATE TYPE IF NOT EXISTS payment_status AS ENUM (
  'pending','succeeded','failed','refunded','disputed'
);

CREATE TYPE IF NOT EXISTS invoice_item_type AS ENUM (
  'membership','registration','tournament','camp','uniform',
  'insurance','late_fee','discount','credit','other'
);

CREATE TYPE IF NOT EXISTS payment_plan_status AS ENUM (
  'active','completed','defaulted','cancelled'
);

-- ── Seasons ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS seasons (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                  UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  name                    TEXT NOT NULL,
  slug                    TEXT NOT NULL,
  status                  season_status NOT NULL DEFAULT 'draft',
  description             TEXT,
  starts_at               TIMESTAMPTZ,
  ends_at                 TIMESTAMPTZ,
  registration_opens_at   TIMESTAMPTZ,
  registration_closes_at  TIMESTAMPTZ,
  max_roster              INT,
  created_by_user_id      TEXT NOT NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS seasons_org_idx ON seasons (org_id);
CREATE UNIQUE INDEX IF NOT EXISTS seasons_org_slug_unique ON seasons (org_id, slug)
  WHERE deleted_at IS NULL;

-- ── Teams ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS teams (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                    UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  season_id                 UUID REFERENCES seasons(id) ON DELETE SET NULL,
  name                      TEXT NOT NULL,
  slug                      TEXT NOT NULL,
  age_group                 team_age_group NOT NULL DEFAULT 'other',
  gender                    team_gender NOT NULL DEFAULT 'boys',
  head_coach_user_id        TEXT,
  assistant_coach_user_ids  TEXT[] NOT NULL DEFAULT '{}',
  color_primary             TEXT,
  color_secondary           TEXT,
  logo_url                  TEXT,
  is_active                 BOOLEAN NOT NULL DEFAULT TRUE,
  created_by_user_id        TEXT NOT NULL,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at                TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS teams_org_idx ON teams (org_id);
CREATE INDEX IF NOT EXISTS teams_season_idx ON teams (season_id);
CREATE UNIQUE INDEX IF NOT EXISTS teams_org_slug_unique ON teams (org_id, slug)
  WHERE deleted_at IS NULL;

-- ── Team Roster ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS team_roster (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id          UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  org_id           UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  player_id        UUID NOT NULL,
  jersey_number    TEXT,
  status           team_roster_status NOT NULL DEFAULT 'active',
  added_by_user_id TEXT NOT NULL,
  added_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  removed_at       TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS team_roster_team_idx ON team_roster (team_id);
CREATE INDEX IF NOT EXISTS team_roster_player_idx ON team_roster (player_id);
CREATE UNIQUE INDEX IF NOT EXISTS team_roster_team_player_unique
  ON team_roster (team_id, player_id)
  WHERE removed_at IS NULL;

-- ── Membership Plans ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS membership_plans (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                  UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  season_id               UUID REFERENCES seasons(id) ON DELETE SET NULL,
  name                    TEXT NOT NULL,
  description             TEXT,
  type                    plan_type NOT NULL DEFAULT 'season',
  status                  plan_status NOT NULL DEFAULT 'draft',
  price_amount            INT NOT NULL,
  billing_cycles          INT,
  allows_payment_plan     BOOLEAN NOT NULL DEFAULT FALSE,
  installment_count       INT,
  deposit_amount          INT NOT NULL DEFAULT 0,
  early_bird_amount       INT,
  early_bird_deadline     TIMESTAMPTZ,
  sibling_discount_amount INT,
  team_ids                UUID[],
  included_fees           JSONB NOT NULL DEFAULT '[]',
  max_enrollment          INT,
  stripe_price_id         TEXT,
  created_by_user_id      TEXT NOT NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS membership_plans_org_idx ON membership_plans (org_id);
CREATE INDEX IF NOT EXISTS membership_plans_season_idx ON membership_plans (season_id);

-- ── Registrations ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS registrations (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  season_id             UUID REFERENCES seasons(id) ON DELETE SET NULL,
  plan_id               UUID REFERENCES membership_plans(id) ON DELETE SET NULL,
  team_id               UUID REFERENCES teams(id) ON DELETE SET NULL,
  player_id             UUID NOT NULL,
  submitted_by_user_id  TEXT NOT NULL,
  status                registration_status NOT NULL DEFAULT 'pending',
  effective_amount      INT NOT NULL DEFAULT 0,
  discount_amount       INT NOT NULL DEFAULT 0,
  discount_reason       TEXT,
  admin_notes           TEXT,
  submitted_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at           TIMESTAMPTZ,
  accepted_by_user_id   TEXT,
  cancelled_at          TIMESTAMPTZ,
  cancelled_by_user_id  TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS registrations_org_idx ON registrations (org_id);
CREATE INDEX IF NOT EXISTS registrations_season_idx ON registrations (season_id);
CREATE INDEX IF NOT EXISTS registrations_player_idx ON registrations (player_id);
CREATE INDEX IF NOT EXISTS registrations_status_idx ON registrations (status);
CREATE UNIQUE INDEX IF NOT EXISTS registrations_player_plan_unique
  ON registrations (player_id, plan_id)
  WHERE plan_id IS NOT NULL
    AND status NOT IN ('cancelled', 'denied');

-- ── Invoices ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS invoices (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  season_id             UUID REFERENCES seasons(id) ON DELETE SET NULL,
  registration_id       UUID REFERENCES registrations(id) ON DELETE SET NULL,
  player_id             UUID NOT NULL,
  guardian_user_id      TEXT,
  invoice_number        TEXT NOT NULL,
  status                invoice_status NOT NULL DEFAULT 'draft',
  subtotal              INT NOT NULL DEFAULT 0,
  discount_amount       INT NOT NULL DEFAULT 0,
  tax_amount            INT NOT NULL DEFAULT 0,
  total_amount          INT NOT NULL DEFAULT 0,
  amount_paid           INT NOT NULL DEFAULT 0,
  amount_due            INT NOT NULL DEFAULT 0,
  due_date              TIMESTAMPTZ,
  issued_at             TIMESTAMPTZ,
  paid_at               TIMESTAMPTZ,
  memo                  TEXT,
  admin_notes           TEXT,
  stripe_invoice_id     TEXT,
  stripe_customer_id    TEXT,
  payment_plan_id       UUID,
  installment_number    INT,
  created_by_user_id    TEXT NOT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS invoices_org_idx ON invoices (org_id);
CREATE INDEX IF NOT EXISTS invoices_player_idx ON invoices (player_id);
CREATE INDEX IF NOT EXISTS invoices_season_idx ON invoices (season_id);
CREATE INDEX IF NOT EXISTS invoices_status_idx ON invoices (status);
CREATE INDEX IF NOT EXISTS invoices_due_date_idx ON invoices (due_date);
CREATE INDEX IF NOT EXISTS invoices_stripe_idx ON invoices (stripe_invoice_id)
  WHERE stripe_invoice_id IS NOT NULL;

-- ── Invoice Items ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS invoice_items (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id           UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  org_id               UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  type                 invoice_item_type NOT NULL DEFAULT 'membership',
  description          TEXT NOT NULL,
  quantity             INT NOT NULL DEFAULT 1,
  unit_amount          INT NOT NULL,
  total_amount         INT NOT NULL,
  membership_plan_id   UUID,
  event_id             UUID,
  sort_order           INT NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS invoice_items_invoice_idx ON invoice_items (invoice_id);
CREATE INDEX IF NOT EXISTS invoice_items_org_idx ON invoice_items (org_id);

-- ── Payments ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS payments (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                    UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  invoice_id                UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  player_id                 UUID NOT NULL,
  guardian_user_id          TEXT,
  amount                    INT NOT NULL,
  method                    payment_method NOT NULL,
  status                    payment_status NOT NULL DEFAULT 'pending',
  stripe_payment_intent_id  TEXT,
  stripe_charge_id          TEXT,
  reference_note            TEXT,
  recorded_by_user_id       TEXT,
  paid_at                   TIMESTAMPTZ,
  failed_at                 TIMESTAMPTZ,
  failure_reason            TEXT,
  metadata                  JSONB NOT NULL DEFAULT '{}',
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payments_org_idx ON payments (org_id);
CREATE INDEX IF NOT EXISTS payments_invoice_idx ON payments (invoice_id);
CREATE INDEX IF NOT EXISTS payments_player_idx ON payments (player_id);
CREATE INDEX IF NOT EXISTS payments_stripe_pi_idx ON payments (stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;

-- ── Payment Plans ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS payment_plans (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  registration_id     UUID REFERENCES registrations(id) ON DELETE SET NULL,
  player_id           UUID NOT NULL,
  total_amount        INT NOT NULL,
  installment_count   INT NOT NULL,
  status              payment_plan_status NOT NULL DEFAULT 'active',
  deposit_amount      INT NOT NULL DEFAULT 0,
  schedule            JSONB NOT NULL DEFAULT '[]',
  created_by_user_id  TEXT NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payment_plans_org_idx ON payment_plans (org_id);
CREATE INDEX IF NOT EXISTS payment_plans_player_idx ON payment_plans (player_id);
CREATE INDEX IF NOT EXISTS payment_plans_registration_idx ON payment_plans (registration_id);
