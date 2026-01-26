# Phase 5: Architecture Refactoring - Research

**Researched:** 2026-01-27
**Domain:** Markdown-based prompt engineering module extraction
**Confidence:** HIGH

## Summary

This phase addresses technical debt in GSD's monolithic files by extracting focused modules. The primary targets are three large files: `gsd-planner.md` (1386 lines), `gsd-executor.md` (784 lines), and `execute-plan.md` (2059 lines). The approach leverages the existing GSD architecture pattern where references contain reusable logic that agents and workflows include via `@` references.

The research confirms that GSD already uses modular extraction successfully: `checkpoints.md` (1078 lines), `decision-policies.md` (773 lines), and `autonomous.md` (319 lines) in `get-shit-done/references/` demonstrate the pattern. Each reference is a self-contained document covering a single concern, included via `@~/.claude/get-shit-done/references/...` paths.

**Primary recommendation:** Extract logical sections from monolithic files into focused references (<500 lines each), update parent files to include references via `@` paths, validate extraction by confirming each module is self-contained (no circular references, all needed context included).

## Standard Stack

### Core

| Component | Version | Purpose | Why Standard |
|-----------|---------|---------|--------------|
| Markdown (XML-extended) | N/A | Document structure | GSD native format |
| YAML frontmatter | N/A | Machine-readable metadata | Parsed by workflows |
| @ references | N/A | Module inclusion | GSD context assembly |

### Supporting

| Component | Version | Purpose | When to Use |
|-----------|---------|---------|-------------|
| grep/regex | POSIX | Pattern matching for validation | Verify references exist |
| wc -l | POSIX | Line counting for size targets | Enforce <500 line limit |

### Alternatives Considered

None applicable - this is pure refactoring within existing GSD patterns.

## Architecture Patterns

### Recommended Module Structure

```
agents/
├── gsd-planner.md               # Core agent (orchestration + inclusion)
├── gsd-executor.md              # Core agent (orchestration + inclusion)
└── ... (other agents unchanged)

get-shit-done/
├── references/
│   ├── planner/                 # NEW: planner module references
│   │   ├── discovery-levels.md
│   │   ├── task-breakdown.md
│   │   ├── dependency-graph.md
│   │   ├── goal-backward.md
│   │   └── gap-closure.md
│   ├── executor/                # NEW: executor module references
│   │   ├── deviation-rules.md
│   │   ├── tdd-execution.md
│   │   └── task-commit.md
│   ├── execute-plan/            # NEW: workflow module references
│   │   ├── segment-routing.md
│   │   ├── checkpoint-protocol.md
│   │   └── agent-tracking.md
│   ├── state-schema.md          # NEW: STATE.md schema definition
│   └── ... (existing references)
└── workflows/
    └── execute-plan.md          # Slimmed down (orchestration only)
```

### Pattern 1: Reference Extraction

**What:** Move self-contained sections from agents/workflows to dedicated reference files.

**When to use:** Section is reusable, >100 lines, has clear boundaries (XML tags or headers).

**Example:**
```markdown
# Before (in gsd-planner.md)
<task_breakdown>
[200+ lines of task breakdown logic]
</task_breakdown>

# After (in gsd-planner.md)
<task_breakdown>
See: @~/.claude/get-shit-done/references/planner/task-breakdown.md
</task_breakdown>

# references/planner/task-breakdown.md
# Task Breakdown Reference

[200+ lines of task breakdown logic - complete and self-contained]
```

### Pattern 2: Slim Agent Pattern

**What:** Agent files contain role, philosophy, execution flow outline; heavy logic in references.

**When to use:** Agent file exceeds 500 lines.

**Structure:**
```markdown
---
name: gsd-planner
description: [brief]
tools: [tools]
---

<role>
[Core identity and responsibilities]
</role>

<philosophy>
[Key principles - kept inline as they define the agent's approach]
</philosophy>

<required_reading>
@~/.claude/get-shit-done/references/planner/discovery-levels.md
@~/.claude/get-shit-done/references/planner/task-breakdown.md
@~/.claude/get-shit-done/references/planner/dependency-graph.md
@~/.claude/get-shit-done/references/planner/goal-backward.md
</required_reading>

<execution_flow>
[Step-by-step process referencing included materials]
</execution_flow>

<structured_returns>
[Output formats]
</structured_returns>

<success_criteria>
[Completion checklist]
</success_criteria>
```

### Pattern 3: Orchestrator-Only Workflow

**What:** Workflow files handle orchestration; implementation details in references.

**When to use:** Workflow file exceeds 500 lines.

**Structure:**
```markdown
<purpose>
[Brief workflow purpose]
</purpose>

<required_reading>
@~/.claude/get-shit-done/references/execute-plan/segment-routing.md
@~/.claude/get-shit-done/references/execute-plan/checkpoint-protocol.md
</required_reading>

<process>
[Step-by-step orchestration calling out to references]
</process>
```

