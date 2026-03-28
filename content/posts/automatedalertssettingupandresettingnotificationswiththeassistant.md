---
title: Automated Alerts Setting Up And Resetting Notifications With The Assistant
date: 2025-11-01T09:00:00
image: /blogpics/apipicgen/automatedalertssettingupandresettingnotificationswiththeassistant-I02EGHJZVM.jpg
categories: ["Alerts", "Automation"]
featured: false
draft: false
questions:
  - "Why do I need to save the auth_key when creating a monitor without logging in?"
  - "How can I check whether my monitored API is currently healthy?"
  - "What is the best way to avoid alerts during a planned maintenance window?"
  - "What is the difference between resetting standard alerts and predictive alerts?"
  - "How do I change where monitoring checks are run from?"
answers:
  - "If you are not logged in, the auth_key acts as your credential for later changes. You will need it to edit the host, pause or resume monitoring, change the agent location, or reset alerts for that monitor."
  - "You can use the get_host_data function with the host address. It returns the latest status details such as response time, HTTP status, agent location, and whether alert_flag is true or false."
  - "Use the edit_host function to set enabled to false for that host. This pauses checks and alerts during maintenance, and you can later set enabled back to true to resume normal monitoring."
  - "A standard alert reset clears the active monitor alert state for a host. A predictive alert reset only clears trend-based or risk-based warning flags by setting alert_type to \"predict\", leaving the normal monitor state unchanged."
  - "First, call get_agents to see the available agent locations. Then use edit_host to update the host's agent_location to the one you want, such as switching from a US agent to an EU agent."
---
In this guide, we walk through a realistic conversation that shows how to use the Quantum Network Monitor Assistant to configure automated alerts, pause/resume monitoring during maintenance, and reset both active and predictive alerts via simple API-style function calls. The goal: use the Assistant to set up alerts once and then manage them confidently whenever incidents or maintenance windows occur. Follow along and try it yourself at the Quantum Network Monitor Assistant.

User: I want email alerts if my API goes down. Can you monitor https://api.acme.com from the US and notify ops@acme.com?
Assistant: Absolutely. We’ll add a new HTTPS monitor with email alerts. Because you’re not logged in, we’ll include your email so alerts are delivered and you’ll receive an auth_key you can use later to edit or reset alerts.

Function call
```json
{
  "name": "functions.add_host",
  "arguments": {
    "address": "api.acme.com",
    "endpoint": "https",
    "email": "ops@acme.com",
    "agent_location": "Scanner - US East",
    "timeout": 30000
  }
}
```
What happens next: The add_host call creates the monitoring entry and returns details such as id (e.g., 221) and an auth_key (e.g., AK-1a2b3c) because you’re not logged in. Save that auth_key; you’ll need it to edit settings or reset alerts without logging in. We used add_host to set up HTTPS monitoring and email alerts.

User: Great. How do I verify it’s live and see if it’s currently healthy?
Assistant: We’ll fetch the latest status for api.acme.com.

Function call
```json
{
  "name": "functions.get_host_data",
  "arguments": {
    "detail_response": true,
    "dataset_id": 0,
    "address": "api.acme.com"
  }
}
```
What happens next: The get_host_data call returns the latest monitoring status, response time, HTTP status, agent location, and alert flags. You’ll typically see alert_flag: false when everything is healthy.

User: We have a maintenance window tonight from 2–3 AM. I don’t want alerts during that time. Can you pause monitoring?
Assistant: Yes—let’s temporarily disable the host. Since you’re not logged in, we’ll use the auth_key returned earlier.

Function call
```json
{
  "name": "functions.edit_host",
  "arguments": {
    "id": 221,
    "enabled": false,
    "auth_key": "AK-1a2b3c"
  }
}
```
What happens next: The edit_host call sets enabled: false so checks (and thus alerts) are paused for this host. This is a clean way to avoid noise during planned work.

User: Maintenance is done. Please turn alerts back on.
Assistant: Re-enabling now.

