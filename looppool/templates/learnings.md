# Learnings Template

Template for `.planning/LEARNINGS.md` — operational knowledge that persists across loop iterations.

---

## File Template

```markdown
# Operational Learnings

Project-specific knowledge captured during loop iterations. Read by every iteration agent for pattern consistency.

**Updated by:** Human observation + auto-capture during iterations
**Read by:** Every loop iteration before task execution

## Validation Commands

Commands that must pass before any commit. Failures trigger self-correction.

```bash
# Primary validation (must all pass)
{{PRIMARY_VALIDATION}}

# Secondary validation (run if primary passes)
{{SECONDARY_VALIDATION}}
```

## Patterns

Project-specific code patterns to follow. Append entries as patterns emerge during iterations.

### File Organization
<!-- Example: "Components in src/components/, one per file, PascalCase naming" -->

### Code Style
<!-- Example: "Use named exports, avoid default exports" -->

### API Conventions
<!-- Example: "REST endpoints in app/api/, return { data, error } shape" -->

### Testing Patterns
<!-- Example: "Co-locate tests as *.test.ts, use vitest, mock external services" -->

## Constraints

### Do NOT

<!-- Anti-patterns discovered during iterations -->
<!-- Example: "- Do NOT use any in TypeScript — use unknown + type guards" -->
<!-- Example: "- Do NOT import from barrel files — causes circular deps" -->

### Do

<!-- Enforced patterns discovered during iterations -->
<!-- Example: "- Do use server actions for mutations (not API routes)" -->
<!-- Example: "- Do validate all inputs with zod at API boundary" -->

## Session Decisions

Decisions made during loop iterations. Ensures consistency across fresh contexts.

| ID | Decision | Choice | Reason | Iteration |
|----|----------|--------|--------|-----------|

## Discovered Issues

Problems encountered during iterations. Tracks resolution and blocker status.

| Date | Issue | Resolution | Blocker? | Iteration |
|------|-------|------------|----------|-----------|
```

---

<purpose>

LEARNINGS.md is the loop's long-term memory. Each iteration runs in a fresh 200k context with no memory of previous iterations. LEARNINGS.md bridges this gap.

**Problem it solves:** Without shared knowledge, iteration N+1 repeats mistakes from iteration N. Patterns diverge. Decisions contradict.

**Solution:** A single file that accumulates operational knowledge:
- **Validation commands** — what must pass before commits
- **Patterns** — how code should be structured
- **Constraints** — what to avoid and what to enforce
- **Decisions** — choices made for consistency
- **Issues** — problems encountered and resolutions

**Relationship to Ralph's AGENTS.md:** LEARNINGS.md evolves Ralph's concept of human-maintained agent guidance into a structured, partially auto-captured knowledge base.

</purpose>

<update_rules>

### Human Updates

Human observes loop output and appends entries:
- Patterns section: When noticing inconsistent code styles
- Constraints section: When iterations make avoidable mistakes
- Any section: At any time, based on observation

### Auto-Capture Updates

Each iteration appends entries when:
- A validation failure reveals a new constraint
- A codebase search reveals a new pattern
- A decision is made that future iterations should follow

**Auto-capture rules:**
- Only append genuinely new information
- Do not duplicate existing entries
- Keep entries concise (one line per pattern/constraint)
- Include iteration number for traceability
- Do not remove or modify existing entries (append-only)

### Size Management

Keep LEARNINGS.md under 150 lines. If approaching limit:
- Consolidate redundant patterns
- Archive resolved issues (remove from table)
- Keep only active decisions (archive old ones)

</update_rules>

<placeholder_reference>

| Placeholder | Source | Example |
|-------------|--------|---------|
| `{{PRIMARY_VALIDATION}}` | Detected from project | `npm test\nnpm run build` |
| `{{SECONDARY_VALIDATION}}` | Detected from project | `npm run lint\nnpm run typecheck` |

</placeholder_reference>
