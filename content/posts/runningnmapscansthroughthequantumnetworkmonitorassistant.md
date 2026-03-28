---
title: Running Nmap Scans Through The Quantum Network Monitor Assistant
date: 2025-11-03T09:00:00
image: /blogpics/apipicgen/runningnmapscansthroughthequantumnetworkmonitorassistant-Y3IF9WOKNP.jpg
categories: ["Nmap", "Security Scanning"]
featured: false
draft: false
questions:
  - "Why should I scan the same target from multiple agent locations?"
  - "What is the recommended first scan to run before setting up recurring monitoring?"
  - "When should I use a vulnerability-focused Nmap scan instead of a basic service scan?"
  - "What kinds of results should I pay attention to after a scan completes?"
  - "What does clearing or resetting alerts do after I investigate an issue?"
answers:
  - "Different regions can see different results because of CDNs, geo-routing, firewall rules, or region-specific access controls. Scanning from multiple agents helps you spot exposure that may only be visible from certain locations."
  - "The post recommends starting with a one-off Nmap service detection scan using -sV. This helps establish a baseline of open ports, services, and versions before you automate recurring checks."
  - "You should upgrade to a vulnerability-focused scan after you are comfortable with your baseline exposure. The vuln scripts can surface possible CVEs, but they take longer to run and may produce false positives, so results should be validated against patch and asset inventories."
  - "Focus on open ports, detected services and versions, unexpected exposures like admin interfaces, TLS or certificate issues, and any changes compared with prior scans. These details help determine whether you need patching, tighter access controls, or deeper investigation."
  - "Resetting alerts clears the current alert state for that monitor after you have triaged or fixed the issue. This keeps the alert signal clean so future changes can trigger fresh alerts again."
---
In this guided walk-through, we’ll show how a security engineer can use the Quantum Network Monitor Assistant to run live Nmap scans, choose the right agent location, and interpret results. We’ll present it as a natural conversation where the user sets up an on-demand scan first, then configures recurring monitoring with richer vulnerability checks. Along the way, we’ll insert the exact function calls the assistant would make, and explain how the results inform next steps.

Step 1: Discover available agent locations to run scans from
Why: The same target can appear differently from Europe vs. the US due to CDNs, geo-based routing, or firewalls. It’s best practice to scan from a location that mirrors your users—or use multiple agents.

User: I want to scan api.acme.dev. Which scanner locations are available?

Assistant: Let me retrieve the list of agents you can run scans from.

Function call
```json
{
  "name": "functions.get_agents",
  "arguments": {
    "detail_response": false
  }
}
```
How we interpret the response: The assistant receives a concise list of agent locations, for example: “Scanner - EU”, “Scanner - US East”, and any private/local agents the user has installed (e.g., “Alex-Laptop (local)” for inside-the-firewall checks). The user can now choose one or more vantage points.

Step 2: Run a live, one-off Nmap service scan
Why: Before automating anything, many teams prefer a quick, ad-hoc sweep to confirm what’s exposed.

User: Let’s do a quick service detection scan from the EU agent, ports 1–1024.

Assistant: I’ll run Nmap with -sV on ports 1–1024 from “Scanner - EU”. Confirm you are authorized to scan api.acme.dev.

User: I confirm I’m authorized to scan my own domain.

Assistant: Great—initiating the scan now.

Function call
```json
{
  "name": "functions.call_security_expert",
  "arguments": {
    "message": "Run an Nmap service detection scan on api.acme.dev using: nmap -sV -p 1-1024 --reason --open. Only scan this authorized target. Provide a structured summary of open ports, services, versions, and any notable banners.",
    "agent_location": "Scanner - EU"
  }
}
```
How we interpret the response: The security expert returns the Nmap output parsed into a readable summary. A typical result might show 22/tcp (OpenSSH 8.x), 80/tcp (nginx), 443/tcp (nginx with TLS), and several closed or filtered ports. The assistant focuses on services and versions, flags anything unexpected (e.g., an admin panel exposed on 8080), and suggests what to verify next.

Optional: Check long-running status if needed
If the scan is extensive, the assistant can check progress.

Function call
```json
{
  "name": "functions.function_status_with_message_id",
  "arguments": {
    "message_id": "live-scan-eu-001",
    "auto_check_interval_seconds": 0
  }
}
```
How we interpret the response: If the job is still running, we’d see “pending” or “in-progress” and an ETA. If it’s complete, we consume the final summary to advise the user. For very long scans, we could enable periodic auto-checks, but the assistant will warn that it uses more tokens.

Step 3: Interpret the live results and decide on next steps
User: I see ports 22, 80, 443 open. What should I look at?

Assistant: Key takeaways:
- 22/tcp OpenSSH: Ensure key-based auth, disable password logins if possible, and keep it patched.
- 80/tcp HTTP and 443/tcp HTTPS: Confirm HTTP redirects to HTTPS, check TLS configuration and certificate validity.
- Anything unexpected? If a management UI appears, enforce IP restrictions or MFA.

From here, you can:
- Add a recurring Nmap service scan for change detection and alerting.
- Upgrade to a vulnerability-oriented scan (Nmap vuln scripts).
- Compare results from multiple agent locations.

Step 4: Add a recurring Nmap monitor (service discovery)
Why: Continuous visibility yields faster detection of new open ports or drift.

User: Set up a daily Nmap service scan from the EU agent on api.acme.dev.

