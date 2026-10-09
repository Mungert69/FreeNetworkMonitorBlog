#!/usr/bin/env bash
# Public, logged-out pages only. Sequential audits avoid competing for CPU.
set -Eeuo pipefail
OUT="${1:-$HOME/site-performance-baseline-$(date -u +%Y-%m-%d)}"
mkdir -p "$OUT"
export CHROME_PATH="${CHROME_PATH:-/usr/bin/chromium}"
{
  date -u
  uname -a
  "$CHROME_PATH" --version
  node --version
  lscpu
} > "$OUT/environment.txt"
while IFS='|' read -r name url; do
  for device in mobile desktop; do
    report="$OUT/$name-$device"
    [[ ! -e "$report.report.json" ]] || { echo "Report already exists: $report.report.json" >&2; exit 1; }
    args=()
    [[ "$device" != desktop ]] || args+=(--preset=desktop)
    echo "Auditing $name ($device): $url"
    if timeout 180s npx --yes lighthouse@13.5.0 "$url" \
      --only-categories=performance,accessibility,best-practices,seo \
      --output=json --output=html --output-path="$report" \
      --chrome-flags='--headless --no-sandbox --disable-dev-shm-usage' \
      "${args[@]}" > "$report.log" 2>&1; then
      echo "Saved $report.report.json and .html"
    else
      echo "Audit failed: see $report.log" >&2
      exit 1
    fi
  done
done <<'URLS'
main-home|https://readyforquantum.com/
blog-home|https://blog.readyforquantum.com/
blog-categories|https://blog.readyforquantum.com/categories/
blog-ai-nmap|https://blog.readyforquantum.com/posts/automatingnmapscanswithaiastepbystepguide/
blog-nmap-zenmap|https://blog.readyforquantum.com/posts/nmapvs.zenmapchoosingtherightnetworkmappingtool/
URLS
