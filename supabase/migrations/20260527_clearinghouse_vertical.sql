-- ============================================================
-- X3 Compass · FMCSA Clearinghouse Vertical · Phase 1 MVP
-- ------------------------------------------------------------
-- Created: 2026-05-27
-- Task: #240 (Clearinghouse vertical · competitive scan + build plan)
-- Memo: /clearinghouse-vertical-memo.md
--
-- Three new tables for query orchestration, violation tracking,
-- and consent capture per 49 CFR Part 382 Subpart G. Plus two
-- Stripe price-book entries for $1.25 pass-through pricing.
--
-- Apply via Supabase dashboard SQL editor OR `supabase db push`.
-- Demo data fallback in /src/lib/demoFallback.ts covers the UI
-- before this migration runs, so the page works regardless.
-- ============================================================

-- ============================================================
-- TABLE 1: compass_clearinghouse_queries
-- One row per query (limited, full pre-employment, full triggered).
-- ============================================================
CREATE TABLE IF NOT EXISTS public.compass_clearinghouse_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  carrier_id uuid NOT NULL REFERENCES public.carriers(id) ON DELETE CASCADE,
  driver_id uuid NOT NULL REFERENCES public.compass_drivers(id) ON DELETE CASCADE,

  -- pre_employment_full: required before hiring CDL driver (consent needed)
  -- annual_limited: required once per year on every employed CDL driver (no consent)
  -- triggered_full: required within 24h of limited query returning 'information' (consent needed)
  query_type text NOT NULL CHECK (query_type IN ('pre_employment_full', 'annual_limited', 'triggered_full')),

  -- Consent ledger (NULL for annual_limited which doesn't require driver consent)
  consent_received_at timestamptz,
  consent_method text CHECK (consent_method IN ('electronic_signature', 'wet_signature', 'fmcsa_portal_self_consent')),

  -- Query execution
  query_run_at timestamptz NOT NULL DEFAULT now(),
  query_run_by uuid REFERENCES auth.users(id),
  fmcsa_query_id text,                -- Reference number from FMCSA Clearinghouse portal
  result text CHECK (result IN ('information', 'no_information', 'pending', 'error')),
  full_record jsonb,                   -- Raw response payload for audit retention (49 CFR §382.711)

  -- Billing
  stripe_charge_id text,
  cost_cents integer DEFAULT 125,      -- $1.25 pass-through per query (FMCSA flat rate)

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clearinghouse_queries_carrier ON public.compass_clearinghouse_queries(carrier_id);
CREATE INDEX IF NOT EXISTS idx_clearinghouse_queries_driver ON public.compass_clearinghouse_queries(driver_id);
CREATE INDEX IF NOT EXISTS idx_clearinghouse_queries_run_at ON public.compass_clearinghouse_queries(query_run_at DESC);
CREATE INDEX IF NOT EXISTS idx_clearinghouse_queries_type ON public.compass_clearinghouse_queries(query_type);


-- ============================================================
-- TABLE 2: compass_clearinghouse_violations
-- Driver D&A violations on record with FMCSA.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.compass_clearinghouse_violations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  carrier_id uuid NOT NULL REFERENCES public.carriers(id) ON DELETE CASCADE,
  driver_id uuid NOT NULL REFERENCES public.compass_drivers(id) ON DELETE CASCADE,

  -- Per 49 CFR §382.601 + .703
  violation_type text NOT NULL CHECK (violation_type IN (
    'positive_drug_test',
    'positive_alcohol_test',
    'test_refusal',
    'actual_knowledge',
    'pre_employment_positive'
  )),
  violation_date date NOT NULL,

  -- Reporting attribution
  reported_by text NOT NULL CHECK (reported_by IN ('carrier', 'mro', 'sap', 'service_agent')),
  reported_at timestamptz NOT NULL DEFAULT now(),
  reported_by_user uuid REFERENCES auth.users(id),

  -- Prohibited status — driver cannot operate CMV until cleared
  prohibited_status_active boolean NOT NULL DEFAULT true,

  -- Return-to-duty workflow (49 CFR §382.605 / §40 Subpart O)
  sap_evaluation_complete boolean DEFAULT false,
  sap_evaluation_date date,
  return_to_duty_complete boolean DEFAULT false,
  return_to_duty_date date,
  follow_up_schedule jsonb,            -- Array of {due_date, completed_date, result}

  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clearinghouse_violations_carrier ON public.compass_clearinghouse_violations(carrier_id);
CREATE INDEX IF NOT EXISTS idx_clearinghouse_violations_driver ON public.compass_clearinghouse_violations(driver_id);
CREATE INDEX IF NOT EXISTS idx_clearinghouse_violations_prohibited ON public.compass_clearinghouse_violations(prohibited_status_active) WHERE prohibited_status_active = true;


-- ============================================================
-- TABLE 3: compass_clearinghouse_consents
-- Driver electronic consents for pre-employment and triggered-24hr queries.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.compass_clearinghouse_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  carrier_id uuid NOT NULL REFERENCES public.carriers(id) ON DELETE CASCADE,
  driver_id uuid NOT NULL REFERENCES public.compass_drivers(id) ON DELETE CASCADE,

  consent_type text NOT NULL CHECK (consent_type IN ('pre_employment', 'triggered_24hr')),
  consent_requested_at timestamptz NOT NULL DEFAULT now(),
  consent_requested_by uuid REFERENCES auth.users(id),

  -- 24-hour countdown for triggered consents (limited returned 'information')
  consent_deadline_at timestamptz,

  -- Driver response
  consent_received_at timestamptz,
  consent_method text CHECK (consent_method IN ('electronic_signature', 'wet_signature', 'fmcsa_portal_self_consent')),
  signature_ip inet,
  signature_user_agent text,

  -- Revocation / expiry
  consent_expires_at timestamptz,
  consent_revoked_at timestamptz,
  revocation_reason text,

  -- Link to the query that was eventually run
  query_id uuid REFERENCES public.compass_clearinghouse_queries(id) ON DELETE SET NULL,

  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clearinghouse_consents_carrier ON public.compass_clearinghouse_consents(carrier_id);
CREATE INDEX IF NOT EXISTS idx_clearinghouse_consents_driver ON public.compass_clearinghouse_consents(driver_id);
CREATE INDEX IF NOT EXISTS idx_clearinghouse_consents_pending ON public.compass_clearinghouse_consents(consent_deadline_at) WHERE consent_received_at IS NULL;


-- ============================================================
-- ROW LEVEL SECURITY
-- Standard tenant isolation: carrier sees only their own rows.
-- ============================================================
ALTER TABLE public.compass_clearinghouse_queries     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compass_clearinghouse_violations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compass_clearinghouse_consents    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_queries" ON public.compass_clearinghouse_queries
  FOR ALL TO authenticated
  USING (carrier_id IN (SELECT carrier_id FROM public.carrier_members WHERE user_id = auth.uid()))
  WITH CHECK (carrier_id IN (SELECT carrier_id FROM public.carrier_members WHERE user_id = auth.uid()));

CREATE POLICY "tenant_isolation_violations" ON public.compass_clearinghouse_violations
  FOR ALL TO authenticated
  USING (carrier_id IN (SELECT carrier_id FROM public.carrier_members WHERE user_id = auth.uid()))
  WITH CHECK (carrier_id IN (SELECT carrier_id FROM public.carrier_members WHERE user_id = auth.uid()));

CREATE POLICY "tenant_isolation_consents" ON public.compass_clearinghouse_consents
  FOR ALL TO authenticated
  USING (carrier_id IN (SELECT carrier_id FROM public.carrier_members WHERE user_id = auth.uid()))
  WITH CHECK (carrier_id IN (SELECT carrier_id FROM public.carrier_members WHERE user_id = auth.uid()));


-- ============================================================
-- STRIPE PRICE BOOK ENTRIES
-- Pass-through pricing matches FMCSA exactly · no X3 markup.
-- ============================================================
INSERT INTO public.services_price_book (service_code, name, description, stripe_price_id, cost_cents, currency)
VALUES
  ('clearinghouse_limited_query',
   'FMCSA Clearinghouse · Limited Query',
   'Annual limited query per 49 CFR §382.701(b). Returns yes/no on whether driver has Clearinghouse information. No driver consent required.',
   NULL,  -- Joshua wires the real Stripe price ID after creating the product
   125,   -- $1.25 in cents
   'usd'),
  ('clearinghouse_full_query',
   'FMCSA Clearinghouse · Full Query',
   'Pre-employment OR triggered-from-limited full query per 49 CFR §382.701(a). Returns full Clearinghouse record. Driver electronic consent required.',
   NULL,  -- Joshua wires the real Stripe price ID after creating the product
   125,   -- $1.25 in cents
   'usd')
ON CONFLICT (service_code) DO NOTHING;


-- ============================================================
-- updated_at TRIGGER on the two mutable tables
-- ============================================================
CREATE OR REPLACE FUNCTION public.tg_clearinghouse_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_queries_updated_at
  BEFORE UPDATE ON public.compass_clearinghouse_queries
  FOR EACH ROW EXECUTE FUNCTION public.tg_clearinghouse_updated_at();

CREATE TRIGGER trg_violations_updated_at
  BEFORE UPDATE ON public.compass_clearinghouse_violations
  FOR EACH ROW EXECUTE FUNCTION public.tg_clearinghouse_updated_at();


-- ============================================================
-- DONE. Verify:
--   SELECT COUNT(*) FROM compass_clearinghouse_queries;
--   SELECT COUNT(*) FROM compass_clearinghouse_violations;
--   SELECT COUNT(*) FROM compass_clearinghouse_consents;
--   SELECT service_code FROM services_price_book WHERE service_code LIKE 'clearinghouse%';
-- ============================================================
