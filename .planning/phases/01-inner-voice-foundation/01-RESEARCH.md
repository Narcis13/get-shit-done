# Phase 1: Inner Voice Foundation - Research

**Researched:** 2026-01-26
**Domain:** Autonomous decision-making in prompt engineering systems
**Confidence:** HIGH

## Summary

Phase 1 establishes the foundational autonomous reasoning capability for GSD. The research focuses on how to implement config-driven autonomy, decision trace output, and graceful degradation when context is insufficient.

This is a **self-referential prompt engineering task** - GSD is modifying its own prompts to support autonomous decision-making. The implementation involves:

1. Reading `autonomous: true/false` from `.planning/config.json` at decision points
2. Replacing `AskUserQuestion` calls with autonomous reasoning when enabled
3. Outputting structured traces (`Auto-decided: [choice] - [reason]`) for visibility
4. Defining defaults for common decision scenarios when context is insufficient

The existing codebase already has all necessary infrastructure: config.json pattern, AskUserQuestion usage patterns, checkpoint protocols, and decision flow structures. No new dependencies or external tools are required.

**Primary recommendation:** Implement autonomy as a wrapper pattern around existing `AskUserQuestion` calls. When `autonomous: true`, intercept the question, reason from context, output trace, and proceed. Existing interactive flows remain untouched for backwards compatibility.

## Standard Stack

The established libraries/tools for this domain:

### Core

| Component | Version | Purpose | Why Standard |
|-----------|---------|---------|--------------|
| Markdown prompts | N/A | All GSD logic is in .md files | Existing architecture |
| config.json | N/A | Configuration storage at `.planning/config.json` | Already has `autonomous: false` field |
| AskUserQuestion | N/A | Claude Code built-in tool for user interaction | Used at all decision points |
| Shell scripting | bash | Config reading in workflow steps | Existing pattern throughout |

### Supporting

| Component | Purpose | When to Use |
|-----------|---------|-------------|
| Grep patterns | Extract config values from JSON | Reading `autonomous` flag |
| Cat/Echo | Read and output decision traces | Logging autonomous decisions |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Config flag | Environment variable | Config.json is established pattern, env vars add external dependency |
| Inline trace output | Separate log file | Inline keeps decisions visible in context, separate file adds complexity |
| Full reasoning chain | Brief trace only | Brief traces match GSD style guide (no filler), full chains use too much context |

**Installation:** None required - all tools are already part of GSD's existing stack.

## Architecture Patterns

### Recommended Implementation Structure

```
commands/gsd/*.md
  ├── (existing) - No changes needed

get-shit-done/workflows/*.md
  ├── execute-phase.md        - Add autonomous checkpoint handling
  ├── execute-plan.md         - Add autonomous checkpoint handling
  ├── discuss-phase.md        - Add autonomous decision making
  ├── discovery-phase.md      - Add autonomous confidence handling
  └── (others)                - Add autonomous flag checks

agents/*.md
  ├── gsd-executor.md         - Respect autonomous for deviation decisions
  ├── gsd-planner.md          - Respect autonomous for planning decisions
  └── (others)                - Audit for decision points

get-shit-done/references/
  └── autonomous.md (NEW)     - Document autonomous reasoning patterns
```

### Pattern 1: Autonomous Decision Wrapper

**What:** Check autonomous flag before any `AskUserQuestion` call

**When to use:** Every decision point in workflows and agents

**Example:**

```markdown
<step name="check_autonomous">
# At the start of workflow or before first decision point

```bash
AUTONOMOUS=$(cat .planning/config.json 2>/dev/null | grep -o '"autonomous"[[:space:]]*:[[:space:]]*[^,}]*' | grep -o 'true\|false' || echo "false")
```

Store for use in subsequent decision points.
</step>

<step name="some_decision_point">
**If AUTONOMOUS=true:**

[Reason from context - read relevant files, apply policy]
[Make decision based on context]

Output:
```
Auto-decided: [choice] - [reason based on context]
```

Continue to next step.

**If AUTONOMOUS=false:**

Use AskUserQuestion:
- header: "[Decision header]"
- question: "[Decision question]"
- options: [...]

Wait for user response.
</step>
```

### Pattern 2: Checkpoint Autonomy for Execution

**What:** Auto-approve `checkpoint:human-verify` when tests pass; auto-select `checkpoint:decision` using policies

**When to use:** During plan execution when `autonomous: true`

**Example:**

```markdown
<step name="handle_checkpoint_autonomously">
Read checkpoint type from task.

**If checkpoint:human-verify:**
- Run all automated verification (tests, builds, curl checks)
- If ALL pass: Auto-approve
  ```
  Auto-decided: approved - All verification checks passed (tests: ✓, build: ✓, endpoint: ✓)
  ```
- If ANY fail: Fall back to human (even in autonomous mode)

**If checkpoint:decision:**
- Apply decision policy (see Phase 3)
- Select option based on policy
  ```
  Auto-decided: [option] - [policy-based reason]
  ```

**If checkpoint:human-action:**
- Cannot be autonomous (requires human-only action like email click)
- Fall back to human interaction
</step>
```

