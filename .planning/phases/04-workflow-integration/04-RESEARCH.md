# Phase 4: Workflow Integration - Research

**Researched:** 2026-01-26
**Domain:** GSD internal workflow integration
**Confidence:** HIGH

## Summary

Phase 4 connects the autonomous infrastructure built in Phases 1-3 to all GSD workflow files. The prior phases established:
- **Phase 1:** Config flag pattern (`AUTONOMOUS=...`), decision trace format (`Auto-decided: [choice] — [reason]`), autonomous-defaults.md for graceful degradation
- **Phase 2:** Context assembly pattern (PROJECT.md -> REQUIREMENTS.md -> session history -> RESEARCH.md), DECISIONS.md persistence, session decision tracking
- **Phase 3:** Seven decision policies (POLICY-01 through POLICY-07) with observable condition checks, integrated into new-project.md, plan-phase.md, and execute-plan.md

Phase 4 must extend autonomous handling to ALL remaining GSD workflows that prompt users. The work is primarily about identifying every `AskUserQuestion` call and checkpoint in workflows, then wrapping each with the AUTONOMOUS flag pattern while preserving existing interactive paths unchanged.

**Primary recommendation:** Systematic file-by-file integration using the canonical autonomous wrapper pattern, prioritizing the core workflows (execute-phase, discuss-phase, new-milestone) before auxiliary commands.

## Standard Stack

### Core (Already Implemented in Phase 1-3)

| Pattern | Location | Purpose | How Phase 4 Uses It |
|---------|----------|---------|---------------------|
| Config flag reading | autonomous.md L17-19 | Read AUTONOMOUS once at workflow start | Copy exact bash pattern to each workflow |
| Decision wrapper | autonomous.md L87-109 | If/else structure for decision points | Wrap every AskUserQuestion with this pattern |
| Decision trace | autonomous.md L49-82 | `Auto-decided: [choice] — [reason]` format | Output before every autonomous decision |
| Checkpoint handling | decision-policies.md POLICY-06/07 | Policy-based checkpoint resolution | Reference policies in checkpoint steps |
| Context assembly | context-assembly.md | Priority-ordered context gathering | Use when context needed for decisions |
| DECISIONS.md | decisions.md template | Persist all autonomous decisions | Append to existing file in autonomous mode |

### Already Integrated (Do Not Re-Implement)

| File | What's Done | Phase 4 Responsibility |
|------|-------------|------------------------|
| new-project.md | POLICY-01/02/03/04 integrated | Verify end-to-end autonomous flow works |
| plan-phase.md | POLICY-05 integrated, flag reading | Verify end-to-end autonomous flow works |
| execute-plan.md | POLICY-06/07 referenced, session tracking | Verify checkpoint handling works |

## Architecture Patterns

### Files Requiring Integration (Inventory)

Based on `grep AskUserQuestion` and `grep checkpoint:` across the codebase:

