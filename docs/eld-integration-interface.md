# ELD Integration Interface

X3 Compass HOS depends on ingesting RODS data from each carrier's ELD. The architecture is provider-pluggable: every supported ELD implements the same `EldProvider` interface so the HOS page renders identically regardless of vendor.

## Shape

```ts
interface EldProvider {
  vendor: 'motive' | 'samsara' | 'keeptruckin' | 'geotab' | 'eroad' | 'garmin' | 'custom';
  connect(carrier_id: string, credentials: Record<string,string>): Promise<{ ok: boolean; error?: string }>;
  syncLogs(carrier_id: string, range: { start: string; end: string }): Promise<{ logs: number; errors: number }>;
  disconnect(carrier_id: string): Promise<void>;
  normalizeStatusChanges(raw: unknown[]): Array<{ ts: string; status: 'driving'|'on_duty'|'off_duty'|'sleeper'|'pc'|'ym' }>;
}
```

## Roadmap

- v1 (post-launch): Motive + Samsara — ~60% of small-fleet US ELDs
- v2: KeepTruckin (Motive owns it), Geotab
- v3: EROAD, Garmin, plus generic CSV upload fallback

## Where the code goes

- Provider implementations: `functions/api/eld/<provider>/`
- Shared types + dispatch: `functions/_shared/eld.ts`
- Carrier provider config: `compass_carriers.eld_provider` + a new `compass_eld_credentials` table (RLS owner-only)
- Sync schedule: GitHub Actions hourly cron, or Cloudflare Workers Cron when we move HOS to a Worker

## What blocks each one

| Vendor | Blocker |
|---|---|
| Motive | Partner API approval — 1-2 days |
| Samsara | Partner API approval |
| Geotab | MyGeotab API open, per-customer DB credentials needed |
| EROAD | API documented, free sign-up |
| Garmin | Telematics API paywall + commercial agreement |
| Custom CSV | Just need upload form + parser — could ship in a day |

For Year-1 launch, **custom CSV upload** is the realistic path. Endpoint stubbed at `POST /api/hos/upload-csv` (not yet implemented).
