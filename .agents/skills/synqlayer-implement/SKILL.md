---
name: synqlayer-implement
description: "SynqLayer-safe implementation from a spec or tickets; no automatic commit/push/deploy."
disable-model-invocation: true
---

Implement the work described by the user in the spec or tickets.

Use /tdd where possible, at pre-agreed seams.

Run typechecking regularly, single test files regularly, and the full test suite once at the end.

Once done, invoke `synqlayer-code-review` using the current Codex skill invocation method supported in this repository (for Codex, use `$synqlayer-code-review`).

Do not commit automatically. Leave all changes uncommitted and show `git status` and the relevant diff summary to Hermano.

Commit only if the user gave explicit commit approval in the current request. Earlier general approval does not count.

Push only after separate explicit current user approval.

Deploy only after separate explicit current user approval.

Never run production deploys, database migrations, destructive commands, or issue-tracker writes unless explicitly approved in the current request.
