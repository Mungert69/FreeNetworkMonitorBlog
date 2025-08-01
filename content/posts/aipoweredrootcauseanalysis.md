---
title: AI-Powered Root Cause Analysis
date: 2025-06-13T09:00:00
image: /blogpics/apipicgen/AIPoweredRootCauseAnalysis-UHJ3WMQFON.jpg
categories: ["Troubleshooting", "AI"]
featured: false
draft: false
questions:
  - "What is the Quantum Network Monitor Assistant (FNMA) and how does it help with network issues?"
  - "How does the assistant identify the root cause of alerts from multiple web services?"
  - "What role does DNS monitoring play in diagnosing network problems with the assistant?"
  - "What additional steps does the assistant recommend for corroborating findings and preventing future issues?"
  - "What functions does the Quantum Network Monitor Assistant use behind the scenes to analyze network data?"
answers:
  - "The Quantum Network Monitor Assistant (FNMA) is an AI-driven tool that uses natural language queries to help users trace and analyze complex network issues across multiple systems. It simplifies root cause analysis by correlating monitoring data, filtering by time and endpoints, and identifying patterns that affect the entire infrastructure."
  - "The assistant retrieves detailed monitoring data for each affected host, looks for common patterns such as timing of alerts, response times, and packet loss, and then correlates this information. In the example, it found that all alerts occurred within the same ten-minute window with increased response times and packet loss, suggesting a shared infrastructure issue."
  - "DNS monitoring helps the assistant check if DNS lookups experienced issues during the incident window. By querying DNS endpoint monitoring data, the assistant can detect spikes in latency and errors, which can indicate a DNS service disruption as the root cause affecting multiple systems."
  - "The assistant suggests checking DNS server logs for the incident timeframe, setting up alert correlation to detect patterns across multiple endpoints, and regularly reviewing the dependency map to understand which services share critical infrastructure components."
  - "The assistant uses functions like get_host_data to retrieve granular, time-specific monitoring metrics; get_host_list to filter hosts by monitoring type or endpoint; and AI-driven pattern recognition to logically connect data points and identify root causes quickly."
---
Modern network environments often face complex issues that affect multiple systems simultaneously—think intermittent outages, slowdowns, or alerts triggered across various endpoints. Pinpointing the root cause can be daunting, especially when data is scattered and the relationships aren’t obvious. The [Quantum Network Monitor Assistant](https://readyforquantum.com/?assistant=open) (FNMA) leverages AI-driven natural language queries to help users trace these multifaceted issues across their entire infrastructure, making root cause analysis faster and more intuitive.

Let’s walk through a hands-on example showing how a user and the assistant collaborate to solve a network-wide problem.

---

User:  
“We got alerts from three different web services — api1.example.com, app2.example.com, and secure3.example.com. Can you help me find what’s causing these?”

Assistant:  
“Absolutely! First, let’s look up the recent monitoring data for all three hosts to see if there are any patterns or anomalies.”

At this point, the assistant will call the get_host_data tool for each host, focusing on the latest monitoring events (timeouts, outages, slow responses, etc.):

```json
{
  "name": "functions.get_host_data",
  "arguments": {
    "detail_response": true,
    "dataset_id": 0,
    "address": "api1.example.com"
  }
}
```
```json
{
  "name": "functions.get_host_data",
  "arguments": {
    "detail_response": true,
    "dataset_id": 0,
    "address": "app2.example.com"
  }
}
```
```json
{
  "name": "functions.get_host_data",
  "arguments": {
    "detail_response": true,
    "dataset_id": 0,
    "address": "secure3.example.com"
  }
}
```

The assistant reviews the detailed data for each host, checking for similarities (e.g., outage timestamps, high response times, DNS failures).

Assistant:  
“Here’s what I found: All three alerts occurred within the same ten-minute window. Each was triggered by an increase in response time and packet loss. This pattern suggests a shared dependency or infrastructure issue.”

User:  
“Could this be a DNS or network backbone problem? Can you check if their DNS lookups also saw issues at the same time?”

The assistant uses the monitoring history and further narrows down by querying all hosts with DNS endpoint monitoring and correlates by the same time range:

```json
{
  "name": "functions.get_host_list",
  "arguments": {
    "detail_response": true,
    "endpoint": "dns"
  }
}
```

After obtaining the list of all hosts using DNS monitoring, the assistant then queries their historical monitoring data for the affected window.

```json
{
  "name": "functions.get_host_data",
  "arguments": {
    "detail_response": true,
    "date_start": "2025-06-13T14:50:00",
    "date_end": "2025-06-13T15:10:00",
    "endpoint": "dns"
  }
}
```

Reviewing responses, the assistant might see that all DNS-based checks exhibited failures at that time, strengthening the suspicion of a DNS infrastructure issue.

Assistant:  
“Reviewing DNS checks, there was a noticeable spike in latency and errors for all monitored domains during the incident window. This strongly points to a DNS service disruption as the root cause impacting multiple systems.”

User:  
“Excellent. Can you suggest anything else I should check for corroboration or future prevention?”

Assistant:  
“You might also want to:  
- Check logs on your DNS servers for that timeframe.  
- Consider setting up alert correlation for patterns that span multiple endpoints.  
- Regularly review your dependency map to see which services share critical infrastructure.”

---

This blog post demonstrates how the [Quantum Network Monitor Assistant](https://readyforquantum.com/?assistant=open) empowers users to ask natural questions (“What caused all these service alerts?”) and then handle the technical heavy lifting—correlating monitoring data, filtering by time, endpoint, and even infrastructure component. Each step, from initial symptom gathering to cross-service pattern recognition, leverages function calls behind the scenes:

- get_host_data for granular, time-anchored metrics
- get_host_list to filter by monitoring type or endpoint
- AI-driven pattern recognition to draw logical connections the moment the data comes back

With the [Quantum Network Monitor Assistant](https://readyforquantum.com/?assistant=open), even complex, multi-system issues become manageable. Just describe your symptoms or questions in natural language and let AI guide you, streamlining root cause analysis like never before.

Curious how this might work for your environment? Engage with the [Quantum Network Monitor Assistant](https://readyforquantum.com/?assistant=open) today and transform your troubleshooting workflow!