---
title: Getting Started With The Quantum Network Monitor Assistant
date: 2025-10-26T09:00:00
image: /blogpics/apipicgen/gettingstartedwiththequantumnetworkmonitorassistant-4L1I0YYA07.jpg
categories: ["Getting Started", "Onboarding"]
featured: false
draft: false
questions:
  - "What should I do if I’m not logged in when I start setting up monitoring?"
  - "How do I choose between a public agent and a local agent?"
  - "What’s the difference between using the https endpoint and httpfull?"
  - "How can I confirm that my new host is actually being monitored?"
  - "What should I do if I’m not receiving alerts or need to stop monitoring a host?"
answers:
  - "Use get_user_info to check your session status. If logged_in is false, click the Login button in the Quantum Network Monitor Assistant, then run get_user_info again. Once logged in, your email is attached automatically to new monitors so alerts and ownership are tied to your account."
  - "Use a public agent like “Scanner - US-East” or “Scanner - EU” for public websites and internet-facing devices. Use a local agent if you want to monitor devices inside your private network, such as 192.168.x.x addresses. If needed, install a local agent from the download link, then check get_agents again to confirm it appears."
  - "The https endpoint is a lightweight availability and SSL/TLS check, making it a great starting point for website monitoring. The httpfull endpoint loads the full page, including frontend resources and JavaScript, so it gives a better picture of real user experience but may take longer to run."
  - "Call get_host_data with dataset_id set to 0 and the host address. The response should show recent check results such as up/down status, response time, TLS details for HTTPS checks, and which agent performed the test. If no data appears yet, wait a short interval and check again."
  - "If alerts are not arriving, verify that you’re logged in and that email_verified is true. If you added a host without being logged in, include your email in the add_host call. To stop monitoring a host, call edit_host with hidden: true, which archives the host and stops checks."
---
Getting your first monitor running is easiest when you see it in action. Below is a guided, conversation-style walk-through showing how a new user sets up their first agent, authenticates, and adds a host using the Quantum Network Monitor Assistant. You can follow along live at the Quantum Network Monitor Assistant.

What we’ll cover:
- Confirm your login status so alerts go to the right place
- Choose or install your first monitoring agent
- Add your first host (website or device) for monitoring
- Verify data is flowing, then adjust settings if needed

Step 1: Check your login status (so alerts and ownership work correctly)
User: I just signed up—what now?
Assistant: First, I’ll check whether you’re logged in. If you’re logged in, your email is attached to anything we add and you’ll get alerts automatically.

We’ll call get_user_info to verify your session:
```json
{
  "name": "functions.get_user_info",
  "arguments": {
    "detail_response": true
  }
}
```
Interpreting the response:
- If logged_in is false, I’ll prompt you to log in at the Quantum Network Monitor Assistant (click “Login” top-right). After logging in, I’ll run get_user_info again to confirm your email is attached.
- If logged_in is true (e.g., email: alex@acme.io), you’re good—no need to provide email manually when adding hosts.

Assistant: If you’re not logged in, please click Login. Ready to check again?
User: Logged in now.
Assistant: Great, verifying again:
```json
{
  "name": "functions.get_user_info",
  "arguments": {
    "detail_response": true
  }
}
```
Interpreting the response:
- logged_in: true and email present (e.g., alex@acme.io). We’ll proceed; your account owns any monitors we add.

Step 2: Choose (or install) your first agent
Assistant: Next, let’s pick an agent—this is where the checks run from. You can use public internet-based agents (e.g., “Scanner - US-East”, “Scanner - EU”), or install a local agent to monitor inside your network (great for LAN-only devices).

I’ll list available agents:
```json
{
  "name": "functions.get_agents",
  "arguments": {
    "detail_response": true
  }
}
```
Interpreting the response:
- If you see “Scanner - US-East” and “Scanner - EU”, those are ready to use right away for public targets (like your website).
- If you want to monitor local devices (e.g., 192.168.x.x), install a local agent from https://freenetworkmonitor.click/download. After installation, it will appear in this list with your email in the name (e.g., “Alex Laptop - Local Agent”).

User: Let’s start with a public agent—use “Scanner - US-East.”
Assistant: Perfect. We’ll use that agent for our first host.

