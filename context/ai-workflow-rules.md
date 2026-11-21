# AI Workflow Rules

## Approach

Build MediBook incrementally using a spec-driven workflow. The context files (`project-overview.md`, `architecture.md`, `code-standards.md`, `ui-context.md`, `progress-tracker.md`) define what to build, how to build it, and the current state of progress. Always implement against these specs. Do not infer or invent behavior from scratch.

## Scoping Rules

- Work on one feature unit at a time
- Prefer small, verifiable increments over large speculative changes
- Do not combine unrelated system boundaries in a single implementation step

## When to Split Work

Split an implementation step if it combines:

- Database changes (migrations, RLS) and a large UI build
- Frontend changes and Edge Function or cron changes
- Work for more than one role (patient, doctor, admin) at once
- Behavior not clearly defined in the context files

If a change cannot be verified end to end quickly, the scope is too broad. Split it.

## Handling Missing Requirements

- Do not invent product behavior not defined in the context files
- If a requirement is ambiguous, resolve it in the relevant context file before implementing
- If a requirement is missing, add it as an open question in `progress-tracker.md` before continuing

## Protected Files

Do not modify the following unless explicitly instructed:

- `src/components/ui/*`: generated shadcn/ui components
- Existing files in `supabase/migrations/`: add a new migration instead of editing an applied one
- `.env` and `.env.local`: never commit or print secrets
- `src/types/database.ts`: regenerate it from Supabase, do not edit by hand
- Third-party library internals

## Keeping Docs in Sync

Update the relevant context file whenever implementation changes:

- System architecture or boundaries
- Storage model decisions (tables, columns, RLS rules)
- Code conventions or standards
- Feature scope

## Before Moving to the Next Unit

1. The current unit works end to end within its defined scope
2. No invariant defined in `architecture.md` was violated
3. RLS was checked by testing as each affected role
4. `progress-tracker.md` reflects the completed work
5. `npm run build` passes with no TypeScript errors
