---
title: Penetration Testing With Metasploit And The Assistant
date: 2025-11-07T09:00:00
image: /blogpics/apipicgen/penetrationtestingwithmetasploitandtheassistant-QDXSIP80PA.jpg
categories: ["Metasploit", "Penetration Testing"]
featured: false
draft: false
questions:
  - "Why does the workflow start with a non-invasive Nmap pre-scan before running Metasploit modules?"
  - "What makes the Metasploit modules in this example 'safe'?"
  - "How do you keep the assessment limited to the authorized scope and schedule?"
  - "What should you do if a Metasploit job is still running when the maintenance window is ending?"
  - "How can findings from a one-time test be turned into ongoing monitoring?"
answers:
  - "The pre-scan identifies which services and ports are actually exposed so the Metasploit run can stay targeted and low-risk. By using version detection and safe scripts only, the security engineer gathers enough information to choose appropriate auxiliary scanners without jumping straight into heavier or potentially disruptive checks."
  - "The post uses non-destructive Metasploit auxiliary scanners such as version checks, HTTP banner checks, SMB fingerprinting, and anonymous FTP login testing. It explicitly avoids exploit modules, brute-force attempts, intrusive scripts, and anything outside the approved targets and maintenance window."
  - "Scope is controlled by explicitly naming the authorized target IPs in each function call and confirming authorization in the request. Scheduling is handled by running only during the approved maintenance window, choosing the right agent location, and using status checks or cancellation if a job runs too long or the window is about to end."
  - "Use the returned message_id to check the job status with function_status_with_message_id. If the job is still running and you need to stop, use cancel_functions with that same message_id so the activity ends safely and any partial results can still be noted."
  - "After identifying an issue or validating a fix, you can add the host to periodic monitoring with add_host and later review results with get_host_data. This helps detect service changes, new ports, version drift, or regressions without continuously running Metasploit."
---
In this hands-on walkthrough, we’ll show how a security engineer safely runs Metasploit modules through the Quantum Network Monitor Assistant, keeps tight control of scope and scheduling, and turns results into action. We’ll use a realistic, multi-turn conversation to illustrate how to: pick the right agent, do a non-invasive pre-scan, run safe Metasploit modules, track/cancel jobs, and capture findings for follow-up monitoring. Throughout, we’ll explain each function we use so you can replicate the flow in your own dashboard.

User
We have written authorization from the system owner to test two external servers during our maintenance window (02:00–03:00 US/Eastern). Targets: 203.0.113.25 and 203.0.113.31. I want a safe run—no service disruption. Can you help me choose the right scanner, do a quick service discovery, and then run a few non-invasive Metasploit modules?

Assistant
Absolutely. I’ll:
- List available scanning agents so we can choose the closest and most appropriate location.
- Run a safe, low-impact service discovery using Nmap (via the Security expert) to learn which ports are open.
- Based on that, I’ll run non-invasive Metasploit auxiliary scanners (version checks, anonymous FTP, etc.) through the Penetration expert—carefully constrained to your authorized scope and window.
- If anything looks risky, we’ll stop immediately and you’ll have the option to cancel in-flight jobs.

Step 1 — Choose the agent location
We first ask the Assistant to list available agents (scanner nodes). We’ll use get_agents for this.

Function Call
```json
{
  "name": "functions.get_agents",
  "arguments": {
    "detail_response": false
  }
}
```

How we use the response
- The function returns a list of agent locations (e.g., “Scanner - US”, “Scanner - EU”, or your local agent if installed).
- We choose “Scanner - US” to keep latency low to the targets and stay consistent with the maintenance window time zone.

Assistant
I recommend “Scanner - US” for this job. Shall I proceed with a non-invasive pre-scan to map open services?

User
Proceed with “Scanner - US.” Keep it minimal—just what we need to guide the Metasploit run.

Step 2 — Safe pre-scan using the Security expert
We’ll perform a version detection sweep with safe scripts (non-destructive), then use results to select appropriate Metasploit modules. This uses call_security_expert and explicitly states authorization.

