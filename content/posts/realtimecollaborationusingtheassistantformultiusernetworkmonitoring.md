---
title: Real-Time Collaboration Using The Assistant For Multi-User Network Monitoring
date: 2025-11-27T09:00:00
image: /blogpics/apipicgen/realtimecollaborationusingtheassistantformultiusernetworkmonitoring-YYGZZNCKA4.jpg
categories: ["Collaboration", "Network Monitoring"]
featured: false
draft: false
questions:
  - "How should a team choose between local agents and cloud scanners for monitoring?"
  - "Why does the walkthrough save each monitor's id and auth_key?"
  - "What is the best way to send alerts to multiple teammates or rotating on-call staff?"
  - "How can the team quickly see what is failing right now?"
  - "What should the team do during maintenance windows or when a monitor is no longer needed?"
answers:
  - "The post recommends using get_agents first, then agreeing on a simple policy. In the example, internal services run from the NYC office agent, while public services run from a US-based cloud scanner. This helps the team keep monitoring consistent and reduces confusion about where checks are coming from."
  - "The id and auth_key are needed to manage monitors later, especially if someone is not logged in. The team uses them to update settings, reset alerts, disable or re-enable checks, switch agent locations, or delete a monitor safely."
  - "The post suggests using a shared email like oncall@acme.com when creating monitors with add_host. That way, alerts go to whoever is on duty instead of only one person. If a specific partner or teammate needs separate notifications, you can create a second monitor for the same service with their email address."
  - "They can use get_host_data with alert_flag set to true and filter by the shared notification email. This returns only the monitors that are actively alerting, making it easier during stand-ups or handoffs to focus on current issues instead of searching through all monitor history."
  - "For planned work, the team can temporarily disable a monitor with edit_host by setting enabled to false, then turn it back on later. If a monitor should be removed permanently, they can safely delete it by setting hidden to true with edit_host, which avoids leaving duplicate or outdated checks in place."
---
Real-time collaboration on network monitoring works best when everyone can see the same truth, act on alerts quickly, and keep configuration drift under control. In this walkthrough, we’ll show how two teammates coordinate in the Quantum Network Monitor Assistant to add shared hosts, route notifications, triage alerts in real time, and clean up safely. Along the way, we’ll highlight the exact function calls used so you can replicate this in your own org. If you want to try these steps live, open Quantum Network Monitor Assistant in a new tab.

Step 1 — Decide where monitoring runs (picking shared agents)
User: We’d like all internal checks to run from the NYC office, and public checks from a US-based cloud scanner. What agents are available?

Assistant: Let’s list available monitoring agents so the team can standardize on locations. We’ll use get_agents to see both local and cloud options.

Function call (get_agents):
```json
{
  "name": "functions.get_agents",
  "arguments": {
    "detail_response": false
  }
}
```
How we use the response: We scan the returned agent list (e.g., “NYC Office - acme-netops@acme.com Agent”, “Scanner - US-East”, “Scanner - EU”) and agree to a simple policy:
- Internal hosts: agent_location = "NYC Office - acme-netops@acme.com Agent"
- Public hosts: agent_location = "Scanner - US-East"

Step 2 — Add shared hosts with team-wide notifications
User: Let’s monitor our internal API and our public status page. Send alerts to oncall@acme.com so whoever is on duty sees them.

Assistant: We’ll add both monitors in parallel, speeding up collaboration. We’ll specify email so alerts reach the shared distribution list. For HTTPS services, the default port 443 is fine; for non-standard services, we can set port explicitly.

Parallel function calls (add_host x2):
```json
{
  "name": "multi_tool_use.parallel",
  "arguments": {
    "tool_uses": [
      {
        "recipient_name": "functions.add_host",
        "parameters": {
          "address": "api.acme.corp",
          "endpoint": "https",
          "port": 8443,
          "timeout": 45000,
          "email": "oncall@acme.com",
          "agent_location": "NYC Office - acme-netops@acme.com Agent"
        }
      },
      {
        "recipient_name": "functions.add_host",
        "parameters": {
          "address": "status.acme.com",
          "endpoint": "http",
          "timeout": 30000,
          "email": "oncall@acme.com",
          "agent_location": "Scanner - US-East"
        }
      }
    ]
  }
}
```
How we use the response: Each add_host typically returns at least an id, and—if you’re not logged in—an auth_key. We record those so anyone on the team can update or delete the monitors via the Assistant or API later. Example:
- api.acme.corp → id: 1021, auth_key: “A1B2C3…”
- status.acme.com → id: 1022, auth_key: “D4E5F6…”

