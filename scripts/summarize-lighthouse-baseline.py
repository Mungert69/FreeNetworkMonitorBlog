#!/usr/bin/env python3
"""Summarize retained Lighthouse reports without altering the raw reports."""
import argparse
import csv
import json
from pathlib import Path

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('reports', type=Path)
parser.add_argument('output', type=Path)
args = parser.parse_args()
args.output.mkdir(parents=True, exist_ok=True)
if (args.output / 'lighthouse.json').exists():
    parser.error('Output already contains lighthouse.json; choose a new snapshot directory.')
runs = []
metrics = {'fcp_ms': 'first-contentful-paint', 'lcp_ms': 'largest-contentful-paint',
           'tbt_ms': 'total-blocking-time', 'cls': 'cumulative-layout-shift',
           'bytes': 'total-byte-weight', 'speed_index_ms': 'speed-index'}
for path in sorted(args.reports.glob('*.report.json')):
    report = json.loads(path.read_text())
    row = {'report': str(path.resolve()), 'url': report['requestedUrl'],
           'profile': report['configSettings']['formFactor'], 'fetchTime': report['fetchTime'],
           'lighthouseVersion': report['lighthouseVersion'],
           'runtimeError': report.get('runtimeError'), 'runWarnings': report.get('runWarnings', []),
           'environment': report.get('environment'), 'configSettings': report['configSettings']}
    row['scores'] = {key: round(value['score'] * 100) if value.get('score') is not None else None
                     for key, value in report['categories'].items()}
    row['metrics'] = {key: report['audits'].get(audit, {}).get('numericValue')
                      for key, audit in metrics.items()}
    row['failed_audits'] = [{'id': key, 'title': value['title'], 'score': value['score'],
                             'displayValue': value.get('displayValue')}
                            for key, value in report['audits'].items()
                            if value.get('score') is not None and value['score'] < 1
                            and value.get('scoreDisplayMode') not in ('manual', 'notApplicable')]
    runs.append(row)
if not runs:
    parser.error('No Lighthouse reports found.')
(args.output / 'lighthouse.json').write_text(json.dumps(runs, indent=2) + '\n')
with (args.output / 'lighthouse.csv').open('w', newline='') as handle:
    fields = ['url', 'profile', 'performance', 'accessibility', 'best-practices', 'seo', *metrics]
    writer = csv.DictWriter(handle, fieldnames=fields)
    writer.writeheader()
    for row in runs:
        writer.writerow({'url': row['url'], 'profile': row['profile'], **row['scores'], **row['metrics']})
lines = ['# Lighthouse baseline', '',
         'Five public pages, each tested once on mobile and desktop using Lighthouse 13.5.0.', '',
         '| Page | Profile | Performance | LCP (s) | CLS | Blocking (ms) | Payload (KiB) |',
         '|---|---|---:|---:|---:|---:|---:|']
for row in runs:
    m = row['metrics']
    lines.append(f"| {row['url']} | {row['profile']} | {row['scores']['performance']} | {m['lcp_ms']/1000:.2f} | {m['cls']:.3f} | {m['tbt_ms']:.0f} | {m['bytes']/1024:.0f} |")
lines += ['', '| Page | Profile | Accessibility | Best practices | SEO |', '|---|---|---:|---:|---:|']
for row in runs:
    s = row['scores']
    lines.append(f"| {row['url']} | {row['profile']} | {s['accessibility']} | {s['best-practices']} | {s['seo']} |")
lines += ['', '## Interpretation and reproduction', '',
          'These are lab measurements, not real-user Core Web Vitals or ranking scores. Tests use a logged-out browser with the initial cookie interface. Mobile uses default simulated throttling; desktop uses the desktop preset. Audits run sequentially to avoid CPU contention. Environment details are retained in environment.txt and every raw report.', '',
          'There is one run per page/profile. Repeat on the same machine and pinned Lighthouse version; use the median of at least three runs before interpreting small differences. Inspect raw reports for warnings and failed audits. Search rankings also depend on content, competition and crawl timing.', '',
          'From the blog repo, with Node/npm and Chromium available:', '',
          '```bash', 'scripts/capture-lighthouse-baseline.sh /path/to/new-reports',
          'python3 scripts/summarize-lighthouse-baseline.py /path/to/new-reports /path/to/new-snapshot', '```', '',
          '## Full reports', '']
for row in runs:
    html = Path(row['report']).with_suffix('.html')
    lines.append(f"- [{html.name}]({html})")
lines += ['', 'Source: [Lighthouse CLI documentation](https://github.com/GoogleChrome/lighthouse#using-the-node-cli).', '']
(args.output / 'lighthouse.md').write_text('\n'.join(lines))
print(json.dumps([{'url': r['url'], 'profile': r['profile'], 'scores': r['scores'], 'runtimeError': r['runtimeError']} for r in runs], indent=2))
