---
title: Creating And Deploying Custom Command Processors With The Assistant
date: 2025-11-19T09:00:00
image: /blogpics/apipicgen/creatinganddeployingcustomcommandprocessorswiththeassistant-BUZWYB04ON.jpg
categories: ["Custom Automation", "DevOps"]
featured: false
draft: false
questions:
  - "Why did the walkthrough first call get_agents before creating the processor?"
  - "What arguments does the DiskSpaceCheck processor support?"
  - "How can I tell whether the processor found a warning or an error?"
  - "Can I retrieve the processor source code after deploying it?"
  - "Is it possible to modify or remove the processor later?"
answers:
  - "Because the processor has to be created on a specific agent. The get_agents call lists available machines and environments so the user can choose the right target, such as the Windows server used for the disk space check."
  - "It supports --path to choose the drive or directory to inspect and --warn to set the warning threshold percentage. If not provided, it defaults to the system drive and a 10% warning threshold."
  - "The processor uses exit codes and output content. Exit code 0 means OK, exit code 2 means a warning threshold was triggered, and exit code 1 means an error occurred. In the updated version, stdout also returns JSON with fields like Status and Message to make parsing easier."
  - "Yes. The walkthrough shows a call to retrieve the current source for the DiskSpaceCheck processor from the agent, which lets you review it and store it in version control."
  - "Yes. The post demonstrates both updating the processor with new C# source and deleting it entirely. That means you can iterate on functionality over time and remove the processor when it is no longer needed."
---
In this walkthrough, we’ll show how a user and the Quantum Network Monitor Assistant collaborate to create, upload, and test a custom .NET command processor for advanced automation—end to end. Along the way, we’ll demonstrate the relevant function calls, how to interpret responses, and how each step informs the next action. If you want to try these steps yourself, open the Quantum Network Monitor Assistant at https://readyforquantum.com/?assistant=open.

User: I need a custom .NET processor that checks disk space on a Windows server and returns a warning if free space drops below a threshold. Can we build it, upload it, and test it?

Assistant: Great idea. First, let’s find an agent to host and run your processor. We’ll list your available agents so you can choose a target machine.

Function call we’d use:
```json
{
  "name": "functions.get_agents",
  "arguments": {
    "detail_response": false
  }
}
```
How we interpret the response: The system returns a short list of agent locations and capabilities, e.g.:
- Scanner - EU (cloud)
- Home Office - Mac mini
- Branch Office - Windows Server

We’ll target “Branch Office - Windows Server” for a Windows-based disk check.

Assistant: I’ll check what command processors you already have on that Windows agent.

Function call we’d use:
```json
{
  "name": "functions.call_cmd_processor_expert",
  "arguments": {
    "agent_location": "Branch Office - Windows Server",
    "message": "List available cmd processors on this agent. I am authorized to perform this action."
  }
}
```
How we interpret the response: The expert typically returns a list like:
- NetDiag
- ServiceRestarter
- (none related to disk checks yet)
That tells us we’re clear to add a new one.

Assistant: Let’s create a new .NET command processor named “DiskSpaceCheck” with two arguments:
- --path (optional): drive or directory to inspect; defaults to system drive
- --warn (optional): warn if free percentage is below this value; defaults to 10

We’ll provide the full source code in our creation request so the expert can compile and install it on the chosen agent.

