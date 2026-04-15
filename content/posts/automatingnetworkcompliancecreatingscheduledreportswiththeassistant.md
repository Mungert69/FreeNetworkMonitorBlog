---
title: Automating Network Compliance Creating Scheduled Reports With The Assistant
date: 2025-11-15T09:00:00
image: /blogpics/apipicgen/automatingnetworkcompliancecreatingscheduledreportswiththeassistant-CZAWC5R5Y3.jpg
categories: ["Compliance", "Reporting"]
featured: false
draft: false
questions:
  - "How does the assistant choose which agent to use for the compliance report?"
  - "What kinds of monitoring checks are included in the compliance report setup?"
  - "How does the report pull both current status and historical trends?"
  - "How are the weekly and daily email reports automated?"
  - "Can you preview the report before emails start going out?"
answers:
  - "It first calls get_agents to list available monitoring agents, then helps the user pick the best one based on the use case. In the example, Scanner - EU was selected because it is suitable for internet-facing checks, while a local agent could be used for internal assets."
  - "The walkthrough includes representative compliance-related checks such as HTTPS certificate and configuration monitoring, vulnerability scanning with the nmapvuln endpoint, and basic uptime monitoring using HTTP or ICMP. These checks provide the raw data used in the final report."
  - "For the latest results, the assistant uses get_host_data with dataset_id set to 0, which means the most recent data. For historical reporting, it sets dataset_id to null and provides date_start and date_end values, allowing it to calculate trend metrics like uptime percentage, latency percentiles, and vulnerability counts over a 7-day window."
  - "The assistant uses call_connect_expert to create scheduled Connects that query monitoring data, build HTML and text reports, and email them automatically. In the example, one Connect is scheduled weekly on Mondays at 07:00 UTC, and another is scheduled on weekdays at 07:00 UTC for daily status reporting."
  - "Yes. The walkthrough shows using call_cmd_processor_expert to create a one-off tool called ComplianceReportNow. It generates the report immediately as HTML and plain text files and prints a console summary, letting you review the content and formatting without sending any email."
---
When a security team asks for “a weekly compliance and status report in the inbox every Monday,” the Quantum Network Monitor Assistant can make it happen end to end. Below is a realistic, multi-turn walkthrough showing how a user and the assistant collaborate to set up compliance checks, generate a clean report from monitoring data via the API, and schedule automated email delivery. Along the way you’ll see the assistant “call” ready-made functions such as add_host, get_host_list, get_host_data, and the expert builders for automation (Connects) and one-off commands (Cmd Processors). If you want to try the same flow yourself, open the Quantum Network Monitor Assistant and follow along.

Use case
- Goal: Generate and email recurring compliance/status reports to stakeholders
- Focus: Pulling monitoring data via the API and scheduling delivery automatically

Step 1: Pick where the automation runs (agent selection)
User: I want a weekly compliance report for our internet-facing services, emailed to compliance@acme.com every Monday at 07:00 UTC.

Assistant: Great. First I’ll check which monitoring agents you can use. Agents run monitors and automations on your behalf. Let me list available agents so you can choose where to run scans and reporting.

Function call
```json
{
  "name": "functions.get_agents",
  "arguments": {
    "detail_response": false
  }
}
```
How we use the response
- We look for internet-based agents (for broad external checks) or your local agents (your email is typically shown in the agent label).
- Suppose the response shows “Scanner - EU,” “Scanner - US,” and “Acme HQ - Local (you@acme.com).” We’ll proceed with “Scanner - EU” for public-facing checks and leave the local agent for internal assets.

Assistant: I see Scanner - EU and Scanner - US available for external monitoring. Do you want me to use Scanner - EU?

User: Yes, use Scanner - EU.

Step 2: Ensure compliance-relevant checks exist
We’ll set up a few representative monitors often included in compliance reports:
- HTTPS certificate/config checks (https endpoint)
- Vulnerability scans (nmapvuln endpoint)
- Basic uptime checks (http or icmp)

Assistant: I’ll add two sample targets. Feel free to add more later.
- app.acme.com (HTTPS cert and availability)
- vpn-gateway.acme.corp (Nmap vulnerability scan)

Function call 1 (add HTTPS monitoring for the app)
```json
{
  "name": "functions.add_host",
  "arguments": {
    "address": "app.acme.com",
    "endpoint": "https",
    "agent_location": "Scanner - EU",
    "timeout": 20000,
    "email": "compliance@acme.com",
    "detail_response": true
  }
}
```
How we use the response
- If you’re not logged in, the system returns an auth_key and an id. Save the auth_key to edit/delete this monitor later.
- We confirm the host ID (e.g., id=101) and that the endpoint is active.