**Commands (commands/gsd/*.md):**

| File | AskUserQuestion Uses | Decision Points | Priority |
|------|---------------------|-----------------|----------|
| execute-phase.md | References execute-phase.md workflow | Checkpoint handling via workflow | HIGH |
| discuss-phase.md | Multiple (gray area selection, discussion loops) | 4+ per run | MEDIUM |
| new-milestone.md | Similar to new-project (research, requirements, roadmap) | 5+ per run | MEDIUM |
| settings.md | Config questions (4 questions) | Low impact (explicit user config) | LOW |
| verify-work.md | UAT test responses | User testing - inherently interactive | SKIP |
| debug.md | Symptom gathering, checkpoint handling | 5+ per run | LOW |
| resume-work.md | Session selection | 1 decision | LOW |
| update.md | Update confirmation | 1 decision | LOW |
| check-todos.md | Todo selection | 1 decision | LOW |
| add-todo.md | Todo details | User input - inherently interactive | SKIP |
| quick.md | Task confirmation | Should be fast anyway | LOW |
| plan-milestone-gaps.md | Gap planning | Follows plan-phase pattern | LOW |

**Workflows (get-shit-done/workflows/*.md):**

| File | AskUserQuestion Uses | Decision Points | Priority |
|------|---------------------|-----------------|----------|
| execute-phase.md | Checkpoint handling, failure recovery | 3+ per run | HIGH |
| discuss-phase.md | Gray area selection, discussion loops | 4+ per run | MEDIUM |
| discovery-phase.md | Confidence gate, open questions | 2-3 per run | LOW |
| verify-work.md | Test responses | User testing - inherently interactive | SKIP |
| verify-phase.md | N/A (no AskUserQuestion found) | Automated | N/A |

### Canonical Integration Pattern

From autonomous.md, the wrapper structure for every decision point:

```markdown
<step name="some_decision_point">
Check AUTONOMOUS flag from workflow start.

**If AUTONOMOUS=true:**

[Read relevant context files if needed]
[Apply decision policy OR use documented default]
[Output trace]

```
Auto-decided: [choice] — [reason] [POLICY-XX if applicable]
```

Continue to next step.

**If AUTONOMOUS=false:**

[Existing AskUserQuestion or checkpoint handling - UNCHANGED]
```

**Critical rules:**
1. `AUTONOMOUS=false` path MUST be IDENTICAL to original code
2. Autonomy is additive, not a replacement
3. Check flag ONCE at workflow start, not per-decision
4. Always output trace BEFORE proceeding

### Four Integration Patterns (from decision-policies.md)

| Pattern | When to Use | Example Policies |
|---------|-------------|------------------|
| Simple Binary | yes/no outcomes from observable conditions | POLICY-01, 05, 07 |
| Context-Based | Need to gather context before deciding | POLICY-06 |
| Verification-Based | Depend on automated verification results | POLICY-07 |
| Config-Gated | Check configuration flags first | POLICY-02 |

### Workflow Categories for Integration

**Category A: Core workflows (FLOW-01, FLOW-02, FLOW-03)**
- Already have AUTONOMOUS flag reading (Phase 3)
- Need verification that end-to-end flow works
- May need gap filling for missed decision points

**Category B: Auxiliary workflows (FLOW-04)**
- Need AUTONOMOUS flag reading added
- Need each AskUserQuestion wrapped
- Keep changes minimal and focused

**Category C: Inherently interactive (SKIP)**
- User testing (verify-work)
- User input capture (add-todo)
- These SHOULD prompt even in autonomous mode

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Decision trace format | Custom trace format | `Auto-decided: [choice] — [reason]` | Consistency with Phase 1 |
| Config reading | Alternative parsing | Exact bash pattern from autonomous.md L17-19 | Tested, handles edge cases |
| Context gathering | Ad-hoc context reading | Context assembly pattern from context-assembly.md | Priority ordering, citation format |
| Checkpoint handling | Custom checkpoint logic | POLICY-06/07 from decision-policies.md | Observable conditions, trace format |

**Key insight:** All the patterns are already defined. Phase 4 is pure integration work - copy the patterns, don't reinvent them.

## Common Pitfalls

### Pitfall 1: Modifying Interactive Paths

**What goes wrong:** Adding autonomous handling accidentally changes how interactive mode works.
**Why it happens:** Developer tries to "clean up" or "improve" the interactive code while adding autonomous path.
**How to avoid:** Copy-paste the original interactive code into the `AUTONOMOUS=false` branch. Do not edit it.
**Warning signs:** Tests that worked before now behave differently in interactive mode.

### Pitfall 2: Incomplete Coverage

**What goes wrong:** Some AskUserQuestion calls get wrapped, others don't, creating partial autonomy.
**Why it happens:** Missing decision points during file scan, or assumption that some decisions "don't matter".
**How to avoid:** Systematic grep for AskUserQuestion and checkpoint: in each file before starting. Create checklist.
**Warning signs:** Autonomous run prompts user unexpectedly.

### Pitfall 3: Missing Traces

**What goes wrong:** Autonomous decisions happen but no trace is output.
**Why it happens:** Developer adds logic but forgets trace output, or trace is after continue instead of before.
**How to avoid:** Add trace output as first action after decision, before any continue or next step.
**Warning signs:** DECISIONS.md is sparse, hard to audit what happened.

### Pitfall 4: Re-reading Config Mid-Workflow

**What goes wrong:** AUTONOMOUS flag checked multiple times, config changes mid-run cause inconsistent behavior.
**Why it happens:** Each decision point reads config instead of using stored variable.
**How to avoid:** Read flag ONCE at workflow start (step 0 or step 1), store in variable, reference variable everywhere.
**Warning signs:** Same workflow behaves differently for different decisions in same run.

### Pitfall 5: Autonomous Decisions Without Context

**What goes wrong:** Autonomous mode makes decisions without checking relevant context, produces wrong choices.
**Why it happens:** Skipping context gathering step to "simplify" or because decision "seems obvious".
**How to avoid:** For any decision that depends on project state, use context assembly pattern first.
**Warning signs:** Autonomous decisions override user preferences that were documented in PROJECT.md.

### Pitfall 6: Breaking discuss-phase Autonomy Semantics

**What goes wrong:** discuss-phase becomes fully automated, but discussion is inherently about user input.
**Why it happens:** Treating discuss-phase like other workflows.
**How to avoid:** In autonomous mode, discuss-phase should SKIP entirely (not auto-answer). User ran it explicitly = wants discussion.
**Warning signs:** CONTEXT.md files full of auto-generated decisions that don't match user intent.

## Code Examples

### Example 1: Adding Autonomous Flag Reading to a Workflow

From autonomous.md, add this at workflow start:

```markdown
<step name="check_autonomous_mode" priority="first">
Read autonomous mode setting:

```bash
AUTONOMOUS=$(cat .planning/config.json 2>/dev/null | grep -o '"autonomous"[[:space:]]*:[[:space:]]*[^,}]*' | grep -o 'true\|false' || echo "false")
```

Store for use in decision points below.
</step>
```

### Example 2: Wrapping AskUserQuestion with Autonomous Handler

Original:
```markdown
Use AskUserQuestion:
- header: "Existing context"
- question: "Phase [X] already has context. What do you want to do?"
- options:
  - "Update it" — Review and revise existing context
  - "View it" — Show me what's there
  - "Skip" — Use existing context as-is
```

After integration:
```markdown
**If AUTONOMOUS=true:**

Apply default: Use existing context as-is (safest option).

```
Auto-decided: skip — Existing CONTEXT.md found, using as-is [autonomous-defaults.md]
```

Continue to next step.

**If AUTONOMOUS=false:**

Use AskUserQuestion:
- header: "Existing context"
- question: "Phase [X] already has context. What do you want to do?"
- options:
  - "Update it" — Review and revise existing context
  - "View it" — Show me what's there
  - "Skip" — Use existing context as-is
```

### Example 3: Handling Inherently Interactive Workflows

For workflows like verify-work.md that require user interaction:

```markdown
<step name="check_autonomous_mode" priority="first">
Read autonomous mode setting:

```bash
AUTONOMOUS=$(cat .planning/config.json 2>/dev/null | grep -o '"autonomous"[[:space:]]*:[[:space:]]*[^,}]*' | grep -o 'true\|false' || echo "false")
```

**Note:** This workflow requires user interaction for testing. AUTONOMOUS flag is read but does not change the test presentation flow. User must verify features work correctly.
</step>
```

### Example 4: Skipping discuss-phase in Autonomous Mode

For discuss-phase, autonomous should mean "skip discussion entirely":

```markdown
<step name="check_autonomous_mode" priority="first">
Read autonomous mode setting:

```bash
AUTONOMOUS=$(cat .planning/config.json 2>/dev/null | grep -o '"autonomous"[[:space:]]*:[[:space:]]*[^,}]*' | grep -o 'true\|false' || echo "false")
```

**If AUTONOMOUS=true:**

Discussion is inherently interactive. Skip discuss-phase and proceed directly to planning.

```
Auto-decided: skip discussion — Autonomous mode enabled, discussion requires human input
```

Exit workflow. User should run `/gsd:plan-phase` directly.

**If AUTONOMOUS=false:**

Continue to analyze_phase step.
</step>
```

## State of the Art

| Before Phase 4 | After Phase 4 | Impact |
|----------------|---------------|--------|
| Only execute-plan.md has full autonomous integration | All GSD workflows respect autonomous flag | End-to-end autonomous runs possible |
| new-project has policies but untested e2e | new-project verified to run with zero prompts | FLOW-01 satisfied |
| plan-phase has policy but untested e2e | plan-phase verified to run with zero prompts | FLOW-02 satisfied |
| execute-phase delegates to execute-plan | execute-phase handles orchestration checkpoints autonomously | FLOW-03 satisfied |
| Other workflows prompt unconditionally | All workflows check flag before prompting | FLOW-04 satisfied |

## Open Questions

### 1. discuss-phase Semantics

**What we know:** discuss-phase is about gathering user input on implementation decisions.
**What's unclear:** Should autonomous mode skip discuss-phase entirely, or auto-select defaults?
**Recommendation:** Skip entirely. If user runs discuss-phase, they want discussion. In autonomous mode, skip to plan-phase which uses documented defaults.

### 2. verify-work Autonomy

**What we know:** verify-work requires human testing.
**What's unclear:** Should any part of verify-work be automated?
**Recommendation:** Keep fully interactive. The point is human verification. In autonomous mode, user can skip verify-work if they trust automated tests.

### 3. execute-phase Checkpoint Delegation

**What we know:** execute-phase.md delegates checkpoint handling to execute-plan.md workflow.
**What's unclear:** Does the orchestrator (execute-phase command) need its own autonomous handling for errors/failures?
**Recommendation:** Yes, add minimal handling for orchestrator-level decisions (e.g., "Continue with remaining waves after failure?").

## Sources

### Primary (HIGH confidence)
- `/Users/narcisbrindusescu/newme/gsd/get-shit-done/references/autonomous.md` - Canonical patterns
- `/Users/narcisbrindusescu/newme/gsd/get-shit-done/references/decision-policies.md` - Policy definitions
- `/Users/narcisbrindusescu/newme/gsd/get-shit-done/references/context-assembly.md` - Context gathering
- `/Users/narcisbrindusescu/newme/gsd/.planning/phases/01-inner-voice-foundation/01-VERIFICATION.md` - Phase 1 deliverables
- `/Users/narcisbrindusescu/newme/gsd/.planning/phases/02-context-aware-reasoning/02-VERIFICATION.md` - Phase 2 deliverables
- `/Users/narcisbrindusescu/newme/gsd/.planning/phases/03-decision-policies/03-VERIFICATION.md` - Phase 3 deliverables

### Secondary (MEDIUM confidence)
- Codebase grep for AskUserQuestion and checkpoint patterns
- Workflow file analysis for decision point identification

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All patterns defined in prior phases
- Architecture: HIGH - Clear wrapper pattern, systematic file list
- Pitfalls: HIGH - Based on documented anti-patterns in autonomous.md

**Research date:** 2026-01-26
**Valid until:** Indefinite (internal codebase patterns, not external libraries)

## File Integration Checklist

For planner reference - files requiring integration:

### HIGH Priority (FLOW-01, 02, 03)

- [ ] commands/gsd/execute-phase.md - Verify orchestrator-level autonomous handling
- [ ] get-shit-done/workflows/execute-phase.md - Add autonomous handling for failure recovery
- [ ] commands/gsd/new-project.md - Verify end-to-end autonomous flow (POLICY-01/02/03/04 already integrated)
- [ ] commands/gsd/plan-phase.md - Verify end-to-end autonomous flow (POLICY-05 already integrated)

### MEDIUM Priority (FLOW-04)

- [ ] commands/gsd/discuss-phase.md - Skip in autonomous mode
- [ ] get-shit-done/workflows/discuss-phase.md - Skip in autonomous mode
- [ ] commands/gsd/new-milestone.md - Mirror new-project patterns
- [ ] get-shit-done/workflows/discovery-phase.md - Handle confidence gate autonomously

### LOW Priority (FLOW-04 - auxiliary)

- [ ] commands/gsd/settings.md - User explicitly running = wants interaction
- [ ] commands/gsd/debug.md - Add flag check, handle checkpoints
- [ ] commands/gsd/resume-work.md - Auto-select most recent if autonomous
- [ ] commands/gsd/check-todos.md - Auto-select highest priority
- [ ] commands/gsd/update.md - Auto-approve update

### SKIP (Inherently Interactive)

- [ ] commands/gsd/verify-work.md - Requires human testing
- [ ] get-shit-done/workflows/verify-work.md - Requires human testing
- [ ] commands/gsd/add-todo.md - Requires user input