Function call we’d use:
```json
{
  "name": "functions.call_cmd_processor_expert",
  "arguments": {
    "agent_location": "Branch Office - Windows Server",
    "message": "Create a new cmd processor named 'DiskSpaceCheck'. I am authorized to perform this action. Source code (C# .NET):\n\nBEGIN SOURCE\nusing System;\nusing System.IO;\n\npublic class DiskSpaceCheck\n{\n    public static int Main(string[] args)\n    {\n        string path = Environment.GetFolderPath(Environment.SpecialFolder.System);\n        long warnPercent = 10; // default warn threshold\n\n        for (int i = 0; i < args.Length; i++)\n        {\n            if (args[i] == \"--path\" && i + 1 < args.Length) path = args[++i];\n            else if (args[i] == \"--warn\" && i + 1 < args.Length) warnPercent = long.Parse(args[++i]);\n            else if (args[i] == \"-h\" || args[i] == \"--help\")\n            {\n                Console.WriteLine(\"Usage: DiskSpaceCheck --path C:\\\\ --warn 10\");\n                Console.WriteLine(\"Checks free space percentage and returns exit code 2 if below warn.\");\n                return 0;\n            }\n        }\n\n        try\n        {\n            string root = Path.GetPathRoot(path) ?? path;\n            var di = new DriveInfo(root);\n            long free = di.AvailableFreeSpace;\n            long total = di.TotalSize;\n            double pct = total > 0 ? (free * 100.0 / total) : 0.0;\n\n            Console.WriteLine($\"OK: {pct:F1}% free on {root} ({free/1024/1024/1024} GB / {total/1024/1024/1024} GB)\");\n            if (pct < warnPercent)\n            {\n                Console.Error.WriteLine($\"WARN: below {warnPercent}% free on {root}\");\n                return 2; // non-zero for warn\n            }\n            return 0;\n        }\n        catch (Exception ex)\n        {\n            Console.Error.WriteLine(\"ERROR: \" + ex.Message);\n            return 1;\n        }\n    }\n}\nEND SOURCE"
  }
}
```
How we interpret the response: The expert confirms “DiskSpaceCheck” created successfully, compiled with no errors, and is now available on “Branch Office - Windows Server.”

User: Let’s test it against C:\ with a 15% warning threshold.

Assistant: Running the processor with arguments now.

Function call we’d use:
```json
{
  "name": "functions.call_cmd_processor_expert",
  "arguments": {
    "agent_location": "Branch Office - Windows Server",
    "message": "Run the cmd processor 'DiskSpaceCheck' with arguments: --path C:\\\\ --warn 15. I am authorized to perform this action."
  }
}
```
How we interpret the response: The expert returns the standard output, standard error (if any), and exit code. Example:
- stdout: “OK: 32.7% free on C:\ (98 GB / 300 GB)”
- stderr: “” (empty)
- exitCode: 0
This indicates success with no warning.

User: Can we see built-in usage/help text for reference?

Assistant: Sure—requesting help.

Function call we’d use:
```json
{
  "name": "functions.call_cmd_processor_expert",
  "arguments": {
    "agent_location": "Branch Office - Windows Server",
    "message": "Get help for the cmd processor 'DiskSpaceCheck'. I am authorized to perform this action."
  }
}
```
How we interpret the response: You’ll get the usage string we included in the code: “Usage: DiskSpaceCheck --path C:\ --warn 10 …”

User: I’d prefer JSON output so my tooling can parse it easily. Can we update the processor to print JSON and use exit code 2 only on warn?

Assistant: Absolutely. We’ll update the source with a JSON payload on stdout. This will help downstream automation parse results cleanly.

