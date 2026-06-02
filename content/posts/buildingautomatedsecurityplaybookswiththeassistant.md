---
title: Building Automated Security Playbooks With The Assistant
date: 2025-12-01T09:00:00
image: /blogpics/apipicgen/buildingautomatedsecurityplaybookswiththeassistant-KP7QU8LZRE.jpg
categories: ["Security Automation", "Best Practices"]
featured: false
draft: false
questions:
  - "What’s the difference between the EU scanner and the NYC edge sensor, and when should I use each one?"
  - "Which monitors make up the baseline continuous compliance setup in this playbook?"
  - "How do vulnerability scans fit into the workflow without being too aggressive?"
  - "How can I confirm that the monitors were created correctly and see their latest results?"
  - "What should I do after fixing an issue that triggered an alert?"
answers:
  - "Use the EU scanner for internet-facing checks against public services like acme.example, since it tests from an external vantage point. Use the NYC edge sensor for internal or on-prem services that aren’t publicly reachable, or when you want to verify behavior from inside your own network, such as internal DNS resolution."
  - "The baseline setup includes HTTPS monitoring for certificate and availability checks, ICMP for uptime and packet loss, DNS for name resolution, quantum KEM testing for post-quantum handshake support, and quantum certificate checks for PQ certificate posture. Together, these provide continuous visibility into availability, trust configuration, and quantum readiness."
  - "The playbook adds two Nmap-based monitors: a service fingerprinting scan using lighter arguments like '-sV -T3 --version-light' and a vulnerability scan using '--script vuln -T3'. This balances useful coverage with a gentler scan profile, helping identify exposed services and likely vulnerabilities without using the most aggressive timing or depth settings."
  - "You can verify configuration with get_host_list using the target address, and then retrieve current status data with get_host_data. The configuration view shows the registered endpoints, scan arguments, and agent locations, while the data view shows the latest uptime, certificate status, DNS results, quantum findings, open services, and any active alerts."
  - "After remediation, re-enable the monitor if it was temporarily paused, then call reset_alerts for that monitor’s host ID. This clears the current alert state so the next scheduled run can validate the fix. If the problem is truly resolved, the alert stays cleared; if not, it will trigger again on the next check."
---
In this guided walkthrough, we’ll build an automated security playbook using the Quantum Network Monitor Assistant to chain API calls for continuous compliance, scanning, and alerting. Our user wants a repeatable workflow that continuously:
- validates uptime and DNS,
- checks TLS/SSL hygiene (including quantum readiness),
- runs periodic vulnerability scans,
- and automatically resets alerts after remediation while triggering re-checks.

Throughout, you’ll see how the Assistant orchestrates these steps via function calls and how to interpret the responses. Try these patterns yourself at the Quantum Network Monitor Assistant.

Scene: A SecOps engineer wants to wire up continuous compliance for acme.example (public site) and some on‑prem services.

Step 1 — Pick where scans run (choosing an Agent)
User: I want to run internet-facing scans from the EU and keep a local probe in NYC for my internal services. What agents do I have?

Assistant: Let’s list available agents so you can pick the right points of presence.

Function call
```json
{
  "name": "functions.get_agents",
  "arguments": {
    "detail_response": false
  }
}
```
Interpreting the response
- We’ll see entries like “Scanner - EU” (internet-based) and “Edge Sensor - NYC (your-email@company.com)” for your local/on‑prem runner.
- You choose “Scanner - EU” for public scans and “Edge Sensor - NYC” for local checks.

Step 2 — Add core monitors for continuous coverage (uptime, certs, DNS, quantum readiness)
User: Add baseline monitors for acme.example: HTTPS cert check, ICMP uptime, DNS resolution, and quantum readiness (KEM and certificate). Alerts should go to secops@acme.com.

Assistant: We’ll add four monitors on the EU agent so they run continuously. I’ll chain these calls; we could do them in parallel for speed, but I’ll show them one-by-one for clarity.

Function call (HTTPS certificate/availability)
```json
{
  "name": "functions.add_host",
  "arguments": {
    "address": "acme.example",
    "endpoint": "https",
    "port": 443,
    "email": "secops@acme.com",
    "agent_location": "Scanner - EU"
  }
}
```
How we use the result
- Confirms host ID and that checks for TLS/cert expiry and HTTPS responsiveness are scheduled.

Function call (ICMP uptime)
```json
{
  "name": "functions.add_host",
  "arguments": {
    "address": "acme.example",
    "endpoint": "icmp",
    "email": "secops@acme.com",
    "agent_location": "Scanner - EU"
  }
}
```
How we use the result
- Confirms host ID; latency and packet loss will be tracked for outage detection and trending.

