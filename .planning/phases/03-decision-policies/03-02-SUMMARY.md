---
phase: 03-decision-policies
plan: 02
subsystem: autonomous
tags: [decision-policies, autonomous-mode, new-project, policy-integration]

# Dependency graph
requires:
  - phase: 03-decision-policies
    plan: 01
    provides: decision-policies.md with POLICY-01 through POLICY-04 definitions
provides:
  - Autonomous policy handling in /gsd:new-project for 4 decision points
  - Observable condition checks integrated at each decision point
  - Trace format output for all autonomous decisions
affects: [04-workflow-integration, new-project usage]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Autonomous wrapper pattern (AUTONOMOUS flag check before each decision)
    - Policy reference pattern (Apply POLICY-XX with trace output)
    - Config-gated research toggle
    - Coverage verification with retry loop

key-files:
  created: []
  modified:
    - commands/gsd/new-project.md

key-decisions:
  - "AUTONOMOUS flag read once in Phase 1 Setup, used at all decision points"
  - "Interactive paths remain unchanged (autonomy is additive)"
  - "Roadmap revision retry (max 2 iterations) before human fallback"

patterns-established:
  - "Autonomous wrapper: If AUTONOMOUS=true apply policy, else interactive flow"
  - "Policy trace: Auto-decided: {choice} -- {reason} [POLICY-XX, {details}]"
  - "Coverage verification: Count mapped vs total requirements"

# Metrics
duration: 2min
completed: 2026-01-26
---

# Phase 3 Plan 2: Policy Integration in new-project.md Summary

**Integrated POLICY-01 (brownfield), POLICY-02 (research), POLICY-03 (feature scoping), and POLICY-04 (roadmap approval) into new-project.md with autonomous wrappers at each decision point**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-26T21:27:22Z
- **Completed:** 2026-01-26T21:29:23Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Added decision-policies.md and autonomous.md references to execution_context
- Integrated AUTONOMOUS flag reading in Phase 1 Setup (step 4)
- POLICY-01: Auto-trigger codebase mapping when code exists without map (Phase 2)
- POLICY-02: Config-gated research toggle with greenfield detection (Phase 6)
- POLICY-03: Feature scoping with table stakes/differentiator/out-of-scope classification (Phase 7)
- POLICY-04: Roadmap approval with coverage verification and retry loop (Phase 8)
- All interactive paths preserved unchanged

## Task Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add autonomous flag reading and POLICY-01/02 | 8e44a45 | commands/gsd/new-project.md |
| 2 | Add POLICY-03 and POLICY-04 | 9b41ef3 | commands/gsd/new-project.md |

## Deviations from Plan

None - plan executed exactly as written.

## Key Patterns Implemented

### Autonomous Wrapper Pattern

Each decision point follows this pattern:

```markdown
**If AUTONOMOUS=true:**
Apply POLICY-XX ([policy name]):
[observable condition checks]
[trace output]
[execute decision]

**If AUTONOMOUS=false:**
[original interactive flow unchanged]
```

### Policy Trace Format

All autonomous decisions output traces:
- `Auto-decided: map codebase -- Code exists without map [POLICY-01, file: {file}]`
- `Auto-decided: research enabled -- Greenfield project [POLICY-02, config: workflow.research=true]`
- `Auto-decided: v1 -- Table stakes feature ({feature}) [POLICY-03, FEATURES.md:Table stakes]`
- `Auto-decided: approve roadmap -- 100% requirement coverage [POLICY-04, {mapped}/{total}]`

## Next Phase Readiness

- POLICY-01 through POLICY-04 now integrated in new-project.md
- /gsd:new-project can run end-to-end with zero human input when autonomous=true
- Ready for 03-03 (execute-plan.md integration) and 03-04 (plan-phase.md integration)
