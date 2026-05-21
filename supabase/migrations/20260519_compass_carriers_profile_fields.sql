-- Sprint #21: align compass_carriers with X3 Fleet Safety classic settings page.
-- Adds DBA, FMCSA operation_type, carrier_category, fleet_size buckets to support
-- the 3-tab Settings (Profile · Team · Billing) layout users are familiar with.

ALTER TABLE compass_carriers
  ADD COLUMN IF NOT EXISTS dba              TEXT,
  ADD COLUMN IF NOT EXISTS operation_type   TEXT CHECK (operation_type IN ('interstate','intrastate','both') OR operation_type IS NULL),
  ADD COLUMN IF NOT EXISTS carrier_category TEXT CHECK (carrier_category IN ('property','passenger','hazmat','other') OR carrier_category IS NULL),
  ADD COLUMN IF NOT EXISTS fleet_size       TEXT CHECK (fleet_size IN ('1-5','6-20','21-50','51-100','101-500','500+') OR fleet_size IS NULL);

COMMENT ON COLUMN compass_carriers.dba              IS 'Doing-Business-As name shown publicly';
COMMENT ON COLUMN compass_carriers.operation_type   IS 'FMCSA registration scope: interstate / intrastate / both';
COMMENT ON COLUMN compass_carriers.carrier_category IS 'For interstate carriers: property/passenger/hazmat';
COMMENT ON COLUMN compass_carriers.fleet_size       IS 'Coarse fleet size bucket for billing/onboarding';
