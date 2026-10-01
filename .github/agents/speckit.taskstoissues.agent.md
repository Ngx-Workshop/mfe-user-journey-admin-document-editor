---
description: Convert existing tasks into actionable, dependency-ordered GitHub issues for the feature based on available design artifacts.
tools: ['github/github-mcp-server/issue_write']
---

## Repository context (document workflow)

Read `AGENTS.md`, `docs/architecture.md`, `docs/development.md`,
`docs/api-contracts.md` and `.specify/README.md` before this command.
This repository uses the local Markdown workflow. When generic instructions below
conflict with it, follow the local workflow: use explicit user-selected feature
folders, optional research/data-model/quickstart artifacts, and evidence-based
handoffs. Ordinary file edits are supported; do not require helper scripts, branch
creation, agent delegation or repeated approvals. Do not overwrite an existing plan
with setup-plan.sh or regenerate the maintained AGENTS.md. Treat the constitution
as an adopted document, not an unfilled template. Keep stable context in docs and
feature progress in specs. Creating remote issues requires a user request for that action.


## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Outline

1. Run `.specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks` from repo root and parse FEATURE_DIR and AVAILABLE_DOCS list. All paths must be absolute. For single quotes in args like "I'm Groot", use escape syntax: e.g 'I'\''m Groot' (or double-quote if possible: "I'm Groot").
1. From the executed script, extract the path to **tasks**.
1. Get the Git remote by running:

```bash
git config --get remote.origin.url
```

> [!CAUTION]
> ONLY PROCEED TO NEXT STEPS IF THE REMOTE IS A GITHUB URL

1. For each task in the list, use the GitHub MCP server to create a new issue in the repository that is representative of the Git remote.

> [!CAUTION]
> UNDER NO CIRCUMSTANCES EVER CREATE ISSUES IN REPOSITORIES THAT DO NOT MATCH THE REMOTE URL
