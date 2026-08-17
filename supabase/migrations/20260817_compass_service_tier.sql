-- Keep onboarding/webhook Compass provisioning aligned with the application contract.
ALTER TABLE public.compass_carriers
  DROP CONSTRAINT IF EXISTS carriers_service_tier_check;

ALTER TABLE public.compass_carriers
  ADD CONSTRAINT carriers_service_tier_check
  CHECK (service_tier IN ('diy', 'dfy', 'enterprise', 'trial', 'compass'));