Function call
```json
{
  "name": "functions.edit_host",
  "arguments": {
    "id": 221,
    "enabled": true,
    "auth_key": "AK-1a2b3c"
  }
}
```
What happens next: Monitoring resumes on the next scheduled cycle. If the service is up, you’ll stay quiet; if it’s down, alerts will fire again based on your email settings.

User: We had a brief outage. Which hosts are currently in an alerting state?
Assistant: Let’s list hosts where alerts are active. This is useful for triage when you want to focus on impacted services.

Function call
```json
{
  "name": "functions.get_host_data",
  "arguments": {
    "detail_response": true,
    "alert_flag": true
  }
}
```
What happens next: The result includes any hosts with active alert_flag: true, along with their latest check results, times, and locations. You can quickly see which items still need attention.

User: We fixed the API issue. Please clear the alert for api.acme.com so it doesn’t keep showing as red.
Assistant: Acknowledging and clearing the alert.

Function call
```json
{
  "name": "functions.reset_alerts",
  "arguments": {
    "address": "api.acme.com",
    "auth_key": "AK-1a2b3c"
  }
}
```
What happens next: reset_alerts clears the monitor alert state for that host. This is especially helpful after remediation so your dashboard reflects the current (healthy) reality.

User: Do you support predictive alerts, and can I reset those separately?
Assistant: Yes. Predictive alerts estimate risk based on trends. You can reset them independently.

Function call
```json
{
  "name": "functions.reset_alerts",
  "arguments": {
    "address": "api.acme.com",
    "auth_key": "AK-1a2b3c",
    "alert_type": "predict"
  }
}
```
What happens next: This clears predictive alert flags for the host while keeping the standard monitor state intact. Use this when trend-based warnings linger after capacity or stability improvements.

User: I also want to change the monitoring vantage point to Europe to reduce false positives from my US ISP. Can you switch the agent?
Assistant: Sure—first let’s see what agents are available, then we’ll update the host to run from EU.

Function call
```json
{
  "name": "functions.get_agents",
  "arguments": {
    "detail_response": false
  }
}
```
What happens next: You’ll get a short list of agent locations (for example, Scanner - EU, Scanner - US East). Choose the one you want.

Now we update the host:

Function call
```json
{
  "name": "functions.edit_host",
  "arguments": {
    "id": 221,
    "agent_location": "Scanner - EU",
    "auth_key": "AK-1a2b3c"
  }
}
```
What happens next: Future checks and alerts originate from the EU agent, which can improve accuracy for Europe-facing services.

User: After all those changes, can we confirm the API is healthy and no alerts remain?
Assistant: Yes—let’s fetch the latest status for the API once more.

Function call
```json
{
  "name": "functions.get_host_data",
  "arguments": {
    "detail_response": true,
    "dataset_id": 0,
    "address": "api.acme.com"
  }
}
```
What happens next: You’ll see current response metrics and alert_flag: false if all is well.

Bonus: Bulk-reset when logged in
If you’re logged in and want to clear all current alerts after a major incident, you can do a bulk reset without specifying auth_key.

Function call
```json
{
  "name": "functions.reset_alerts",
  "arguments": {
    "reset_all_hosts": true
  }
}
```
What happens next: All monitor alerts across your account are cleared at once. Use this after a global remediation or to declutter your dashboard.

Why these functions matter
- add_host: Creates your monitoring entry and sets up alert delivery (email for unauthenticated sessions).
- get_host_data: Shows current health and flags to focus your attention.
- edit_host: Pauses/resumes checks (and thus alerts) during maintenance, and adjusts agent location.
- reset_alerts: Acknowledges and clears monitor or predictive alerts, host-by-host or in bulk when logged in.
- get_agents: Helps you pick the most appropriate vantage point to reduce false positives.

With these simple steps and function calls, you can automate alerts, prevent alert storms during maintenance, and quickly reset notifications after remediation—without leaving chat. Ready to streamline your alert workflow? Open the Quantum Network Monitor Assistant and try these commands with your own services.