### Anti-Patterns to Avoid

- **Circular references:** Reference A includes Reference B which includes Reference A. Validate: each reference is self-contained or includes only "deeper" references.
- **Over-extraction:** Extracting 50-line sections creates file sprawl. Minimum extraction size: ~100 lines.
- **Breaking context:** Splitting tightly coupled logic across files. Keep related logic together (e.g., deviation rules 1-4 stay in one file).
- **Inline duplication:** Copying logic instead of referencing. Use `@` paths consistently.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Module inclusion | Custom loader | `@` path references | GSD native context assembly |
| Schema validation | JSON Schema library | Markdown-based schema doc | No runtime dependencies |
| Line counting | Custom script | `wc -l` | Standard Unix tool |
| Reference validation | Custom parser | `grep -l` + file existence | Simple, reliable |

**Key insight:** GSD is a meta-prompting system, not a runtime application. "Validation" means ensuring humans and Claude can follow the structure, not programmatic parsing.

## Common Pitfalls

### Pitfall 1: Breaking @-Path References

**What goes wrong:** After extraction, `@` paths in parent files point to non-existent locations.

**Why it happens:** File moves without updating all references.

**How to avoid:** After each extraction:
1. Search all `.md` files for references to the moved section
2. Update paths to new reference location
3. Verify with `grep -r "section-name" --include="*.md"`

**Warning signs:** Claude reports "file not found" or doesn't apply expected context.

### Pitfall 2: Context Loss at Boundaries

**What goes wrong:** Extracted reference lacks context from parent file (e.g., variable definitions, shared state).

**Why it happens:** Section relied on context defined earlier in parent.

**How to avoid:** Each reference must be self-contained:
- Define all variables/concepts it uses
- Include minimal necessary context at top
- Or explicitly reference where context comes from

**Warning signs:** Reference makes sense in isolation but fails when actually used.

### Pitfall 3: Over-Fragmentation

**What goes wrong:** Too many small files (50-100 lines each), navigation becomes difficult.

**Why it happens:** Mechanical splitting by section without considering coherence.

**How to avoid:**
- Minimum extraction: ~100 lines
- Group related concerns (all deviation rules together)
- Test: "Does this reference represent a complete concept?"

**Warning signs:** More than 5-6 references for a single agent/workflow.

### Pitfall 4: STATE.md Schema Drift

**What goes wrong:** Schema document and actual STATE.md usage diverge.

**Why it happens:** Workflows/agents parse STATE.md with regex; schema not enforced.

**How to avoid:**
- Schema document lists REQUIRED fields and OPTIONAL fields
- Workflows must only rely on REQUIRED fields
- Document field addition process in schema

**Warning signs:** Different workflows expect different STATE.md sections.

## Code Examples

### STATE.md Schema Definition Pattern

```markdown
# STATE.md Schema Reference

**Version:** 1.0
**Updated:** 2026-01-27

## Required Fields

Every STATE.md MUST contain these sections. Workflows may fail if missing.

### Project Reference (REQUIRED)
```markdown
## Project Reference

See: .planning/PROJECT.md (updated [YYYY-MM-DD])

**Core value:** [string - one-liner from PROJECT.md]
**Current focus:** [string - current phase name]
```

Fields:
- `See:` - Path to PROJECT.md (always `.planning/PROJECT.md`)
- `updated` - Date in YYYY-MM-DD format
- `Core value:` - Single line extracted from PROJECT.md
- `Current focus:` - Current phase name

### Current Position (REQUIRED)
```markdown
## Current Position

Phase: [N] of [M] ([Phase name])
Plan: [A] of [B] in current phase
Status: [Ready to plan | Planning | Ready to execute | In progress | Phase complete]
Last activity: [YYYY-MM-DD] — [Description]

Progress: [░█ characters] [N]%
```

Fields:
- `Phase:` - Format: `N of M (Name)`
- `Plan:` - Format: `A of B in current phase`
- `Status:` - One of enumerated values
- `Last activity:` - Date and description
- `Progress:` - Visual bar and percentage

## Optional Fields

These sections may be present. Workflows MUST handle their absence.

### Performance Metrics (OPTIONAL)
[specification]

### Accumulated Context (OPTIONAL)
[specification]

### Session Continuity (OPTIONAL)
[specification]
```

### STATE.md Auto-Recovery Pattern

```markdown
# State Auto-Recovery

When STATE.md is missing but ROADMAP.md exists, reconstruct minimal STATE.md:

## Recovery Algorithm

1. Check for `.planning/ROADMAP.md`
   - If missing: Cannot recover, error to user
   - If exists: Continue

2. Extract phase information from ROADMAP.md:
   - Count total phases (lines matching `### Phase N:`)
   - Find first incomplete phase (checkbox not checked: `- [ ]`)
   - Extract phase name from header