Function Call
```json
{
  "name": "functions.call_security_expert",
  "arguments": {
    "message": "Authorized assessment. Run a non-invasive Nmap service discovery with version detection and safe scripts only against RHOSTS: 203.0.113.25, 203.0.113.31 during the approved maintenance window. Avoid intrusive NSE categories; prioritize -sV and default/safe scripts. Summarize open TCP ports and detected versions. I confirm I am authorized to perform this action.",
    "agent_location": "Scanner - US"
  }
}
```

How we interpret the response
- Example summary the expert might return:
  - 203.0.113.25: 22/tcp open ssh (OpenSSH 8.2p1), 80/tcp open http (Apache httpd 2.4.54), 445/tcp open microsoft-ds (SMB), SMBv1 disabled.
  - 203.0.113.31: 21/tcp open ftp (vsftpd 3.0.3), 22/tcp open ssh (OpenSSH 7.9p1), 80/tcp open http (nginx 1.18.0).
- No intrusive checks were run; we now know which protocols to query safely with Metasploit auxiliary scanners.

Assistant
Here’s the safe discovery summary:
- 203.0.113.25: SSH, HTTP (Apache 2.4.54), SMB with SMBv1 disabled
- 203.0.113.31: FTP (vsftpd 3.0.3), SSH, HTTP (nginx 1.18.0)

Next, I’ll run a few non-invasive Metasploit modules:
- SSH and SMB version checks (fingerprinting only)
- HTTP version banner checks
- Anonymous FTP login test (read-only authentication check)

Step 3 — Safely running Metasploit modules via the Penetration expert
We’ll use call_penetration_expert to direct Metasploit to run safe auxiliary modules. We explicitly confirm authorization and restrict scope.

Function Call
```json
{
  "name": "functions.call_penetration_expert",
  "arguments": {
    "message": "I confirm I am authorized by the system owner to test ONLY 203.0.113.25 and 203.0.113.31 in the defined maintenance window. Please run these safe, non-destructive Metasploit auxiliary scanners and return a concise table of results with host, port, module, and finding:\n1) auxiliary/scanner/ssh/ssh_version RHOSTS=203.0.113.25,203.0.113.31 THREADS=8\n2) auxiliary/scanner/smb/smb_version RHOSTS=203.0.113.25 THREADS=8\n3) auxiliary/scanner/http/http_version RHOSTS=203.0.113.25,203.0.113.31 RPORT=80 THREADS=8\n4) auxiliary/scanner/ftp/anonymous RHOSTS=203.0.113.31 RPORT=21 THREADS=8\nDo not run any exploit modules. Do not brute force credentials. Respect default timeouts. Abort on errors or potential instability. Provide command outputs sufficient for evidence but keep them concise.",
    "agent_location": "Scanner - US"
  }
}
```

How we interpret the response
- The expert will run each module and return findings like:
  - 203.0.113.25: ssh_version → OpenSSH 8.2p1 (Ubuntu)
  - 203.0.113.25: smb_version → Windows Server 2019, SMBv2/3 supported, SMBv1 disabled
  - 203.0.113.25: http_version → Apache/2.4.54 (Ubuntu)
  - 203.0.113.31: ssh_version → OpenSSH 7.9p1 (Debian)
  - 203.0.113.31: http_version → nginx/1.18.0
  - 203.0.113.31: ftp/anonymous → SUCCESS (anonymous login permitted; read access confirmed)
- The Assistant then highlights the FTP anonymous access as a finding and suggests remediation.

Assistant
Results summary:
- 203.0.113.25
  - SSH: OpenSSH 8.2p1
  - SMB: Windows Server 2019 (SMBv1 disabled—good)
  - HTTP: Apache 2.4.54
- 203.0.113.31
  - SSH: OpenSSH 7.9p1
  - HTTP: nginx 1.18.0
  - FTP: Anonymous login permitted (read-only). This should be disabled or tightly restricted unless it’s explicitly required.