Assistant: I’ll add a monitored host with the Nmap endpoint. We’ll do a balanced configuration: service detection, select scripts for TLS checks, and a moderate timeout.

Function call
```json
{
  "name": "functions.add_host",
  "arguments": {
    "address": "api.acme.dev",
    "endpoint": "nmap",
    "args": "-sV -p 22,80,443 --reason --open --script ssl-cert,ssl-enum-ciphers",
    "timeout": 120000,
    "agent_location": "Scanner - EU"
  }
}
```
How we interpret the response: The platform confirms the host is added and scheduled to run periodically. If the user isn’t logged in, the system would prompt for an email to receive alerts. The assistant stores the host ID (if returned) to reference it later for edits.

Step 5: Fetch latest monitoring results
User: Can you show me the latest results from that recurring scan?

Assistant: Let me retrieve the newest dataset.

Function call
```json
{
  "name": "functions.get_host_data",
  "arguments": {
    "detail_response": true,
    "dataset_id": 0,
    "address": "api.acme.dev",
    "agent_location": "Scanner - EU"
  }
}
```
How we interpret the response: We get the latest run, including:
- Open ports and detected services/versions
- Any delta from the prior run (e.g., new ports, closed ports)
- Execution metadata (run time, response stats)
The assistant highlights changes since the last check and notes if alerts were fired.

Step 6: Upgrade to vulnerability-focused scanning
Why: Once you’re comfortable with the baseline, Nmap’s vuln scripts can surface CVE-level findings. Be mindful of timeouts; these scans take longer.

User: Switch this to a vulnerability scan and extend the timeout to 3 minutes.

Assistant: I’ll update the endpoint to nmapvuln and include a common set of vuln scripts.

Function call
```json
{
  "name": "functions.edit_host",
  "arguments": {
    "address": "api.acme.dev",
    "endpoint": "nmapvuln",
    "args": "--script vuln,vulners -sV -p 22,80,443 --reason --open",
    "timeout": 180000,
    "agent_location": "Scanner - EU"
  }
}
```
How we interpret the response: The monitor now runs with vulnerability scripts. On subsequent runs, results may include identified CVEs with references. The assistant will caution about false positives and recommend validating with patch/version inventories.

Step 7: Compare from another location (e.g., US East)
Why: Some services appear only to certain regions. Comparing agents helps catch geo-conditional exposure.

User: Clone that same scan but run it from the US East agent to compare.

Assistant: I’ll add another monitor from “Scanner - US East” with identical settings.

Function call
```json
{
  "name": "functions.add_host",
  "arguments": {
    "address": "api.acme.dev",
    "endpoint": "nmapvuln",
    "args": "--script vuln,vulners -sV -p 22,80,443 --reason --open",
    "timeout": 180000,
    "agent_location": "Scanner - US East"
  }
}
```
How we interpret the response: We now have two recurring scans on the same target from different locations. The assistant can later pull both datasets and spot differences (e.g., 443 open in both, but an admin port only accessible from EU).

User: Run an immediate one-off comparison scan from US East to see today’s status.

Assistant: Initiating a live scan from US East now.

Function call
```json
{
  "name": "functions.call_security_expert",
  "arguments": {
    "message": "Run a one-off Nmap scan on api.acme.dev using: nmap -sV -p 22,80,443 --reason --open --script vuln,vulners. Only scan this authorized target. Summarize open ports, services, versions, and any CVE findings.",
    "agent_location": "Scanner - US East"
  }
}
```
How we interpret the response: We get a fresh summary from US East and can compare it to EU’s view. If discrepancies appear (e.g., 22 is filtered from US but open from EU), the assistant flags it and suggests verifying regional controls.

Step 8: Acknowledge and clear alerts after investigation
Why: Once you’ve triaged a change, you may want to reset the alert flag.

User: We investigated the new open port and fixed it. Clear the alert for the EU monitor.

Assistant: I’ll reset the monitor alert flag.

Function call
```json
{
  "name": "functions.reset_alerts",
  "arguments": {
    "address": "api.acme.dev",
    "endpoint": "nmapvuln",
    "agent_location": "Scanner - EU"
  }
}
```
How we interpret the response: The alert state is cleared. If a future run detects a new change, alerts will trigger again as configured.

Step 9: List current scan configurations
User: Show me both monitors and their settings.

Assistant: I’ll retrieve the host list filtered to our domain.

Function call
```json
{
  "name": "functions.get_host_list",
  "arguments": {
    "detail_response": true,
    "address": "api.acme.dev"
  }
}
```
How we interpret the response: We see both entries:
- EU agent: endpoint nmapvuln, scripts vuln/vulners, ports 22/80/443, timeout 180s
- US East agent: same config
The assistant confirms schedules and provides host IDs so you can edit or delete them later if needed.

Putting it all together: Best practices for Nmap via the assistant
- Start with a live service scan (-sV) to baseline exposure.
- Choose agent locations that reflect your user base—and add a second location to catch geo differences.
- Automate recurring Nmap monitors for drift detection and alerting.
- Upgrade to nmapvuln for CVE-level insights; increase timeouts accordingly.
- Validate findings against your CMDB or patch inventory to rule out false positives.
- Reset alerts after triage to keep your signal clean.

Ready to try this with your own environment? Open the Quantum Network Monitor Assistant and ask it to list available agents, then kick off your first authorized scan. In a handful of guided steps, you’ll move from an on-demand check to continuous, multi-region monitoring—complete with clear, actionable results.