3. Generate minimal STATE.md:
```markdown
# Project State

## Project Reference

See: .planning/PROJECT.md (updated [today])

**Core value:** [Read from PROJECT.md if exists, else "Unknown"]
**Current focus:** Phase [N] - [Name]

## Current Position

Phase: [N] of [total] ([Name])
Plan: 0 of TBD in current phase
Status: Ready to plan
Last activity: [today] — STATE.md auto-recovered from ROADMAP.md

Progress: [calculated from phases] %

## Accumulated Context

### Decisions
Auto-recovered. Run /gsd:progress to refresh.

### Pending Todos
None.

### Blockers/Concerns
None.

## Session Continuity

Last session: [now]
Stopped at: STATE.md auto-recovered
Resume file: None
```

4. Write to `.planning/STATE.md`
5. Log: `STATE.md auto-recovered from ROADMAP.md. Run /gsd:progress to validate.`
```

### Atomic JSON Operations Pattern

```markdown
# Atomic JSON Operations

For config.json edits, use write-temp-verify-move pattern to prevent corruption.

## Pattern

```bash
# 1. Read current config
CONFIG=$(cat .planning/config.json 2>/dev/null || echo '{}')

# 2. Modify in memory (example: set autonomous flag)
NEW_CONFIG=$(echo "$CONFIG" | jq '.autonomous = true')

# 3. Write to temp file
echo "$NEW_CONFIG" > .planning/config.json.tmp

# 4. Verify temp file is valid JSON
if ! jq empty .planning/config.json.tmp 2>/dev/null; then
  rm .planning/config.json.tmp
  echo "ERROR: JSON validation failed, config unchanged"
  exit 1
fi

# 5. Atomic move (replaces original)
mv .planning/config.json.tmp .planning/config.json

# 6. Log success
echo "Config updated successfully"
```

## Error Recovery

If process interrupted between steps 3-5:
- `.planning/config.json.tmp` exists alongside `.planning/config.json`
- Next operation should check for `.tmp` and remove it
- Original config is preserved

## Pre-flight Check

```bash
# Remove stale temp files before any config operation
rm -f .planning/config.json.tmp
```
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single monolithic agents | Modular agents with references | GSD 1.9.x | Better maintainability |
| Inline deviation rules | Dedicated deviation-rules.md | Phase 5 | Clearer boundaries |
| Regex STATE.md parsing | Schema-driven validation | Phase 5 | Prevents drift |
| Direct JSON write | Atomic write pattern | Phase 5 | Prevents corruption |

**Deprecated/outdated:**
- None - this is net new refactoring

## Open Questions

### 1. Reference Directory Structure

**What we know:** References currently flat in `get-shit-done/references/`. New references could be flat or nested.

**What's unclear:** Flat (all in references/) vs nested (references/planner/, references/executor/).

**Recommendation:** Use nested structure for agent-specific references to maintain grouping. Keep workflow-agnostic references flat.

### 2. Minimum Viable STATE.md

**What we know:** STATE.md has many optional sections. Auto-recovery needs minimal required set.

**What's unclear:** Exactly which fields are truly required for basic workflow operation.

**Recommendation:** Define minimal required set in schema. Test by creating minimal STATE.md and running `/gsd:progress`.

## Sources

### Primary (HIGH confidence)

- `/Users/narcisbrindusescu/newme/gsd/agents/gsd-planner.md` - Source file analysis (1386 lines)
- `/Users/narcisbrindusescu/newme/gsd/agents/gsd-executor.md` - Source file analysis (784 lines)
- `/Users/narcisbrindusescu/newme/gsd/get-shit-done/workflows/execute-plan.md` - Source file analysis (2059 lines)
- `/Users/narcisbrindusescu/newme/gsd/.planning/codebase/CONCERNS.md` - Tech debt analysis
- `/Users/narcisbrindusescu/newme/gsd/.planning/codebase/ARCHITECTURE.md` - Architecture patterns
- `/Users/narcisbrindusescu/newme/gsd/get-shit-done/references/autonomous.md` - Reference pattern example
- `/Users/narcisbrindusescu/newme/gsd/get-shit-done/templates/state.md` - STATE.md template

### Secondary (MEDIUM confidence)

- `/Users/narcisbrindusescu/newme/gsd/.planning/REQUIREMENTS.md` - DEBT-01 through DEBT-06 specifications

### Tertiary (LOW confidence)

None - all findings based on codebase analysis, no external sources needed.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - GSD native patterns, no external dependencies
- Architecture: HIGH - Based on existing successful patterns in codebase
- Pitfalls: HIGH - Derived from CONCERNS.md and codebase analysis

**Research date:** 2026-01-27
**Valid until:** No expiry - internal refactoring, no external dependencies
