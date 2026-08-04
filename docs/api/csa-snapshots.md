# CSA snapshots API

`GET /api/csa/snapshots?carrier_id=<uuid>` requires a bearer session and `requireTenant`. It returns only the authorized carrier's chronological `compass_csa_snapshots` rows for the seven BASIC measures. The native CSA page computes display thresholds and trends from those rows. No snapshot means an explicit empty state; no score is synthesized.