### Pattern 3: Graceful Degradation with Defaults

**What:** When context is insufficient, use documented defaults and log assumptions

**When to use:** When autonomous reasoning cannot determine an answer

**Example:**

```markdown
<step name="handle_insufficient_context">
When autonomous decision cannot be confidently made:

1. Check for documented default in policy
2. If default exists:
   ```
   Auto-decided: [default choice] - Insufficient context, using documented default. Assumption: [what was assumed]
   ```

3. If no default exists:
   ```
   Autonomous mode: Context insufficient for [decision]. Using safe default: [safest option]
   Logged assumption: [what was assumed]
   ```

4. Record assumption in STATE.md or DECISIONS.md for visibility

**Never silently proceed** - always log when using defaults or assumptions.
</step>
```

### Anti-Patterns to Avoid

- **Partial autonomy:** When enabled, ALL decisions must be auto-decided. Don't have some decisions autonomous and others interactive - this creates unpredictable UX.

- **Silent defaults:** Never use a default without logging. Users must be able to see what was assumed.

- **Overconfident reasoning:** Don't make decisions without sufficient context. If unsure, use documented defaults and log assumptions.

- **Modifying existing interactive flows:** The autonomous wrapper should be additive. Original interactive code paths must remain untouched for backwards compatibility.

## Don't Hand-Roll

Problems that look simple but should use existing patterns:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Config reading | Custom JSON parser | Existing grep pattern | Consistent with all other config reads |
| Decision output | Custom logging system | Inline markdown output | Stays visible in Claude's response |
| State tracking | New state file format | Existing STATE.md pattern | One source of truth already exists |
| Default policies | Hardcoded per-decision | Reference document with defaults | Centralized, auditable, editable |

**Key insight:** GSD already has all infrastructure needed. The task is wiring existing patterns together with the autonomy check, not building new infrastructure.

## Common Pitfalls

### Pitfall 1: Breaking Interactive Mode

**What goes wrong:** Changes to decision points accidentally break interactive mode when `autonomous: false`

**Why it happens:** Developers modify the core decision logic instead of wrapping it

**How to avoid:** Always structure as:
```markdown
**If AUTONOMOUS=true:**
  [autonomous handling]

**If AUTONOMOUS=false (default):**
  [existing interactive handling - unchanged]
```

**Warning signs:** Tests in interactive mode start failing, users report unexpected behavior

### Pitfall 2: Decision Traces Lost in Context

**What goes wrong:** Auto-decided traces get buried in long outputs, user can't find what was decided

**Why it happens:** Traces output in middle of other processing

**How to avoid:**
- Use consistent format: `Auto-decided: [choice] - [reason]`
- Consider aggregating traces at end of major steps
- Keep traces brief but substantive

**Warning signs:** Users asking "what did it decide?" after autonomous runs

### Pitfall 3: Cascading Failures from Bad Defaults

**What goes wrong:** A poor default choice cascades into multiple failures

**Why it happens:** Defaults not carefully considered, or context truly was insufficient

**How to avoid:**
- Document defaults explicitly with rationale
- Choose "safest" option when unclear (least irreversible)
- Log assumptions so they're auditable
- Consider adding "autonomous with review" mode later (v2)

**Warning signs:** Autonomous runs producing significantly worse results than interactive

### Pitfall 4: Inconsistent Autonomy Flag Reading

**What goes wrong:** Different workflows read the flag differently, leading to inconsistent behavior

**Why it happens:** Copy-paste errors, missing the flag check in some places

**How to avoid:**
- Create one canonical pattern for reading the flag
- Document in references/autonomous.md
- Audit all decision points systematically

**Warning signs:** Some decisions prompt user even when `autonomous: true`

## Code Examples

Verified patterns from existing GSD codebase:

### Reading Config Value (Existing Pattern)

```bash
# From execute-phase.md, execute-plan.md, and others
MODEL_PROFILE=$(cat .planning/config.json 2>/dev/null | grep -o '"model_profile"[[:space:]]*:[[:space:]]*"[^"]*"' | grep -o '"[^"]*"$' | tr -d '"' || echo "balanced")
```

Adapt for autonomous:

```bash
# Read autonomous flag (default: false)
AUTONOMOUS=$(cat .planning/config.json 2>/dev/null | grep -o '"autonomous"[[:space:]]*:[[:space:]]*[^,}]*' | grep -o 'true\|false' || echo "false")
```

### AskUserQuestion Pattern (Existing)

```markdown
# From discuss-phase.md
Use AskUserQuestion:
- header: "Discuss"
- question: "Which areas do you want to discuss for [phase name]?"
- options: [list of options]
```

### Decision Trace Format (New - Matches GSD Style)

```markdown
# Brief, substantive, no filler
Auto-decided: supabase - PROJECT.md specifies PostgreSQL database, Supabase is already in stack

# With assumption logging
Auto-decided: standard depth - Insufficient context about project size, using documented default. Assumption: standard phase complexity
```