Function call (DNS resolution)
```json
{
  "name": "functions.add_host",
  "arguments": {
    "address": "acme.example",
    "endpoint": "dns",
    "email": "secops@acme.com",
    "agent_location": "Scanner - EU"
  }
}
```
How we use the result
- Confirms DNS lookups are monitored—handy to catch misconfigurations or propagation issues.

Function call (Quantum KEM handshake test)
```json
{
  "name": "functions.add_host",
  "arguments": {
    "address": "acme.example",
    "endpoint": "quantum",
    "email": "secops@acme.com",
    "agent_location": "Scanner - EU"
  }
}
```
How we use the result
- Validates whether the site negotiates post‑quantum KEMs where supported.

Function call (Quantum-resistant certificate validation)
```json
{
  "name": "functions.add_host",
  "arguments": {
    "address": "acme.example",
    "endpoint": "quantumcert",
    "email": "secops@acme.com",
    "agent_location": "Scanner - EU"
  }
}
```
How we use the result
- Checks for PQ certificate usage and configuration posture.

Step 3 — Add vulnerability scanning to the playbook
User: Add an Nmap service and vulnerability scan for acme.example. Keep it gentle but informative.

Assistant: We’ll add a service scan and a vulnerability scan on the EU agent. You can tune arguments to balance noise vs. depth.

Function call (Nmap service fingerprinting)
```json
{
  "name": "functions.add_host",
  "arguments": {
    "address": "acme.example",
    "endpoint": "nmap",
    "args": "-sV -T3 --version-light",
    "email": "secops@acme.com",
    "agent_location": "Scanner - EU"
  }
}
```
Function call (Nmap vulnerability scripts)
```json
{
  "name": "functions.add_host",
  "arguments": {
    "address": "acme.example",
    "endpoint": "nmapvuln",
    "args": "--script vuln -T3",
    "email": "secops@acme.com",
    "agent_location": "Scanner - EU"
  }
}
```
How we use the results
- New host IDs confirm the monitors are scheduled. As they run, any detected CVEs flip the alert flag and send you an email.

Step 4 — Verify that everything’s wired correctly (retrieve configs and latest status)
User: Did those monitors register correctly?

Assistant: Let’s fetch the definitions and latest data for acme.example.

Function call (list config)
```json
{
  "name": "functions.get_host_list",
  "arguments": {
    "detail_response": true,
    "address": "acme.example"
  }
}
```
Function call (latest data snapshot)
```json
{
  "name": "functions.get_host_data",
  "arguments": {
    "detail_response": true,
    "dataset_id": 0,
    "address": "acme.example"
  }
}
```
Interpreting the responses
- Config confirms all endpoints, args, and agent locations.
- Latest data shows current statuses (up/down, cert days remaining, DNS result, KEM support, open ports/services, and any vulnerability findings).
- If alert_flag=true for any monitor, we’ll see it here and know what needs action.

Step 5 — On-demand deep checks via the Security Expert (OpenSSL/Nmap)
User: Kick off an in-depth TLS config audit right now—check supported protocols/ciphers and flag weak settings.

Assistant: I’ll ask the Security Expert to run an OpenSSL-based audit from the EU agent, then we’ll attach the findings to your playbook.

Function call
```json
{
  "name": "functions.call_security_expert",
  "arguments": {
    "message": "Run an OpenSSL TLS configuration audit for acme.example:443. Enumerate protocol versions and ciphers, flag weak/legacy suites, and provide remediation guidance. I am authorized to perform this action.",
    "agent_location": "Scanner - EU"
  }
}
```
How we use the response
- You’ll get a structured report of protocols/ciphers, any weak/NULL/EXPORT suites, and concrete hardening steps. We can store or summarize this alongside the continuous monitors.

Step 6 — Quantum readiness assessment on demand
User: Also run a quantum readiness check—test KEM support and whether PQ certs are in use.

Assistant: We’ll leverage the Quantum Expert for a focused assessment.

Function call
```json
{
  "name": "functions.call_quantum_expert",
  "arguments": {
    "message": "Test acme.example for TLS KEM support and post-quantum certificate usage, and provide a short readiness summary. I am authorized to perform this action.",
    "agent_location": "Scanner - EU"
  }
}
```
How we use the response
- The expert returns a friendly readiness summary. If support is partial or missing, we’ll capture recommended next steps in the playbook.

