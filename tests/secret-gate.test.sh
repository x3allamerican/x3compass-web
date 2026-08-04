#!/bin/sh
set -eu

repo_root=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
tmp_dir=$(mktemp -d)
trap 'rm -rf "$tmp_dir"' EXIT HUP INT TERM
capture="$tmp_dir/args"

if grep -Eq '^[[:space:]]*schedule:' "$repo_root/.github/workflows/secret-scan.yml"; then
  echo "secret scan must not consume scheduled Actions minutes" >&2
  exit 1
fi

printf '%s\n' '#!/bin/sh' "printf '%s\\n' \"\$*\" > '$capture'" 'exit 0' > "$tmp_dir/gitleaks"
chmod +x "$tmp_dir/gitleaks"

PATH="$tmp_dir:/usr/bin:/bin" "$repo_root/.githooks/pre-commit"
test "$(cat "$capture")" = "git --redact=100 --pre-commit --staged ."

printf '%s\n' '#!/bin/sh' 'exit 23' > "$tmp_dir/gitleaks"
chmod +x "$tmp_dir/gitleaks"

set +e
PATH="$tmp_dir:/usr/bin:/bin" "$repo_root/.githooks/pre-commit"
status=$?
set -e
test "$status" -eq 23

echo "secret gate hook contract: PASS"