Do you want me to re-test FTP anonymous after you apply a configuration change?

User
We’ve disabled anonymous FTP on 203.0.113.31. Re-test just that check.

Step 4 — Re-run a single Metasploit module to validate remediation
We call the Penetration expert again but only for the FTP anonymous test, same scope and authorization.

Function Call
```json
{
  "name": "functions.call_penetration_expert",
  "arguments": {
    "message": "I confirm I am authorized by the system owner to test ONLY 203.0.113.31. Re-run auxiliary/scanner/ftp/anonymous against RHOSTS=203.0.113.31 RPORT=21 to validate that anonymous login has been disabled. Keep output concise.",
    "agent_location": "Scanner - US"
  }
}
```

How we interpret the response
- Expected result: “Anonymous login failed” or “Login not allowed,” which confirms remediation success.

Assistant
Validation passed: anonymous FTP login is now blocked on 203.0.113.31.

Optional: Tracking long-running jobs and canceling safely
Sometimes modules can take longer (e.g., if a target is slow to respond). When a function starts a longer task, it returns a message_id. You can poll status with function_status_with_message_id or cancel with cancel_functions if the maintenance window is ending.

Function Call (status check)
```json
{
  "name": "functions.function_status_with_message_id",
  "arguments": {
    "message_id": "msf-98765",
    "auto_check_interval_seconds": 0
  }
}
```

How we interpret the response
- If the job is “running,” we can decide to wait or cancel.
- If “completed,” we read results and proceed.

Function Call (cancel a running job)
```json
{
  "name": "functions.cancel_functions",
  "arguments": {
    "message_id": "msf-98765"
  }
}
```

How we interpret the response
- The Assistant will confirm whether the cancellation succeeded. If it did, it stops further activity for that job and notes partial results, if any.

Step 5 — Capturing findings and adding lightweight monitoring
To ensure ongoing visibility into exposed services (without running Metasploit nonstop), we can add periodic, safe monitoring entries—like an Nmap service scan monitor for the key host. We’ll use add_host for this.

Function Call
```json
{
  "name": "functions.add_host",
  "arguments": {
    "address": "203.0.113.31",
    "endpoint": "nmap",
    "agent_location": "Scanner - US",
    "detail_response": true,
    "timeout": 45000
  }
}
```

How we interpret the response
- This sets up a periodic service scan. If a new port appears or a service changes version unexpectedly, you’ll see it in the dashboard and can investigate promptly.

We can also fetch the latest monitoring results later using get_host_data:

Function Call
```json
{
  "name": "functions.get_host_data",
  "arguments": {
    "detail_response": true,
    "dataset_id": 0,
    "address": "203.0.113.31"
  }
}
```

How we interpret the response
- We read the latest scan snapshot, response times, and any alert flags.
- If anomalies are detected, we can schedule another safe Metasploit check during the next approved window.

Why these functions and when to use them
- get_agents: Enumerates available scanning/monitoring nodes so you can choose where the tests run.
- call_security_expert: Performs safe service discovery (e.g., Nmap -sV with safe scripts) to guide the Metasploit plan.
- call_penetration_expert: Runs scoped, authorized Metasploit modules (auxiliary scanners, never exploits unless explicitly approved). Perfect for non-destructive checks like versioning, anonymous logins, and basic misconfigurations.
- function_status_with_message_id and cancel_functions: Track progress and stop jobs if your time window is ending or you see something you’d rather pause.
- add_host and get_host_data: Add and review ongoing monitoring to catch drift and regressions after remediation.

Closing
With the Quantum Network Monitor Assistant, you can safely orchestrate Metasploit auxiliary modules from a single dashboard—scoped, authorized, and time-bounded—then fold the results into your ongoing monitoring. This approach keeps testing controlled, repeatable, and evidence-driven. Ready to try it on your next approved assessment window? Open the Quantum Network Monitor Assistant and follow the same steps to run safe modules, validate fixes, and keep an eye on changes over time: https://readyforquantum.com/?assistant=open