For completeness, the team also wants a DNS check for acme.corp pointing to internal DNS.

Function call (add_host):
```json
{
  "name": "functions.add_host",
  "arguments": {
    "address": "acme.corp",
    "endpoint": "dns",
    "timeout": 20000,
    "email": "oncall@acme.com",
    "agent_location": "NYC Office - acme-netops@acme.com Agent"
  }
}
```
How we use the response: We capture the new DNS monitor’s id/auth_key (e.g., id: 1023, auth_key: “G7H8I9…”) so the team can manage it together.

Notes on notifications
- If the team uses a shared login to the dashboard, you don’t need to include “email” in add_host; alerts go to the logged-in account’s email. For multi-user teams, a shared on-call list like oncall@acme.com ensures continuity across shifts.

Step 3 — Confirm shared inventory and visibility
User: Show everything we just created so the whole team sees the shared config.

Assistant: We’ll list hosts filtered by the shared notification email so everyone can find and manage them easily. We’ll request detail_response to include full configuration fields.

Function call (get_host_list):
```json
{
  "name": "functions.get_host_list",
  "arguments": {
    "detail_response": true,
    "email": "oncall@acme.com",
    "page_number": 1,
    "page_size": 10
  }
}
```
How we use the response: We verify that:
- api.acme.corp (https, port 8443) runs from “NYC Office - acme-netops@acme.com Agent”
- status.acme.com (http) runs from “Scanner - US-East”
- acme.corp (dns) runs from “NYC Office - acme-netops@acme.com Agent”
We also confirm the ids and retain auth_keys for collaboration.

Step 4 — Real-time stand-up: who’s red right now?
User: During our stand-up, can we see anything alerting right now for the on-call team?

Assistant: We’ll pull the latest datasets where an alert_flag is raised for this email. This shows exactly what needs attention without digging through historical logs.

Function call (get_host_data):
```json
{
  "name": "functions.get_host_data",
  "arguments": {
    "dataset_id": 0,
    "email": "oncall@acme.com",
    "alert_flag": true,
    "detail_response": true
  }
}
```
How we use the response: Suppose we see:
- api.acme.corp → alert_flag: true, error: “TLS handshake timeout”, last_response_ms: 60000+
- status.acme.com → alert_flag: false
- acme.corp (dns) → alert_flag: false
The team immediately focuses on api.acme.corp.

Step 5 — Acknowledge and reset alerts after triage
User: We’ve investigated api.acme.corp and fixed a misconfigured TLS listener. Let’s clear the alert so the dashboard is clean.

Assistant: We’ll reset the active monitor alert for that specific host using its id and auth_key (required if you’re not logged in). This does not delete history; it simply acknowledges and clears the alert flag so new alerts are easy to spot.

Function call (reset_alerts):
```json
{
  "name": "functions.reset_alerts",
  "arguments": {
    "id": 1021,
    "auth_key": "A1B2C3…"
  }
}
```
How we use the response: On success, the alert_flag for id 1021 is cleared. Future failures will raise new alerts as normal.

Step 6 — Temporarily pause a monitor during planned work
User: We’re deploying a CDN tweak for status.acme.com. Pause its monitor for an hour so notifications don’t spam the team, and then we’ll re-enable it.

Assistant: We’ll disable the monitor using edit_host. Later, we can flip enabled back to true.

Function call (edit_host):
```json
{
  "name": "functions.edit_host",
  "arguments": {
    "id": 1022,
    "enabled": false,
    "auth_key": "D4E5F6…"
  }
}
```
How we use the response: The monitor is disabled; no alerts will fire during maintenance. After the change window:

