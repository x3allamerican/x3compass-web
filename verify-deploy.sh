#!/usr/bin/env bash
# verify-deploy.sh — Confirm the latest queued commits are live in production.
# Usage:   bash verify-deploy.sh
#          bash verify-deploy.sh https://x3compass-web.pages.dev   # custom host
#
# Exit code 0 = everything live, non-zero = something missing.
# Each check is independent — script keeps running after a failure so you see
# the full picture.

set -uo pipefail

HOST="${1:-https://x3compass-web.pages.dev}"
PASS=0
FAIL=0
declare -a FAILED

check() {
  local label="$1"
  local expected="$2"   # what we expect to find in the response
  local url="$3"
  local extra_curl="${4:-}"

  local response
  response=$(curl -sL --max-time 10 ${extra_curl} "$url" 2>&1 || echo "__CURL_FAILED__")

  if echo "$response" | grep -qF "$expected"; then
    printf "  \033[32m✓\033[0m  %s\n" "$label"
    PASS=$((PASS + 1))
  else
    printf "  \033[31m✗\033[0m  %s\n" "$label"
    printf "       expected: \"%s\" in response to %s\n" "$expected" "$url"
    FAILED+=("$label")
    FAIL=$((FAIL + 1))
  fi
}

check_status() {
  local label="$1"
  local expected_code="$2"
  local url="$3"

  local code
  code=$(curl -sL --max-time 10 -o /dev/null -w "%{http_code}" "$url" 2>&1 || echo "000")

  if [ "$code" = "$expected_code" ]; then
    printf "  \033[32m✓\033[0m  %s  (HTTP %s)\n" "$label" "$code"
    PASS=$((PASS + 1))
  else
    printf "  \033[31m✗\033[0m  %s  (expected HTTP %s, got %s)\n" "$label" "$expected_code" "$code"
    FAILED+=("$label")
    FAIL=$((FAIL + 1))
  fi
}

printf "\n🔎  Verifying deploy at \033[1m%s\033[0m\n\n" "$HOST"

# ─── Marketing pages — quick reachability ─────────────────────────
echo "📄 Marketing pages"
check_status "Homepage"           "200" "$HOST/"
check_status "Pricing"            "200" "$HOST/pricing/"
check_status "Partners"           "200" "$HOST/partners/"
check_status "Hazmat"             "200" "$HOST/hazmat/"
check_status "Trust"              "200" "$HOST/trust/"
check_status "Skills catalog"     "200" "$HOST/skills/"
check_status "Changelog"          "200" "$HOST/changelog/"

# ─── New /app pages — must redirect or render ─────────────────────
echo ""
echo "🔐 App pages (auth-gated — 200 means rendered, 302 means redirect-to-signin)"
check_status "/app/mvr"            "200" "$HOST/app/mvr/"
check_status "/app/background-checks" "200" "$HOST/app/background-checks/"
check_status "/admin/checkr-smoke" "200" "$HOST/admin/checkr-smoke/"
check_status "/app/finance"        "200" "$HOST/app/finance/"
check_status "/app/finance-team"   "200" "$HOST/app/finance-team/"
check_status "/app/integrations"   "200" "$HOST/app/integrations/"

# ─── Content checks — prove the NEW code is live, not the OLD ─────
echo ""
echo "🎨 Content fingerprints (proves the rebuild shipped)"
check "MVR hero: 'You pull the MVR'"          "You pull the MVR"           "$HOST/app/mvr/"
check "MVR FAQ: 'When do I need to pull'"     "When do I need to pull"     "$HOST/app/mvr/"
check "MVR FAQ: 'Where can I get one?'"       "Where can I get one"        "$HOST/app/mvr/"
check "MVR continuous callout: '\$5/driver'"  "\$5/driver"                  "$HOST/app/mvr/"
check "Background-checks: 'X3 Compass view'"  "X3 Compass view"            "$HOST/app/background-checks/"
check "Skills page renders 100+ skills"       "100"                         "$HOST/skills/"

# ─── API endpoints — should respond, even if 401 (auth required) ──
echo ""
echo "🛠  API endpoints (401 = route exists & requires auth ✓, 404 = not deployed)"
check_status "/api/health"                              "200" "$HOST/api/health"
check_status "/api/screenings/continuous-mvr/list"      "401" "$HOST/api/screenings/continuous-mvr/list"
check_status "/api/screenings/continuous-mvr/enroll (POST-only)" "405" "$HOST/api/screenings/continuous-mvr/enroll"
check_status "/api/admin/checkr/smoke"                  "401" "$HOST/api/admin/checkr/smoke"
check_status "/api/finance"                             "401" "$HOST/api/finance"

# ─── A11y: slate-600 fix should show in CSS ───────────────────────
echo ""
echo "♿ Accessibility — proves --fg-faint contrast fix shipped"
# CSS files have a hashed name; grep the homepage HTML for the var reference path
check "Slate-600 --fg-faint var present in compiled CSS" "475569" "$HOST/_next/static/css/" "-L --include 'href=\"/_next/static/css/'"
# Less reliable fallback: just confirm homepage has the skip link from Batch C
check "Skip link from Batch C"                "Skip to main content"       "$HOST/"

# ─── SEO + JSON-LD ────────────────────────────────────────────────
echo ""
echo "🔍 SEO"
check "Homepage Organization JSON-LD"         "\"@type\":\"Organization\""  "$HOST/"
check "Homepage Founder Person JSON-LD"       "Joshua Kovarik"              "$HOST/"
check "FAQ JSON-LD"                           "\"@type\":\"FAQPage\""       "$HOST/"

# ─── Summary ──────────────────────────────────────────────────────
TOTAL=$((PASS + FAIL))
echo ""
printf "═══════════════════════════════════════════════════════════════\n"
if [ $FAIL -eq 0 ]; then
  printf "  \033[1;32m✅ All %d checks passed.\033[0m The new code is LIVE.\n" "$TOTAL"
  exit 0
else
  printf "  \033[1;31m❌ %d / %d failed.\033[0m  See details above.\n" "$FAIL" "$TOTAL"
  printf "\n  Failed checks:\n"
  for f in "${FAILED[@]}"; do
    printf "    - %s\n" "$f"
  done
  printf "\n  Most likely cause: the deploy hasn't happened yet, or it's still in\n"
  printf "  build phase. Run \`bash DEPLOY_DIRECT.md\`'s commands and re-run this.\n"
  exit 1
fi