Function call 2 (add a vulnerability scan for the VPN gateway)
```json
{
  "name": "functions.add_host",
  "arguments": {
    "address": "vpn-gateway.acme.corp",
    "endpoint": "nmapvuln",
    "args": "--script vuln",
    "agent_location": "Scanner - EU",
    "timeout": 59000,
    "email": "compliance@acme.com",
    "detail_response": true
  }
}
```
How we use the response
- We again store the returned id and auth_key.
- The nmapvuln endpoint will periodically run vulnerability scripts and log findings in your monitoring data.

Assistant: Both monitors are created. I’ve saved their IDs and auth keys so we can manage them later if needed.

Step 3: Confirm what’s being monitored now
User: Show me the compliance-relevant entries we just added.

Assistant: I’ll fetch all hosts for acme and show the essential configuration.

Function call (list configs by address filter)
```json
{
  "name": "functions.get_host_list",
  "arguments": {
    "detail_response": true,
    "address": "acme",
    "agent_location": "Scanner - EU"
  }
}
```
How we use the response
- We verify app.acme.com (https) and vpn-gateway.acme.corp (nmapvuln) are present and enabled.
- We display summary details (endpoint type, schedule cadence, port if applicable).

Assistant: I can see both entries under Scanner - EU. Ready to pull data for your first report.

Step 4: Pull the latest status to build the report body
User: Pull the latest results now so I can preview what the report will contain.

Assistant: I’ll query the latest dataset for each target. dataset_id=0 always means “most recent data.”

Function call (latest data for both targets)
```json
{
  "name": "functions.get_host_data",
  "arguments": {
    "detail_response": true,
    "dataset_id": 0,
    "address": "acme",
    "agent_location": "Scanner - EU"
  }
}
```
How we use the response
- For https: we extract availability, response time, TLS version, and certificate metadata (issuer, expiry days remaining).
- For nmapvuln: we extract discovered services and any CVE-flagged findings or script alerts.
- We’ll transform these into an executive summary plus a technical appendix.

Assistant: Here’s a quick summary from the latest data:
- app.acme.com (HTTPS): Up, TLS 1.2/1.3 supported, certificate expires in 68 days.
- vpn-gateway.acme.corp (NmapVuln): No high-severity findings detected in the last run; one medium finding on port 443 flagged for review.

Step 5: Add a short trend window (last 7 days) for compliance context
User: I also want a 7-day trend in the report.

Assistant: I’ll query the last 7 days (UTC). When retrieving historical data, we set dataset_id to null and provide date_start/date_end.

Function call (7-day history window)
```json
{
  "name": "functions.get_host_data",
  "arguments": {
    "detail_response": true,
    "dataset_id": null,
    "address": "acme",
    "agent_location": "Scanner - EU",
    "date_start": "2026-04-03T00:00:00",
    "date_end": "2026-04-10T00:00:00"
  }
}
```
How we use the response
- We compute uptime percentage, average/95th percentile latency for HTTPS checks, and counts of vulnerability findings by severity.
- These metrics feed a small “trends” section in the report.

Assistant: Trend preview:
- app.acme.com uptime: 99.96% (1 short outage)
- Median HTTPS latency: 184 ms; 95th percentile: 310 ms
- vpn-gateway.acme.corp: 0 critical, 0 high, 1 medium, 2 low over 7 days

Step 6: Automate generation and email delivery with a Connect
We’ll ask the Connect Expert to create a custom Connect that:
- Runs on Scanner - EU on a schedule (weekly, Mon 07:00 UTC; optionally offer a daily at 07:00 UTC)
- Queries monitoring data via the API for specified targets and time windows
- Renders a clean HTML and text report (executive summary + technical appendix + trend charts if desired)
- Emails it to compliance@acme.com (To/Cc configurable)

Assistant: I’ll request a new Connect named compliance_weekly_email that assembles the report and sends it.

