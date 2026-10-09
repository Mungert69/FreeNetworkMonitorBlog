#!/usr/bin/env python3
"""Read-only Search Console and public-page snapshot. Dependencies: requests, PyJWT[crypto]."""
import argparse, concurrent.futures, csv, datetime as dt, html, json, re, subprocess, time
from pathlib import Path
from urllib.parse import quote
import jwt
import requests

ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--credentials',default=str(ROOT.parent/'securefiles/google-service-account.json'))
parser.add_argument('--output',type=Path,default=ROOT/'docs/baselines'/dt.date.today().isoformat())
args=parser.parse_args();args.output.mkdir(parents=True,exist_ok=True)
if (args.output/'search-console.json').exists(): raise SystemExit('Snapshot already exists; use a new output directory.')
account=json.loads(Path(args.credentials).read_text());now=int(time.time())
assert account['token_uri']=='https://oauth2.googleapis.com/token'
claim={'iss':account['client_email'],'scope':'https://www.googleapis.com/auth/webmasters.readonly','aud':account['token_uri'],'iat':now,'exp':now+3600}
token=requests.post(account['token_uri'],data={'grant_type':'urn:ietf:params:oauth:grant-type:jwt-bearer','assertion':jwt.encode(claim,account['private_key'],algorithm='RS256')},timeout=30)
token.raise_for_status();headers={'Authorization':'Bearer '+token.json()['access_token']}
site='sc-domain:readyforquantum.com';endpoint='https://searchconsole.googleapis.com/webmasters/v3/sites/'+quote(site,safe='')
def query(start,end,dimensions=()):
 body={'startDate':str(start),'endDate':str(end),'type':'web','dataState':'final','dimensions':list(dimensions),'rowLimit':25000,'aggregationType':'auto' if 'page' in dimensions else 'byProperty'}
 rows=[];aggregation=None
 while True:
  body['startRow']=len(rows)
  r=requests.post(endpoint+'/searchAnalytics/query',headers=headers,json=body,timeout=45);r.raise_for_status();data=r.json();chunk=data.get('rows',[])
  rows.extend(chunk);aggregation=data.get('responseAggregationType');
  if len(chunk)<25000:break
 return {'request':body,'rows':rows,'responseAggregationType':aggregation}

today=dt.date.today();recent=query(today-dt.timedelta(days=14),today,['date'])
if not recent['rows']:raise SystemExit('No final Search Console dates available.')
end=dt.date.fromisoformat(max(r['keys'][0] for r in recent['rows']))
tasks={}
for name,days in [('28d',28),('90d',90),('365d',365)]:
 start=end-dt.timedelta(days=days-1)
 for dimensions in [(),('date',),('page',),('query',),('device',),('country',)]:
  suffix='totals' if not dimensions else dimensions[0]
  tasks[f'{name}-{suffix}']=(start,end,dimensions)
for name,days in [('previous-28d',28),('previous-90d',90)]:
 prior_end=end-dt.timedelta(days=days);tasks[f'{name}-totals']=(prior_end-dt.timedelta(days=days-1),prior_end,())
performance={}
def capture(item):
 name,params=item;return name,query(*params)
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
 for name,data in executor.map(capture,tasks.items()):
  performance[name]=data
  with (args.output/(name+'.csv')).open('w',newline='') as f:
   dims=data['request']['dimensions'];writer=csv.writer(f);writer.writerow([*dims,'clicks','impressions','ctr','average_position'])
   for row in data['rows']:writer.writerow([*row.get('keys',[]),row['clicks'],row['impressions'],row['ctr'],row['position']])

urls=[
 'https://readyforquantum.com/','https://readyforquantum.com/features','https://readyforquantum.com/docs/getting-started','https://readyforquantum.com/docs/quantum',
 'https://blog.readyforquantum.com/','https://blog.readyforquantum.com/categories/',
 'https://blog.readyforquantum.com/categories/post-quantum-security/',
 'https://blog.readyforquantum.com/posts/automatingnmapscanswithaiastepbystepguide/',
 'https://blog.readyforquantum.com/posts/nmapvs.zenmapchoosingtherightnetworkmappingtool/',
 'https://blog.readyforquantum.com/posts/howtoperformquantumsafecheckswiththeassistant/',
]
def inspect(url):
 r=requests.post('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect',headers=headers,json={'inspectionUrl':url,'siteUrl':site,'languageCode':'en-US'},timeout=45)
 return url,{'http_status':r.status_code,'response':r.json()}
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:inspections=dict(executor.map(inspect,urls))
r=requests.get(endpoint+'/sitemaps',headers=headers,timeout=30);r.raise_for_status();sitemaps=r.json()