Function call we’d use:
```json
{
  "name": "functions.call_cmd_processor_expert",
  "arguments": {
    "agent_location": "Branch Office - Windows Server",
    "message": "Update the cmd processor 'DiskSpaceCheck' with new source. I am authorized to perform this action. New Source (C# .NET):\n\nBEGIN SOURCE\nusing System;\nusing System.IO;\nusing System.Text.Json;\n\npublic class DiskSpaceCheck\n{\n    public class Result\n    {\n        public string Drive { get; set; } = \"\";\n        public double PercentFree { get; set; }\n        public long FreeBytes { get; set; }\n        public long TotalBytes { get; set; }\n        public long WarnPercent { get; set; }\n        public string Status { get; set; } = \"OK\";\n        public string Message { get; set; } = \"\";\n    }\n\n    public static int Main(string[] args)\n    {\n        string path = Environment.GetFolderPath(Environment.SpecialFolder.System);\n        long warnPercent = 10;\n\n        for (int i = 0; i < args.Length; i++)\n        {\n            if (args[i] == \"--path\" && i + 1 < args.Length) path = args[++i];\n            else if (args[i] == \"--warn\" && i + 1 < args.Length) warnPercent = long.Parse(args[++i]);\n            else if (args[i] == \"-h\" || args[i] == \"--help\")\n            {\n                Console.WriteLine(\"Usage: DiskSpaceCheck --path C:\\\\ --warn 10\");\n                Console.WriteLine(\"Outputs JSON with fields: Drive, PercentFree, FreeBytes, TotalBytes, WarnPercent, Status, Message\");\n                return 0;\n            }\n        }\n\n        try\n        {\n            string root = Path.GetPathRoot(path) ?? path;\n            var di = new DriveInfo(root);\n            long free = di.AvailableFreeSpace;\n            long total = di.TotalSize;\n            double pct = total > 0 ? (free * 100.0 / total) : 0.0;\n\n            var res = new Result\n            {\n                Drive = root,\n                PercentFree = Math.Round(pct, 1),\n                FreeBytes = free,\n                TotalBytes = total,\n                WarnPercent = warnPercent,\n                Status = pct < warnPercent ? \"WARN\" : \"OK\",\n                Message = pct < warnPercent ? $\"Below {warnPercent}% free\" : \"Within limits\"\n            };\n\n            Console.WriteLine(JsonSerializer.Serialize(res));\n            return pct < warnPercent ? 2 : 0;\n        }\n        catch (Exception ex)\n        {\n            var res = new Result { Status = \"ERROR\", Message = ex.Message };\n            Console.WriteLine(JsonSerializer.Serialize(res));\n            return 1;\n        }\n    }\n}\nEND SOURCE"
  }
}
```
How we interpret the response: The expert confirms the update compiled successfully. We’re ready to re-test.

User: Re-run with --warn 40 so we can see a warning condition.

Assistant: Executing now.

Function call we’d use:
```json
{
  "name": "functions.call_cmd_processor_expert",
  "arguments": {
    "agent_location": "Branch Office - Windows Server",
    "message": "Run the cmd processor 'DiskSpaceCheck' with arguments: --path C:\\\\ --warn 40. I am authorized to perform this action."
  }
}
```
How we interpret the response: Example output:
- stdout (JSON): \{"Drive":"C:\\","PercentFree":32.7,"FreeBytes":105553116266,"TotalBytes":322122547200,"WarnPercent":40,"Status":"WARN","Message":"Below 40% free"\}
- exitCode: 2
This structured result makes it trivial to route alerts, trigger remediation steps, or store historical metrics.

User: Can I review the current source and keep it in version control?

Assistant: Yes—let’s retrieve the source from the agent.

Function call we’d use:
```json
{
  "name": "functions.call_cmd_processor_expert",
  "arguments": {
    "agent_location": "Branch Office - Windows Server",
    "message": "Show me the source code for the cmd processor 'DiskSpaceCheck'. I am authorized to perform this action."
  }
}
```
How we interpret the response: The expert returns the full updated C# source we just deployed. You can copy this into your repository to track changes.

User: Looks good. If we ever need to remove it, can we delete the processor?

Assistant: Sure. Here’s how we’d do it.

Function call we’d use:
```json
{
  "name": "functions.call_cmd_processor_expert",
  "arguments": {
    "agent_location": "Branch Office - Windows Server",
    "message": "Delete the cmd processor named 'DiskSpaceCheck'. I am authorized to perform this action."
  }
}
```
How we interpret the response: The expert confirms deletion. The processor is no longer available on that agent.

What each function did in our flow:
- get_agents: Listed available agent locations so we could choose where to deploy and run our processor.
- call_cmd_processor_expert (list): Showed existing processors on the selected agent.
- call_cmd_processor_expert (create/update): Compiled and installed our .NET source code as a runnable command processor.
- call_cmd_processor_expert (run): Executed the processor with arguments and returned stdout, stderr, and exit code.
- call_cmd_processor_expert (help/source/delete): Provided usage info, fetched source for versioning, and removed the processor when no longer needed.

Wrap-up
With the Quantum Network Monitor Assistant, you can rapidly build, upload, iterate, and operationalize custom .NET command processors—no need to manually remote into servers or tinker with local compilers. From discovery (get_agents) to lifecycle management (create, run, update, source, delete), the Assistant streamlines advanced automation across your environment. Ready to try it? Open the assistant at https://readyforquantum.com/?assistant=open and start building your own processors today.