Step 3: Add your first host for monitoring
Assistant: What do you want to monitor first? For a website, HTTPS is a great starting point—it checks availability and your SSL/TLS setup. Let’s add example.com over HTTPS and assign the US-East agent.

We’ll call add_host:
```json
{
  "name": "functions.add_host",
  "arguments": {
    "address": "example.com",
    "endpoint": "https",
    "agent_location": "Scanner - US-East"
  }
}
```
Interpreting the response:
- Success returns a new host ID (e.g., id: 101) and confirmation that monitoring has started. Because you’re logged in, your email is automatically attached for alerts. If you were not logged in, we would have added an "email" field to the call so alerts reach you.

User: Can we also monitor a quick ping to my office router at 203.0.113.10?
Assistant: Absolutely—ICMP (ping) is ideal. If your router is public and you want an external vantage point, use a public agent; otherwise, run it from a local agent installed on your LAN.

We’ll call add_host again (public vantage example):
```json
{
  "name": "functions.add_host",
  "arguments": {
    "address": "203.0.113.10",
    "endpoint": "icmp",
    "agent_location": "Scanner - US-East",
    "timeout": 5000
  }
}
```
Interpreting the response:
- You’ll get another host ID (e.g., id: 102). The monitor will begin with periodic pings and alert you if it’s down or latency spikes.

Tip: If you’re not logged in, include "email": "you@yourdomain.com" in the add_host call to receive alerts.

Step 4: Verify monitoring data is flowing
Assistant: Let’s fetch the latest data for example.com to confirm everything’s live.

We’ll call get_host_data for the most recent dataset:
```json
{
  "name": "functions.get_host_data",
  "arguments": {
    "dataset_id": 0,
    "address": "example.com",
    "detail_response": true
  }
}
```
Interpreting the response:
- Look for status (up/down), response time, TLS certificate details (issuer, days to expiry), and which agent ran the check. If it’s “up” with a normal response time and your cert is valid, you’re set.
- If you see repeated failures, you can switch agents or adjust timeouts.

User: Looks good—response times are stable. What if I want to run a full page load instead of just the HTTPS head check?
Assistant: We can update the endpoint to httpfull to load the entire page (including JavaScript), which is useful when uptime depends on frontend resources.

We’ll call edit_host to change the endpoint:
```json
{
  "name": "functions.edit_host",
  "arguments": {
    "id": 101,
    "endpoint": "httpfull"
  }
}
```
Interpreting the response:
- On success, the monitor will begin using full-page loads on the next run. This typically takes a bit longer but provides a truer signal of real user experience.

Optional: Move a monitor to a different agent
Assistant: If your audience is in Europe and you want to measure from there, we can migrate the check to “Scanner - EU.”

We’ll call edit_host to change the agent location:
```json
{
  "name": "functions.edit_host",
  "arguments": {
    "id": 101,
    "agent_location": "Scanner - EU"
  }
}
```
Interpreting the response:
- The next checks will originate from the new agent, giving you regional performance insight.

Troubleshooting quick tips
- I don’t see my local devices: Install a local agent (Windows/macOS/Linux) from https://freenetworkmonitor.click/download, then re-run get_agents to confirm it’s online. Add hosts with agent_location set to your local agent.
- I’m not getting alerts: Confirm you’re logged in (get_user_info) and email_verified is true. If you’re operating without login, include your email when calling add_host.
- I added a host but no data yet: Fetch latest with get_host_data (dataset_id: 0). New checks may take a short interval to appear.
- I need to remove a host: Call edit_host with hidden: true.

Example (delete a host):
```json
{
  "name": "functions.edit_host",
  "arguments": {
    "id": 102,
    "hidden": true
  }
}
```
Interpreting the response:
- The host is archived (hidden) and monitoring stops. You can later re-add it if needed.

Wrap-up
In just a few steps, you:
- Confirmed your session with get_user_info so alerts are tied to your account
- Selected an agent with get_agents (and learned how to install a local one)
- Added your first host with add_host
- Verified live results and refined settings via get_host_data and edit_host

Ready to try it yourself? Open the Quantum Network Monitor Assistant, say “Help me set up my first agent and add a host,” and follow the guided prompts. You’ll have reliable monitoring and actionable alerts in minutes.