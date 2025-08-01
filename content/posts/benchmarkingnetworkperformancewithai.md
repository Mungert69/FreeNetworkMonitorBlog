---
title: Benchmarking Network Performance With AI
date: 2025-06-10T09:00:00
image: /blogpics/apipicgen/BenchmarkingNetworkPerformanceWithAI-4BC1F000QY.jpg
categories: ["Performance", "AI"]
featured: false
draft: false
questions:
  - "How do I add a website and an internal server to the Quantum Network Monitor Assistant for performance benchmarking?"
  - "How can I view the current baseline performance metrics for my monitored hosts?"
  - "What is the process to track performance changes over time or compare current data with previous baselines?"
  - "How do I modify the monitoring setup or remove a host from the Quantum Network Monitor Assistant?"
  - "What are the main benefits of using the Quantum Network Monitor Assistant for network performance benchmarking?"
answers:
  - "You add each host using the add_host function with appropriate probes: use the HTTP endpoint for the website to measure page response time, and the ICMP endpoint for the internal server to benchmark network latency. You provide the address, endpoint type, and your email for notifications."
  - "After adding hosts, you use the get_host_data function with the host's address and dataset_id to fetch detailed statistics such as average response times, deviations, and trends. This data helps you establish and view the normal performance baseline."
  - "You can retrieve historical data for any date range using the get_host_data function with date_start and date_end parameters. By comparing these historical metrics with your baseline, you can detect performance drifts, congestion, or network changes."
  - "You use the edit_host function to update monitoring settings or remove a host. For example, to delete monitoring on a host, you set the 'hidden' parameter to true and provide your authentication key. You can also change endpoint types or other configurations as needed."
  - "The assistant allows you to easily add hosts for monitoring, retrieve live and historical performance metrics, and adjust your monitored endpoints through conversational AI. It helps establish baselines, track performance drifts proactively, and receive alerts, making network monitoring more efficient and AI-driven."
---
When working to ensure your network is robust and responsive, establishing and tracking performance baselines is an essential first step. In this blog, I’ll walk you through how a user leverages the [Quantum Network Monitor Assistant](https://readyforquantum.com/?assistant=open) to benchmark network performance using AI. You’ll see how easy it is to set up hosts, capture baseline metrics, and monitor for performance drifts—all via conversational AI and built-in monitoring tools.

Let's follow a user as they seek to benchmark the latency and responsiveness of two key network assets: their main company website and an internal server.

---

User: I want to monitor and benchmark my website example.com and our internal server 192.168.1.10 to set a performance baseline. Where do I start?

Assistant: Great goal! First, let’s add each host to the monitoring system using two types of probes: HTTP for the website (to measure page response time) and ICMP (ping) for the internal server (to benchmark network latency). After that, we’ll fetch statistics to establish your performance baselines.

To set up monitoring, we’ll call the add_host function for each resource:

```json
{
  "name": "functions.add_host",
  "arguments": {
    "detail_response": true,
    "address": "example.com",
    "endpoint": "http",
    "email": "user@yourdomain.com"
  }
}
```

We use add_host to register the website with HTTP monitoring—it checks response speeds and notifies via email if performance degrades.

Next, let’s add the internal server using ICMP:

```json
{
  "name": "functions.add_host",
  "arguments": {
    "detail_response": true,
    "address": "192.168.1.10",
    "endpoint": "icmp",
    "email": "user@yourdomain.com"
  }
}
```

The add_host method sets up low-level ping (ICMP) checks for your internal server, capturing latency data for benchmarking.

User: Once they’re added, how do I see my network’s current baseline numbers?

Assistant: Now that monitoring is in place, we can query each host for current and recent statistics. Let’s retrieve the latest results for both:

```json
{
  "name": "functions.get_host_data",
  "arguments": {
    "detail_response": true,
    "dataset_id": 0,
    "address": "example.com"
  }
}
```

And for your internal server:

```json
{
  "name": "functions.get_host_data",
  "arguments": {
    "detail_response": true,
    "dataset_id": 0,
    "address": "192.168.1.10"
  }
}
```

The get_host_data function here fetches detailed response statistics—like average response times, deviations, and trends—delivered in an easy-to-interpret summary. The output enables you to record the “normal” performance for each host, establishing the baseline.

User: How do I track changes over time or compare current data with my baseline?

Assistant: That’s easy. You can pull historical data over any window to see trends or spot anomalies. For example, to compare the last 7 days with your initial baseline, you can do:

```json
{
  "name": "functions.get_host_data",
  "arguments": {
    "detail_response": true,
    "address": "example.com",
    "date_start": "2025-06-04T00:00:00",
    "date_end": "2025-06-11T00:00:00"
  }
}
```

By periodically running this, you compare your current stats with previous baselines. This is key for detecting performance drifts, congestion, or changes in network paths—enabling proactive tracking with AI-driven insights and alerting.

User: What if I want to adjust which metrics are tracked or remove a host from the benchmark set?

Assistant: You can edit or remove a host’s monitoring setup with a single call. For example, to delete monitoring on example.com:

```json
{
  "name": "functions.edit_host",
  "arguments": {
    "detail_response": true,
    "address": "example.com",
    "hidden": true,
    "auth_key": "YOUR_AUTH_KEY"
  }
}
```

The edit_host function lets you update endpoint types (switch from http to https, for example) or clean up your monitored list when requirements change.

---

In summary, the [Quantum Network Monitor Assistant](https://readyforquantum.com/?assistant=open) lets you conversationally:
- Add hosts for performance benchmarking
- Retrieve live and historical metrics for baselining
- Adjust or prune your monitored endpoints as your network grows

Ready to benchmark your own infrastructure? Start tracking with the [Quantum Network Monitor Assistant](https://readyforquantum.com/?assistant=open) today, and let AI watch your baselines for you!