# Accident register API

`GET /api/accident-register?carrier_id=<uuid>&as_of=YYYY-MM-DD` returns authorized carrier accident rows normalized to the §390.15(b)(1) register fields plus a three-year retention indicator. Missing location, driver, injury, fatality, tow-away, or hazardous-material evidence remains visibly missing or unknown.
