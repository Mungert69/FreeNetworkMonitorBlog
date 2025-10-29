---
title: Enhancing Network Monitoring With Custom Agents
date: 2025-01-17T00:00:00
image: 
categories: ["Custom Solutions", "Monitoring Tools"]
featured: false
draft: false
questions: []
answers: []
---
In this walkthrough, we’ll show how a network engineer used the Quantum Network Monitor Assistant to enhance monitoring by deploying a custom on-prem agent. The payoff: true inside-the-firewall visibility plus powerful local tools like BusyBox (ping, traceroute, ip) and wget. You’ll see the assistant’s function calls, how we interpret results, and how the custom agent becomes the backbone of low-latency, context-rich monitoring.

User: I want to monitor an internal app server from inside our network. Can I set up a custom agent so I can use BusyBox and wget?

Assistant: Yes. First, let’s see if you already have a local agent registered.

Function call (we ask the platform for available agents):
```json
{
  "name": "functions.get_agents",
  "arguments": {
    "detail_response": false
  }
}
```
How we interpret the response:
- If we see only internet-based agents (e.g., “Scanner - EU/US/Asia”) and no entries with your email in the name, that means you don’t have a local agent yet.
- The assistant will guide you to install one from https://freenetworkmonitor.click/download.
- If a local agent is listed, we’ll note its “agent_location” string for later (for example, “HQ-Linux (ops@example.com)”).

User: I don’t see a local agent in the list.

Assistant: Install a local agent on any Linux or Windows box inside your network using the link above. Once it’s running, let’s refresh the list.

Function call (check agents again after install):
```json
{
  "name": "functions.get_agents",
  "arguments": {
    "detail_response": false
  }
}
```
How we interpret the response:
- Now we expect to see a local agent such as “HQ-Linux (ops@example.com)”. That’s your custom agent. Benefits:
  - Monitors from the same network segment as your apps (no NAT blind spots).
  - Lower latency and more accurate response times.
  - Access to BusyBox (ping, traceroute, ip) and wget onboard for real connectivity checks.

User: Great. Let’s verify the agent can reach our subnet and DNS.

Assistant: We’ll run a couple of safe BusyBox commands on the agent. Note: Only use BusyBox to connect to trusted internal services.

Function call (show interfaces briefly):
```json
{
  "name": "functions.run_busybox_command",
  "arguments": {
    "command": "ip -br addr",
    "agent_location": "HQ-Linux (ops@example.com)",
    "number_lines": 20
  }
}
```
How we interpret the response:
- We expect concise interface lines like “eth0 UP 10.10.20.15/24 …”. This confirms the agent’s IP and link state.

Function call (check internal DNS resolution):
```json
{
  "name": "functions.run_busybox_command",
  "arguments": {
    "command": "nslookup intranet.example.local",
    "agent_location": "HQ-Linux (ops@example.com)",
    "number_lines": 40
  }
}
```
How we interpret the response:
- If DNS resolves, we’ll see the internal IP (e.g., 10.10.30.50). If not, we’ll adjust resolv.conf or use the correct internal DNS.

User: DNS resolves. Can we start monitoring the internal intranet site over HTTPS?

Assistant: Absolutely. We’ll add an HTTPS monitor and pin it to your custom agent so checks originate inside your network.

Function call (add HTTPS monitor from the custom agent):
```json
{
  "name": "functions.add_host",
  "arguments": {
    "address": "intranet.example.local",
    "endpoint": "https",
    "port": 443,
    "timeout": 10000,
    "agent_location": "HQ-Linux (ops@example.com)",
    "email": "ops@example.com"
  }
}
```
How we interpret the response:
- On success, the platform returns an object containing the new host ID (e.g., id: 142) and confirmation the monitor is enabled. We’ll note the ID for future edits.

User: Before relying on the monitor, can we spot-check the endpoint with wget from the agent?

Assistant: Yes—wget is perfect for a quick HEAD/handshake check with minimal noise.

Function call (quietly “spider” the site to confirm status/headers):
```json
{
  "name": "functions.run_busybox_command",
  "arguments": {
    "command": "wget -S --spider -T 5 https://intranet.example.local",
    "agent_location": "HQ-Linux (ops@example.com)",
    "number_lines": 80
  }
}
```
How we interpret the response:
- We expect to see HTTP/2 or HTTP/1.1 status lines (200/301/302/etc.) and certificate/TLS negotiation details. A 200 or 302 is a good sign. If we see timeouts or TLS errors, we’ll adjust the monitor timeout or check cert trust.