Function call (create the scheduled reporting Connect)
```json
{
  "name": "functions.call_connect_expert",
  "arguments": {
    "agent_location": "Scanner - EU",
    "message": "I am authorized to add a Connect. Create a Connect type named 'compliance_weekly_email'. Behavior: 1) On each run, query the monitoring API for a configured list of targets (default: any host with address containing 'acme') to collect: latest status (dataset_id=0) and a historical window (default: last 7d). 2) Build an HTML + plain-text compliance report including: uptime %, TLS/cert status and days-to-expiry for https endpoints, vulnerability summary by severity for nmapvuln endpoints, and a small trends section (latency percentiles, outage count). 3) Email the report with subject 'Weekly Compliance Report' to 'compliance@acme.com'. Allow configuring recipients, CC, and schedule. 4) Default schedule: cron '0 7 * * 1' (Mondays at 07:00 UTC). 5) Provide Connect settings: targets filter (by address/endpoint), history_window (e.g., 7d), include_sections flags, email_to/cc, email_subject, timezone. 6) Log a summary outcome row (sent timestamp, targets count, findings summary) for auditing."
  }
}
```
How we use the response
- The expert returns JSON describing the added Connect type and its configurable settings.
- We’ll confirm the default schedule and recipients, and note where to edit them later.

Assistant: The Connect is ready with a weekly Monday 07:00 UTC schedule and will send to compliance@acme.com. Do you want to add a weekday daily status report at 07:00 UTC too?

User: Yes, set up a daily status report to the same inbox.

Function call (add a daily variant)
```json
{
  "name": "functions.call_connect_expert",
  "arguments": {
    "agent_location": "Scanner - EU",
    "message": "I am authorized to add a Connect. Create a Connect type named 'compliance_daily_email' similar to 'compliance_weekly_email' but with cron '0 7 * * 1-5' (weekdays at 07:00 UTC) and a default history_window of 24h. Use the same email_to 'compliance@acme.com'."
  }
}
```
How we use the response
- We confirm a second Connect exists, configured for weekdays.

Assistant: Daily email report scheduled at 07:00 UTC Monday–Friday. Weekly compliance report scheduled every Monday 07:00 UTC.

Step 7: Optional on-demand preview with a Cmd Processor
Before the first scheduled send, many teams like to preview the exact content. We can use a Cmd Processor to generate a one-off report instantly (no scheduling) so you can approve formatting and content.

User: Let’s preview today’s report without sending an email.

Assistant: I’ll ask the Cmd Processor Expert to create a small utility named ComplianceReportNow that fetches the same data and renders the report to console and an HTML file, without sending mail.

Function call (create and run a one-off preview tool)
```json
{
  "name": "functions.call_cmd_processor_expert",
  "arguments": {
    "agent_location": "Scanner - EU",
    "message": "I am authorized to manage cmd processors. Create or update a cmd processor named 'ComplianceReportNow' that 1) queries latest data and a 24h history for target filter 'acme' (similar fields as the Connect), 2) renders HTML and plain text to local files (e.g., /tmp/compliance-preview.html and .txt), 3) prints a short console summary. Then run it now with arguments: --targets 'acme' --history 24h --send false."
  }
}
```
How we use the response
- The expert returns confirmation, optional logs, and the preview output location.
- You review the HTML locally (or the console summary) and approve.

Assistant: The preview is generated. No email was sent. Do you want me to tweak any sections or recipients before we lock it in?

User: Looks good. Keep the recipients and schedule as configured.

Step 8: Verify scheduled runs and refine
Once scheduled, the Connect will run automatically at the specified times and email the report. If you add more monitored hosts later, the same Connect can include them using the targets filter.

If you need to confirm which targets are in-scope for the report, you can list or filter your current monitored hosts any time.

Function call (filter current hosts for the report)
```json
{
  "name": "functions.get_host_list",
  "arguments": {
    "detail_response": true,
    "address": "acme",
    "agent_location": "Scanner - EU",
    "page_number": 1,
    "page_size": 20
  }
}
```
How we use the response
- We ensure the monitored inventory aligns with your compliance scope and adjust the Connect’s targets filter if needed.

Assistant: Your monitored assets under Scanner - EU look correct. The next daily report will send at 07:00 UTC tomorrow, and the weekly compliance report will go out Monday at 07:00 UTC.

Function quick reference from this walkthrough
- get_agents: List places where monitors and automations can run.
- add_host: Add monitors like https and nmapvuln that feed compliance data to your reports.
- get_host_list: Confirm inventory and configuration.
- get_host_data: Pull latest and historical results for status, trends, and findings.
- call_connect_expert: Build a scheduled automation (Connect) that compiles and emails reports.
- call_cmd_processor_expert: Create/run a one-off preview tool so you can validate the report before scheduling.

Closing
With a few guided steps, we set up meaningful compliance checks, generated a clean report from monitoring data via the API, and scheduled reliable email delivery—no custom servers or cron jobs required. Try this yourself with the Quantum Network Monitor Assistant to automate your own compliance and status reporting workflows end to end.