# Task Master AI — optional local developer integration

This repository exposes Task Master AI **only** to developer tooling through `.mcp.json`.
It does **not** install anything in production, change application dependencies, add
a GitHub Action, deploy, merge PRs, or automatically invoke an AI provider.

## Local activation (explicit opt-in)

1. Use **Node.js 20 or newer**, npm/npx, and a trusted Claude Code workspace.
2. Open this repository locally in Claude Code; inspect `.mcp.json` and explicitly
   approve the project MCP server when prompted.
3. Run `/mcp` to inspect whether `task-master-ai` connects successfully.
4. The server runs `npx -y task-master-ai@0.43.1`, with
   `TASK_MASTER_TOOLS=core` (seven essential tools, reduced context usage).
5. Initialize project tasks *only after* reviewing existing agent instructions,
   plans, changes, PRs, CI status and allowed model/provider configuration.
   Task Master task-planning operations such as parsing a PRD or expanding tasks
   may invoke an external model and incur charges. **Do not configure or invoke
   paid APIs or hosted models without owner approval.** Merely adding MCP does
   not guarantee no-cost AI execution.

## Security, licensing and operational boundaries

- Never put API keys, tokens, customer/student data or other secrets in
  `.mcp.json`, prompts, generated task files or version control.
- This integration has no rights to auto-merge, deploy, disable safety gates,
  update production databases, or modify runtime behavior.
- Before acting on any task, re-check the latest default branch, open PRs,
  repository agent rules and required tests to avoid concurrent-edit conflicts.
- Keep sensitive generated `.taskmaster/` data local unless inspected and
  intentionally approved for a commit.
- Upstream is `eyaltoledano/claude-task-master`; its license is
  **MIT with Commons Clause**. Do not repackage or sell Task Master as a service.
  Evaluate license terms separately before any commercial redistribution.
- The pinned npm version is `0.43.1`; review security, license and upstream
  changes before updating the pin. Package execution is a local developer action,
  not a GitHub-hosted automatic installation.

## Quick configuration validation

```bash
node -e "JSON.parse(require('fs').readFileSync('.mcp.json', 'utf8')); console.log('valid .mcp.json')"
```

This check validates JSON syntax only. A live MCP startup, model configuration,
any AI-driven tasks, and project-specific tests require an authorized local
developer environment and are **not** proven by this configuration-only PR.