### Checkpoint Verification Pattern (Existing)

```bash
# From checkpoints.md - verification checks
npm run test
npm run build
curl -s localhost:3000 > /dev/null 2>&1
```

Auto-approval uses these same checks:

```markdown
Auto-decided: approved - All verification checks passed
- Tests: 42/42 passing
- Build: succeeded, no errors
- Endpoint: http://localhost:3000 returns 200
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Always interactive | Config-driven autonomy | This milestone | Users choose their UX |
| Silent decisions | Traced decisions | This milestone | Auditability |
| Fail on missing context | Graceful degradation | This milestone | Robustness |

**Deprecated/outdated:**
- None - this is new capability being added

## Implementation Sequence

Based on the requirements (VOICE-01, VOICE-02, VOICE-05, VOICE-07), the implementation sequence should be:

### Task 1: Config Flag Infrastructure (VOICE-01)
- config.json already has `"autonomous": false`
- Add canonical reading pattern to be used everywhere
- Create references/autonomous.md documenting the pattern

### Task 2: Decision Trace Output (VOICE-02)
- Define trace format: `Auto-decided: [choice] - [reason]`
- Add trace output to autonomous decision wrapper
- Ensure traces are visible but not verbose

### Task 3: Full Commitment Mode (VOICE-05)
- Audit all AskUserQuestion calls in workflows and agents
- Add autonomous wrapper to each decision point
- Ensure no partial autonomy (all or nothing)

### Task 4: Graceful Degradation (VOICE-07)
- Define documented defaults for common decisions
- Implement default fallback with assumption logging
- Add assumption section to STATE.md or DECISIONS.md

## Decision Points Inventory

Files containing `AskUserQuestion` or `checkpoint` that need autonomous handling:

### High Priority (Core Execution Path)

| File | Decision Point | Autonomous Handling |
|------|----------------|---------------------|
| execute-phase.md | Previous issues review | Auto-proceed or auto-address |
| execute-plan.md | Previous phase check | Auto-proceed |
| execute-plan.md | Checkpoint handling | Auto-verify, auto-decide |
| execute-plan.md | Verification failure | Auto-retry or auto-skip |

### Medium Priority (Planning Path)

| File | Decision Point | Autonomous Handling |
|------|----------------|---------------------|
| discuss-phase.md | Gray area selection | Auto-select based on phase type |
| discuss-phase.md | Area discussion | Auto-answer questions |
| discovery-phase.md | Confidence gate | Auto-proceed or auto-dig-deeper |
| discovery-phase.md | Open questions gate | Auto-acknowledge |

### Lower Priority (Setup and Utilities)

| File | Decision Point | Autonomous Handling |
|------|----------------|---------------------|
| new-project.md | Various setup questions | Auto-answer from context |
| resume-project.md | Resume decisions | Auto-resume |
| complete-milestone.md | Completion confirmation | Auto-complete |

## Open Questions

Things that couldn't be fully resolved:

1. **Aggregate traces vs inline traces**
   - What we know: Brief inline traces are GSD style compliant
   - What's unclear: Should there also be an aggregate summary at end of major operations?
   - Recommendation: Start with inline only, add aggregation in v2 if users request

2. **Scope of "all decision points"**
   - What we know: AskUserQuestion and checkpoint types are clear decision points
   - What's unclear: Are there implicit decisions (e.g., which files to read) that should also be traced?
   - Recommendation: Start with explicit decision points only, expand if needed

3. **Recovery from bad autonomous decisions**
   - What we know: Phase 6 adds rollback mechanism
   - What's unclear: Should Phase 1 include any safeguards?
   - Recommendation: Log assumptions thoroughly; rollback is Phase 6 scope

## Sources

### Primary (HIGH confidence)
- `.planning/config.json` - Existing autonomous flag (line 12)
- `get-shit-done/workflows/execute-phase.md` - Decision point patterns
- `get-shit-done/workflows/execute-plan.md` - Checkpoint handling patterns
- `get-shit-done/references/checkpoints.md` - Checkpoint types and verification
- `agents/gsd-executor.md` - Deviation rules and decision handling
- `agents/gsd-planner.md` - Planning decision patterns
- `GSD-STYLE.md` - Style guide for output format
- `.planning/REQUIREMENTS.md` - VOICE-01, VOICE-02, VOICE-05, VOICE-07 specifications

### Secondary (MEDIUM confidence)
- Grep analysis of AskUserQuestion usage across codebase - 73 files

### Tertiary (LOW confidence)
- None - this is internal codebase modification, no external sources needed

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using only existing GSD patterns
- Architecture: HIGH - Wrapper pattern is proven, codebase well understood
- Pitfalls: HIGH - Based on direct codebase analysis
- Decision inventory: MEDIUM - Manual grep may have missed implicit decisions

**Research date:** 2026-01-26
**Valid until:** N/A - This is implementation research for a specific phase, not technology research that could become stale