User: Looks good. How do we confirm the new monitor is collecting data?

Assistant: Let’s pull the latest metrics for that host.

Function call (get latest data for the intranet host):
```json
{
  "name": "functions.get_host_data",
  "arguments": {
    "dataset_id": 0,
    "address": "intranet.example.local",
    "detail_response": true,
    "agent_location": "HQ-Linux (ops@example.com)"
  }
}
```
How we interpret the response:
- We’ll see up/down state, recent response times, SSL expiry info, and the agent location. This validates that your custom agent is actively probing from inside the network.

User: The app’s login page is heavy. Can we test full page load too?

Assistant: Yes. Let’s add a second monitor using httpfull (renders full content including JavaScript) from the same agent.

Function call (add an httpfull monitor for real page load performance):
```json
{
  "name": "functions.add_host",
  "arguments": {
    "address": "intranet.example.local/login",
    "endpoint": "httpfull",
    "timeout": 20000,
    "agent_location": "HQ-Linux (ops@example.com)",
    "email": "ops@example.com"
  }
}
```
How we interpret the response:
- We’ll get a new host ID (e.g., id: 143). This measure captures real client-side load timings as seen from your LAN.

User: Response times look a bit tight during peak. Can we increase the timeout?

Assistant: Sure—let’s edit that monitor by ID to allow a longer response time.

Function call (increase timeout on the httpfull monitor):
```json
{
  "name": "functions.edit_host",
  "arguments": {
    "id": 143,
    "timeout": 30000
  }
}
```
How we interpret the response:
- A confirmation indicates the change took effect. Subsequent checks should show fewer false-positive timeouts.

User: Can we also monitor network reachability to the app server directly?

Assistant: Let’s add a low-cost ICMP monitor to the server’s IP, again from your custom agent.

Function call (add a ping monitor to the internal IP):
```json
{
  "name": "functions.add_host",
  "arguments": {
    "address": "10.10.30.50",
    "endpoint": "icmp",
    "timeout": 5000,
    "agent_location": "HQ-Linux (ops@example.com)",
    "email": "ops@example.com"
  }
}
```
How we interpret the response:
- We get a host ID (e.g., id: 144). This gives quick signal on network vs. application issues.

User: During an incident, I’d like to ping and fetch the homepage concurrently to save time.

Assistant: We can run tasks in parallel—one BusyBox ping plus a quick data pull from your HTTPS monitor.

Function call (run ping and fetch latest monitor data in parallel):
```json
{
  "name": "multi_tool_use.parallel",
  "arguments": {
    "tool_uses": [
      {
        "recipient_name": "functions.run_busybox_command",
        "parameters": {
          "command": "ping -c 5 10.10.30.50",
          "agent_location": "HQ-Linux (ops@example.com)",
          "number_lines": 40
        }
      },
      {
        "recipient_name": "functions.get_host_data",
        "parameters": {
          "dataset_id": 0,
          "address": "intranet.example.local",
          "agent_location": "HQ-Linux (ops@example.com)"
        }
      }
    ]
  }
}
```
How we interpret the response:
- The ping output provides packet loss and latency from the LAN vantage point.
- The monitor data confirms current HTTP status and response time. Side-by-side, this makes it trivial to see if a slow page stems from network or application behavior.

Why a custom agent is a force multiplier
- True internal perspective: Measure what users actually experience behind your firewall, honoring internal routing, ACLs, and DNS.
- Lower false positives: LAN-latency baselines reduce noise from internet hops.
- Powerful tools on tap: BusyBox (ping, traceroute, ip, nslookup) and wget provide precise, scriptable diagnostics.
- Granular control: Pin each monitor to the right agent; tune timeouts per service.
- Faster incident response: One assistant, one pane—invoke checks and read results immediately from the same place.

Try this flow yourself
- Open the Quantum Network Monitor Assistant: https://readyforquantum.com/?assistant=open
- If you don’t see a local agent, install one: https://freenetworkmonitor.click/download
- Use get_agents to confirm your agent is ready.
- Add monitors with add_host and target the custom agent.
- Validate paths with run_busybox_command (ping, traceroute, wget). Only connect to trusted services.
- Tune with edit_host and verify with get_host_data.

With a custom agent, you enhance visibility, speed up troubleshooting, and unlock precise, on-site diagnostics—all orchestrated by the Quantum Network Monitor Assistant.