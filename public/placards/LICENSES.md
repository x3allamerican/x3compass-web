# X3 Compass — Placard Asset Licenses

All 40 placard images in this directory were sourced from
[Wikimedia Commons](https://commons.wikimedia.org/) on 2026-05-17.

## DOT hazmat placards (`class-*.svg`, `radioactive-*.svg`, `fuel-oil.svg`, `oxygen.svg`, `gasoline.svg`, `inhalation-hazard-*.svg`, `dangerous.svg`)

These images depict regulatory signs prescribed in **49 CFR § 172** (US DOT
Pipeline & Hazardous Materials Safety Administration). They are works of the
US federal government and are in the **public domain** in the United States
under [17 USC § 105](https://www.law.cornell.edu/uscode/text/17/105).

Wikimedia Commons file metadata uses the `PD-US-GOV` or
`PD-US-no notice` template for each.

## GHS pictograms (`ghs-*.svg`)

The nine UN Globally Harmonized System pictograms. Released by their authors
on Wikimedia Commons under the **PD-self / CC0** license — public domain
worldwide.

## NFPA 704 diamond template (`nfpa-704-template.svg`)

The NFPA 704 fire-diamond *shape* (4 colored quadrants, no specific numbers)
is released as **PD-self** on Wikimedia Commons. The numeric ratings overlaid
on top are dictated by NFPA 704 standard; the shape itself is not protected.

---

## Attribution

While these works are public domain and require no attribution, Compass
provides full source URLs in `manifest.json` per Wikimedia Commons' best
practices and to make verification easy for any auditor or contributor.

User-Agent used at download time:
```
X3CompassHazmatLibrary/1.0 (joshua@x3compass.com)
```

## How to update

To re-pull any placard with the latest Wikimedia version, see
`scripts/refresh-placards.py` (if not present, the original downloader is at
`/tmp/dl_placards.py` from the May 17 2026 build run).