Function call (edit_host):
```json
{
  "name": "functions.edit_host",
  "arguments": {
    "id": 1022,
    "enabled": true,
    "auth_key": "D4E5F6…"
  }
}
```
How we use the response: status.acme.com monitoring resumes and will alert on issues again.

Step 7 — Fine-tune where checks run for distributed teams
User: Our EU team also wants an external view of status.acme.com from Europe. Can we switch the agent or add a second vantage point?

Assistant: To move an existing check, we can edit the agent_location. To add a second vantage point, we’d add another host entry for the same address but a different agent_location. Here, we’ll switch the current one to Europe during testing:

Function call (edit_host):
```json
{
  "name": "functions.edit_host",
  "arguments": {
    "id": 1022,
    "agent_location": "Scanner - EU",
    "auth_key": "D4E5F6…"
  }
}
```
How we use the response: The monitor now runs from “Scanner - EU,” giving the team a European perspective. If we wanted both US and EU views at the same time, we’d add a second monitor entry for status.acme.com targeting “Scanner - US-East.”

Step 8 — Add a dedicated alert path for a partner rotation
User: For the next quarter, Ben from the partner team should get direct notifications for the internal API too.

Assistant: With multi-user teams, it’s common to use a shared distribution list. But if a partner wants their own notifications for a subset, create a second monitor that points to their email. Note this creates separate monitoring traffic; keep counts in mind.

Function call (add_host):
```json
{
  "name": "functions.add_host",
  "arguments": {
    "address": "api.acme.corp",
    "endpoint": "https",
    "port": 8443,
    "timeout": 45000,
    "email": "ben.ops@partner.com",
    "agent_location": "NYC Office - acme-netops@acme.com Agent"
  }
}
```
How we use the response: We capture the new monitor’s id/auth_key for partner-owned updates. Ben now gets direct alerts without changing the main on-call flow.

Step 9 — Clean up safely when ownership changes
User: Ben is off the rotation; delete the partner-specific monitor so we don’t double-check the same service.

Assistant: We’ll delete that host by setting hidden to true via edit_host. We must include id and auth_key.

Function call (edit_host):
```json
{
  "name": "functions.edit_host",
  "arguments": {
    "id": 1059,
    "hidden": true,
    "auth_key": "Z9Y8X7…"
  }
}
```
How we use the response: The partner-specific monitor is removed. The team’s primary check remains intact.

Bonus — Rapid health snapshots across the team window
User: Before handoff, can you show a two-hour health snapshot for all oncall@acme.com monitors?

Assistant: We’ll fetch time-bounded data for quick trend checks. You can paste ISO timestamps for your window.

Function call (get_host_data):
```json
{
  "name": "functions.get_host_data",
  "arguments": {
    "email": "oncall@acme.com",
    "date_start": "2026-04-16T01:00:00",
    "date_end": "2026-04-16T03:00:00",
    "detail_response": true
  }
}
```
How we use the response: We scan for spikes in response time and any alert periods, then post a one-liner summary to the team channel. Everyone sees the same data and can drill into the dashboard if needed.

What each function did for team collaboration
- get_agents: Helped the team standardize where checks run (local office vs cloud scanners).
- add_host: Created shared monitors and routed alerts to team lists or partner recipients.
- get_host_list: Built a common inventory so everyone sees the same configuration and ids.
- get_host_data: Surfaced real-time alerts and historical snapshots for fast handoffs.
- reset_alerts: Let the team acknowledge and clear alerts after remediation.
- edit_host: Enabled/disabled monitors during maintenance, reassigned agent locations, and safely deleted entries.

Close the loop with the dashboard
Everything shown here works great from chat and via the API. The dashboard complements these steps with a visual view for trends, bulk selection, and SSO-based team access. Use the Assistant for quick changes in stand-ups, and pivot to the dashboard when you want broader context or to manage user-level email preferences.

You can try every step above yourself in the Quantum Network Monitor Assistant. Set up a shared on-call list, choose your agent locations, and collaborate in real time without losing track of who changed what and when.