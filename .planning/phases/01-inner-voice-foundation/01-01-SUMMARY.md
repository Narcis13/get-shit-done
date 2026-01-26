---
phase: 01-inner-voice-foundation
plan: 01
subsystem: documentation
tags: [autonomous, config, decision-trace, graceful-degradation]

# Dependency graph
requires: []
provides:
  - Canonical autonomous flag reading pattern
  - Decision trace format specification
  - Checkpoint defaults documentation
  - Graceful degradation policies
affects: [execute-phase, execute-plan, all-workflows, gsd-executor, gsd-planner]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Autonomous decision wrapper: if AUTONOMOUS=true / if AUTONOMOUS=false"
    - "Decision trace format: Auto-decided: [choice] — [reason]"
    - "Assumption logging: Assumption: [what was assumed]"

key-files:
  created:
    - get-shit-done/references/autonomous.md
    - get-shit-done/references/autonomous-defaults.md
  modified: []

key-decisions:
  - "Em-dash (—) not hyphen (-) in trace format for consistency"
  - "Full commitment mode: all decisions auto-decided when enabled, no partial autonomy"
  - "checkpoint:human-action cannot be autonomous (requires human presence)"
  - "Safest option heuristic for decisions without policies"

patterns-established:
  - "Config reading: AUTONOMOUS=$(cat .planning/config.json ... | grep ... || echo 'false')"
  - "Trace output: Auto-decided: [choice] — [reason]. Assumption: [what was assumed]"
  - "Wrapper pattern preserves interactive mode unchanged"

# Metrics
duration: 2min
completed: 2026-01-26
---

# Phase 1 Plan 1: Autonomous Foundation Reference Summary

**Canonical autonomous mode reference documentation with config reading pattern, decision trace format, and graceful degradation defaults**

## Performance

- **Duration:** 2 min 34 sec
- **Started:** 2026-01-26T18:00:57Z
- **Completed:** 2026-01-26T18:03:31Z
- **Tasks:** 2
- **Files created:** 2

## Accomplishments

- Canonical config flag reading pattern documented (VOICE-01)
- Decision trace format specified: `Auto-decided: [choice] — [reason]` (VOICE-02)
- Full commitment mode principle established (VOICE-05)
- Graceful degradation with defaults and assumption logging (VOICE-07)
- Checkpoint-specific defaults for human-verify, decision, and human-action types

## Task Commits

Each task was committed atomically:

1. **Task 1: Create autonomous.md reference document** - `b1feea7` (docs)
2. **Task 2: Create autonomous-defaults.md reference document** - `f872c99` (docs)

## Files Created/Modified

- `get-shit-done/references/autonomous.md` (318 lines) - Core autonomous mode patterns, config reading, trace format, wrapper pattern
- `get-shit-done/references/autonomous-defaults.md` (295 lines) - Checkpoint defaults, common decision defaults, assumption logging, graceful degradation

## Decisions Made

1. **Em-dash format:** Used `—` (em-dash) not `-` (hyphen) in trace format for visual clarity
2. **Full commitment:** When autonomous enabled, ALL decisions auto-decided - no partial autonomy
3. **Safest option heuristic:** When no policy matches, select most reversible option
4. **Human-action unchanged:** checkpoint:human-action cannot be autonomous (email links, 2FA, etc.)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Reference documentation complete and ready for workflow integration
- Phase 2 (Context-Aware Decisions) can build on these patterns
- Workflows can start implementing autonomous wrapper pattern
- Decision policies in Phase 3 will extend the defaults documented here

---
*Phase: 01-inner-voice-foundation*
*Completed: 2026-01-26*