def public_page(url):
 started=time.perf_counter();r=requests.get(url,timeout=30);elapsed=time.perf_counter()-started
 result={'status':r.status_code,'final_url':r.url,'fetch_seconds':round(elapsed,3),'html_bytes':len(r.content),'headers':{k:v for k,v in r.headers.items() if k.lower() in ['last-modified','cache-control','cf-cache-status','age','etag','content-type']}}
 for field,pattern in [('title',r'<title[^>]*>(.*?)</title>'),('canonical',r'<link[^>]*rel="canonical"[^>]*href="([^"]+)"'),('description',r'<meta[^>]*name="description"[^>]*content="([^"]+)"')]:
  m=re.search(pattern,r.text,re.S|re.I);result[field]=html.unescape(m.group(1)) if m else None
 result['noindex']=bool(re.search(r'<meta[^>]*name="robots"[^>]*content="[^"]*noindex',r.text,re.I))
 result['json_ld_blocks']=len(re.findall('application/ld\\+json',r.text))
 m=re.search(r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>',r.text)
 if m:
  d=json.loads(m.group(1));result['next_build_id']=d.get('buildId');props=d.get('props',{}).get('pageProps',{})
  if 'categories' in props:result['category_count']=len(props['categories'])
 return url,result
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:public_pages=dict(executor.map(public_page,urls))
live_sitemaps={}
for host in ['readyforquantum.com','blog.readyforquantum.com']:
 r=requests.get('https://'+host+'/sitemap.xml',timeout=30);r.raise_for_status();locations=re.findall(r'<loc>(.*?)</loc>',r.text)
 live_sitemaps[host]={'url':r.url,'urls':locations,'total':len(locations),'posts':sum('/posts/' in u for u in locations),'categories':sum('/categories/' in u for u in locations)}
commits={}
for name in ['FreeNetworkMonitor','FreeNetworkMonitorBlog']:
 p=ROOT.parent/name;commits[name]={'commit':subprocess.check_output(['git','-C',str(p),'rev-parse','HEAD'],text=True).strip(),'version':json.loads((p/'package.json').read_text())['version']}
snapshot={'captured_utc':dt.datetime.now(dt.timezone.utc).isoformat(),'property':site,'search_type':'web','latest_final_search_date':str(end),'date_timezone':'Pacific Time (Search Console API)','repository_versions':commits,'performance':performance,'url_inspections':inspections,'submitted_sitemaps':sitemaps,'live_sitemaps':live_sitemaps,'public_pages':public_pages}
(args.output/'search-console.json').write_text(json.dumps(snapshot,indent=2)+'\n')
report=['# Search performance baseline',f'\nCaptured {snapshot["captured_utc"]}. Final Web Search data ends {end}. This traffic predates the 6 October deployment.\n',
 '| Window | Clicks | Impressions | CTR | Average position |','|---|---:|---:|---:|---:|']
for name in ['28d','previous-28d','90d','previous-90d','365d']:
 rows=performance[name+'-totals']['rows'];x=rows[0] if rows else {'clicks':0,'impressions':0,'ctr':0,'position':0};report.append(f'| {name} | {x["clicks"]:.0f} | {x["impressions"]:.0f} | {x["ctr"]*100:.2f}% | {x["position"]:.2f} |')
report+=['\n## Leading pages — last 90 days\n','| Page | Clicks | Impressions | CTR | Average position |','|---|---:|---:|---:|---:|']
groups={}
for x in performance['90d-page']['rows']:
 u=x['keys'][0].rstrip('/');a=groups.setdefault(u,{'clicks':0,'impressions':0,'weighted_position':0});a['clicks']+=x['clicks'];a['impressions']+=x['impressions'];a['weighted_position']+=x['position']*x['impressions']
for u,x in sorted(groups.items(),key=lambda kv:kv[1]['clicks'],reverse=True)[:15]:
 report.append(f'| {u} | {x["clicks"]:.0f} | {x["impressions"]:.0f} | {x["clicks"]/x["impressions"]*100:.2f}% | {x["weighted_position"]/x["impressions"]:.2f} |')
report+=['\n## Google URL inspection samples\n','| URL | Verdict | Coverage | Last crawl | Google canonical |','|---|---|---|---|---|']
for u,x in inspections.items():
 d=x['response'].get('inspectionResult',{}).get('indexStatusResult',{});report.append(f'| {u} | {d.get("verdict",x["http_status"])} | {d.get("coverageState","Unavailable")} | {d.get("lastCrawlTime","—")} | {d.get("googleCanonical","—")} |')
report+=['\n## Live sitemap and deployment state\n']
for host,x in live_sitemaps.items():report.append(f'- {host}: {x["total"]} sitemap URLs, including {x["posts"]} post URLs and {x["categories"]} topic archives.')
for u,x in public_pages.items():
 if 'category_count' in x:report.append(f'- {u}: {x["category_count"]} categories; Next build `{x.get("next_build_id")}`; last modified `{x["headers"].get("Last-Modified", "unknown")}`.')
report+=['\n## Interpretation and repeat procedure\n',
 'Use matching 28-day windows for short-term comparisons and 90 days for more stable trends. Compare clicks, impressions, CTR, queries, devices and the same URLs. Check seasonal changes before attributing changes to the deployment.',
 '\nProperty totals and page-group totals use different aggregation methods and should not be added together. Query-level rows can omit anonymized searches; the API returns its available top rows, not a complete analytics event log. Slash/no-slash variants are combined only in the overview table; raw rows remain in JSON and CSV.',
 '\nURL inspections describe Google’s stored indexed version, not a live indexing test. The API does not expose the full Page Indexing report or total crawled-but-not-indexed counts; these samples and submitted sitemap status are the API-accessible baseline.',
 '\nRepeat from the blog repo with `python3 scripts/capture-search-baseline.py`. Dependencies: `requests` and `PyJWT[crypto]`; credentials default to `../securefiles/google-service-account.json`. Use `--output PATH` to save another snapshot without overwriting this one. No private key or access token is saved.',
 '\nSources: [Search Analytics API](https://developers.google.com/webmaster-tools/v1/searchanalytics/query), [URL Inspection API](https://developers.google.com/webmaster-tools/v1/urlInspection.index/inspect).']
(args.output/'search-console.md').write_text('\n'.join(report)+'\n')
print('Saved baseline to',args.output)
for name in ['28d','90d','365d']:print(name,performance[name+'-totals']['rows'])
for u,x in inspections.items():
 d=x['response'].get('inspectionResult',{}).get('indexStatusResult',{});print(u,d.get('verdict',x['http_status']),d.get('coverageState'))