Step 7 — Make it periodic with an automated Connect (recurring compliance job)
User: I want a weekly compliance Connect that: re-checks TLS hygiene, verifies PQ posture, and posts a summary.

Assistant: We’ll request a custom Connect that runs automatically on schedule (Connects are periodic and managed by the monitoring platform).

Function call
```json
{
  "name": "functions.call_connect_expert",
  "arguments": {
    "message": "Create a Connect named 'weekly_tls_pq_compliance' that runs every 7 days on 'Scanner - EU' to: 1) probe acme.example:443 for TLS protocols/ciphers and weak suites, 2) check quantum KEM support and PQ certificate usage, 3) summarize pass/fail and recommended actions in the monitor output. I am authorized to perform this action.",
    "agent_location": "Scanner - EU"
  }
}
```
Interpreting the response
- You’ll receive a confirmation and a reference to the new Connect type. The platform will schedule it; results appear in your monitoring data stream alongside other endpoints.

Step 8 — Close the loop: auto-triage alerts and reset after remediation
User: When something fails, I want to see it fast, fix it, then reset the alert and trigger a fresh check.

Assistant: Here’s how we chain that:

1) Poll for any current alerts
Function call
```json
{
  "name": "functions.get_host_data",
  "arguments": {
    "detail_response": true,
    "alert_flag": true,
    "address": "acme.example",
    "dataset_id": 0
  }
}
```
Interpretation
- If an HTTPS cert is near expiry or Nmap detects a vuln, we’ll see which host ID raised the alert and why.

2) Apply a config change if needed (e.g., temporarily disable a noisy check during maintenance)
Function call
```json
{
  "name": "functions.edit_host",
  "arguments": {
    "id": 1234,
    "enabled": false
  }
}
```
Interpretation
- Host ID 1234 is paused; no alerts during maintenance windows.

3) After remediation, re-enable and reset alerts
Function call (re-enable)
```json
{
  "name": "functions.edit_host",
  "arguments": {
    "id": 1234,
    "enabled": true
  }
}
```
Function call (reset alert flags)
```json
{
  "name": "functions.reset_alerts",
  "arguments": {
    "id": 1234
  }
}
```
Interpretation
- The monitor is live again, and the alert flag is cleared. The next scheduled run validates the fix and will only alert again if the issue persists.

Step 9 — Local network checks with BusyBox (on‑prem verification)
User: Before I expose a service, confirm that my internal DNS is correct from the NYC edge sensor.

Assistant: Let’s resolve the record from the on‑prem vantage point.

Function call
```json
{
  "name": "functions.run_busybox_command",
  "arguments": {
    "command": "nslookup acme.example",
    "agent_location": "Edge Sensor - NYC",
    "number_lines": 20
  }
}
```
Interpreting the response
- We’ll confirm the resolver and A/AAAA answers. If internal DNS differs from public, we capture that in our change notes.

Step 10 — Long-running background tasks: status and cancellation
User: If a deep scan is taking too long, can I check status or cancel?

Assistant: Yes. Expert-assisted scans provide a message_id. We can check status or cancel if needed.

Function call (status check example)
```json
{
  "name": "functions.function_status_with_message_id",
  "arguments": {
    "message_id": "secx-7890",
    "auto_check_interval_seconds": 0
  }
}
```
Function call (cancel if still pending)
```json
{
  "name": "functions.cancel_functions",
  "arguments": {
    "message_id": "secx-7890"
  }
}
```
Interpreting the responses
- Status tells us whether the task queued, running, or done.
- Cancel attempts to halt if still in progress (won’t undo already completed changes).

Putting it together: a Playbook you can reuse and extend
- Discovery and posture: get_agents → add_host (https, icmp, dns, quantum, quantumcert) → get_host_list/get_host_data for verification.
- Continuous vulnerability coverage: add_host (nmap, nmapvuln) with tuned args.
- On-demand assurance: call_security_expert (OpenSSL/Nmap detail), call_quantum_expert (KEM/cert readiness).
- Scheduled compliance: call_connect_expert to create recurring Connects.
- Operate and recover: get_host_data(alert_flag=true) → edit_host for maintenance or tuning → reset_alerts post-fix.
- On‑prem sanity checks: run_busybox_command for DNS/connectivity from your edge.

This chained approach yields a living security playbook that runs itself—alerting you early, guiding remediation, and verifying fixes automatically. When you’re ready to build your own, open the Quantum Network Monitor Assistant, pick your agents, and start chaining these calls into the continuous compliance workflow your team needs.