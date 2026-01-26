# Phase 3: Decision Policies - Research

**Researched:** 2026-01-26
**Domain:** Autonomous decision policy definition for prompt engineering systems
**Confidence:** HIGH

## Summary

Phase 3 builds on the autonomous foundation (Phase 1) and context-aware reasoning (Phase 2) by defining specific policies for common GSD decision points. The research focuses on how to implement seven distinct policies that enable the autonomous system to make grounded, repeatable decisions without human intervention.

This is a **self-referential prompt engineering task** - GSD is defining policies for its own autonomous operation. The infrastructure is already in place from Phases 1-2:
- Config flag reading (`autonomous: true/false`) - Phase 1
- Decision trace format (`Auto-decided: [choice] -- [reason]`) - Phase 1
- Graceful degradation with defaults - Phase 1
- Context assembly (prioritized gathering) - Phase 2
- Session decision history (S### references) - Phase 2
- Decision persistence (DECISIONS.md) - Phase 2

Phase 3 adds the domain-specific knowledge: what to decide for each common GSD decision point. Each policy maps conditions to choices.

**Key finding:** Policies must be deterministic rules that map observable conditions to specific choices. The goal is not general intelligence but predictable, auditable decisions. A policy should read like: "IF [conditions] THEN [choice] BECAUSE [rationale]."

**Primary recommendation:** Implement policies as a reference document (`decision-policies.md`) that defines specific decision rules for each policy type. Workflows read this document and apply the relevant policy when autonomous mode is enabled. Each policy has clear conditions, a decision rule, and the trace format to output.

## Standard Stack

### Core

| Component | Location | Purpose | Why Standard |
|-----------|----------|---------|--------------|
| autonomous.md | `get-shit-done/references/autonomous.md` | Config flag reading, decision wrapper | Already established in Phase 1 |
| autonomous-defaults.md | `get-shit-done/references/autonomous-defaults.md` | Graceful degradation patterns | Already established in Phase 1 |
| context-assembly.md | `get-shit-done/references/context-assembly.md` | Prioritized context gathering | Already established in Phase 2 |
| checkpoints.md | `get-shit-done/references/checkpoints.md` | Checkpoint types and handling | Existing GSD reference |
| decisions.md (template) | `get-shit-done/templates/decisions.md` | DECISIONS.md format | Already established in Phase 2 |
| config.json | `.planning/config.json` | Workflow settings | Existing GSD pattern |

### Supporting

| Component | Location | Purpose | When to Use |
|-----------|----------|---------|-------------|
| new-project.md | `commands/gsd/new-project.md` | Brownfield detection, research toggle | POLICY-01, POLICY-02 apply here |
| roadmapper agent | `agents/gsd-roadmapper.md` | Roadmap creation | POLICY-04 applies to approval |
| plan-checker agent | `agents/gsd-plan-checker.md` | Plan verification | POLICY-05 applies to approval |
| execute-plan.md | `get-shit-done/workflows/execute-plan.md` | Checkpoint execution | POLICY-06, POLICY-07 apply here |
| discovery-phase.md | `get-shit-done/workflows/discovery-phase.md` | Confidence gates | POLICY-02 (research toggle) related |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Reference document | Inline policies in each workflow | Reference doc centralizes policies for maintainability; inline distributes but complicates updates |
| Declarative rules | Reasoning-based approach | Declarative rules are predictable/auditable; reasoning is flexible but opaque |
| Single decision-policies.md | Per-workflow policy sections | Single file ensures consistency; per-workflow duplicates policies |

**No new dependencies required** - policies use existing GSD infrastructure and file-based patterns.

## Architecture Patterns

### Recommended Policy Document Structure

```
get-shit-done/references/
├── autonomous.md             # Config reading, wrapper pattern
├── autonomous-defaults.md    # Graceful degradation
├── context-assembly.md       # Context gathering
└── decision-policies.md (NEW) # Specific policies for each decision type
```

### Pattern 1: Declarative Policy Definition

**What:** Each policy is defined as a declarative rule mapping conditions to choices.

**When to use:** Every policy definition in Phase 3.

**Format:**

```markdown
## POLICY-XX: [Name]

**Decision point:** [Where this policy applies]

**Applies when:** [Conditions that trigger this policy]

**Policy rule:**

```
IF [observable conditions]
THEN [specific choice]
BECAUSE [rationale]
```

**Trace output:**

```
Auto-decided: [choice] -- [reason from rule] [context refs]
```

**Confidence:** [HIGH/MEDIUM/LOW]
- HIGH: Rule conditions fully satisfied
- MEDIUM: Rule conditions partially satisfied
- LOW: Rule applied by default/fallback

**Example application:**

[Concrete example of the policy being applied]
```

### Pattern 2: Observable Condition Checks

**What:** Policies check observable conditions (file existence, content patterns, counts) not inferred state.

**When to use:** Writing policy conditions.

**Good conditions (observable):**
```
- Code files exist in repository: find . -name "*.ts" | head -1
- Codebase map exists: [ -d .planning/codebase ]
- All requirements have phase mapping: grep -c "Pending" REQUIREMENTS.md = 0
- Checker returned PASSED: [output contains "## VERIFICATION PASSED"]
- Tests pass: [npm test exit code = 0]
```

**Bad conditions (inferred/vague):**
```
- Domain is unfamiliar (how do you measure familiarity?)
- Code is complex (subjective)
- User probably wants X (mind reading)
```

### Pattern 3: Policy Integration into Workflows

**What:** Workflows check for applicable policy before autonomous decision.

**When to use:** Integrating policies into existing workflows.

**Example integration pattern:**

```markdown
<step name="brownfield_detection">
**If AUTONOMOUS=true:**

1. Check observable conditions:
   ```bash
   CODE_FILES=$(find . -name "*.ts" -o -name "*.py" | grep -v node_modules | head -1)
   HAS_CODEBASE_MAP=$([ -d .planning/codebase ] && echo "yes")
   ```

2. Apply POLICY-01:
   IF code files exist AND no codebase map
   THEN trigger codebase mapping

   ```
   Auto-decided: map codebase -- Code detected without existing map [POLICY-01]
   ```

3. Execute: Spawn /gsd:map-codebase

**If AUTONOMOUS=false:**
[Existing interactive flow - unchanged]
</step>
```

### Anti-Patterns to Avoid

- **Vague conditions:** "If the project seems like greenfield" - not measurable
- **Reasoning-based policies:** "Decide based on understanding the domain" - not repeatable
- **Multiple fallbacks within a policy:** One policy, one rule. Use separate policies for different cases.
- **Implicit decisions:** Every policy application must output a trace.
- **Hardcoded in workflows:** Policies belong in decision-policies.md, workflows reference them.

## Don't Hand-Roll

Problems that look simple but should follow established patterns:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Determining "greenfield vs brownfield" | Complex heuristics | File existence check | Observable, deterministic |
| Evaluating "domain familiarity" | NLP-style analysis | Research config flag + code existence | Config is user's explicit preference |
| Calculating "100% coverage" | Custom counting logic | grep-based check for "Pending" | Simple, auditable |
| Checking "deps satisfied" | Dependency graph analysis | Phase ordering in ROADMAP.md | GSD phases are already ordered |
| Evaluating "checker passed" | Parsing checker output | Pattern match for "VERIFICATION PASSED" | Binary outcome from checker |

**Key insight:** Policies should be implementable with bash commands and pattern matching. If a policy requires complex analysis, it's not a good policy.

## Common Pitfalls

### Pitfall 1: Overly Complex Conditions

**What goes wrong:** Policy conditions become so complex they're not reliably evaluable.

**Why it happens:** Trying to capture every edge case.

**How to avoid:**
- Keep conditions to 1-3 observable checks
- Use defaults for edge cases
- Split complex policies into simpler ones

**Warning signs:**
- Policy condition uses "and" more than twice
- Condition requires reading multiple files deeply
- Condition involves reasoning about content meaning

### Pitfall 2: Missing Trace Output

**What goes wrong:** Policy is applied but decision isn't traced.

**Why it happens:** Policy defined but trace format not specified.

**How to avoid:**
- Every policy definition MUST include trace format
- Trace format includes [POLICY-XX] reference
- Verification checks that traces are output

**Warning signs:**
- DECISIONS.md entries without context refs
- User can't see why a decision was made
- Audit trail gaps

### Pitfall 3: Inconsistent Policy Application

**What goes wrong:** Same conditions lead to different decisions across workflows.

**Why it happens:** Policy defined in reference but workflows implement differently.

**How to avoid:**
- Reference document is authoritative
- Workflows read and apply verbatim
- Single source of truth for each policy

**Warning signs:**
- Different traces for same decision type
- Workflows have inline policy logic
- Policy outcomes vary for same inputs

### Pitfall 4: Policies Without Fallbacks

**What goes wrong:** Policy can't make a decision when conditions are partially met.

**Why it happens:** Only defined the happy path.

**How to avoid:**
- Every policy has explicit fallback behavior
- Fallback uses documented default from autonomous-defaults.md
- Fallback traces include "using default" and assumption

**Warning signs:**
- Autonomous mode hangs waiting for decision
- Errors when conditions not cleanly true/false
- Silent proceeding without decision

### Pitfall 5: Circular Dependencies Between Policies

**What goes wrong:** POLICY-A depends on outcome of POLICY-B which depends on POLICY-A.

**Why it happens:** Policies defined without considering evaluation order.

**How to avoid:**
- Policies are independent or have clear evaluation order
- Define which policies apply in which workflows/stages
- Never reference another policy's outcome as a condition

**Warning signs:**
- Infinite loops in decision making
- Stack overflow of policy calls
- Unable to determine which policy to apply first

## Code Examples

### POLICY-01: Brownfield Detection

**Decision point:** `/gsd:new-project` Phase 2 (Brownfield Offer)

**Applies when:** Code files exist AND no codebase map

**Policy rule:**

```
IF (find . -name "*.ts" -o -name "*.js" -o -name "*.py" returns results)
AND ([ ! -d .planning/codebase ])
THEN trigger codebase mapping
BECAUSE existing code needs mapping for accurate planning
```

**Observable condition check:**

```bash
CODE_FILES=$(find . -name "*.ts" -o -name "*.js" -o -name "*.py" -o -name "*.go" -o -name "*.rs" 2>/dev/null | grep -v node_modules | grep -v .git | head -1)
HAS_CODEBASE_MAP=$([ -d .planning/codebase ] && echo "yes")
```

**Decision:**

- If `CODE_FILES` non-empty AND `HAS_CODEBASE_MAP` != "yes": Trigger mapping
- Otherwise: Proceed without mapping

**Trace output:**

```
Auto-decided: map codebase -- Code exists without map, mapping required [POLICY-01, file: src/index.ts]
```

**Fallback:** If code detection fails, proceed without mapping (greenfield assumed).

### POLICY-02: Research Toggle

**Decision point:** `/gsd:new-project` Phase 6 (Research Decision)

**Applies when:** Deciding whether to research domain before requirements

**Policy rule:**

```
IF (workflow.research = true in config.json)
AND (greenfield project OR no codebase map)
THEN enable research
BECAUSE greenfield/unfamiliar domains benefit from research
```

**Observable condition check:**

```bash
WORKFLOW_RESEARCH=$(cat .planning/config.json 2>/dev/null | grep -o '"research"[[:space:]]*:[[:space:]]*[^,}]*' | grep -o 'true\|false' || echo "true")
GREENFIELD=$([ ! -d .planning/codebase ] && echo "yes")
```

**Decision:**

- If `WORKFLOW_RESEARCH` = "true" AND `GREENFIELD` = "yes": Research
- If `WORKFLOW_RESEARCH` = "false": Skip research
- If `GREENFIELD` != "yes" (brownfield with map): Use existing map, skip general research (per-phase research may still occur)

**Trace output:**

```
Auto-decided: research enabled -- Greenfield project, domain research beneficial [POLICY-02, config: workflow.research=true]
```

```
Auto-decided: skip research -- Brownfield with codebase map [POLICY-02, .planning/codebase exists]
```

**Fallback:** Default to research enabled (safer to research than to miss context).

### POLICY-03: Feature Scoping

**Decision point:** `/gsd:new-project` Phase 7 (Define Requirements)

**Applies when:** Categorizing features as v1 vs v2

**Policy rule:**

```
IF feature is in FEATURES.md "Table Stakes" category
OR feature is explicitly mentioned in PROJECT.md
THEN classify as v1
BECAUSE table stakes are expected, PROJECT.md mentions are explicit user priority
```

**Observable condition check:**

```bash
# Check if feature is table stakes
grep -q "Table stakes:" .planning/research/FEATURES.md && grep -A50 "Table stakes:" .planning/research/FEATURES.md | grep -q "[feature]"

# Check if feature is in PROJECT.md
grep -q "[feature]" .planning/PROJECT.md
```

**Decision:**

- If in "Table Stakes" section OR in PROJECT.md: v1
- If in "Differentiators" section but NOT in PROJECT.md: v2 (unless user overrides)
- If in neither: Out of scope

**Trace output:**

```
Auto-decided: v1 -- Table stakes feature (user authentication) [POLICY-03, FEATURES.md:Table stakes]
```

```
Auto-decided: v2 -- Differentiator not in PROJECT.md (magic link login) [POLICY-03, FEATURES.md:Differentiators]
```

**Fallback:** If FEATURES.md missing, all PROJECT.md mentions are v1, rest is v2.

### POLICY-04: Roadmap Approval

**Decision point:** `/gsd:new-project` Phase 8 (after roadmapper creates ROADMAP.md)

**Applies when:** Deciding whether to approve roadmap

**Policy rule:**

```
IF (100% of v1 requirements have phase mapping)
AND (no unmapped requirements in REQUIREMENTS.md)
AND (phases are ordered by dependency)
THEN auto-approve roadmap
BECAUSE complete coverage with proper ordering is a correct roadmap
```

**Observable condition check:**

```bash
# Check for unmapped requirements (any "Pending" in traceability)
UNMAPPED=$(grep -c "Pending" .planning/REQUIREMENTS.md 2>/dev/null || echo "0")

# Verify all v1 requirements have phase in traceability section
V1_COUNT=$(grep -c "^\- \[ \] \*\*" .planning/REQUIREMENTS.md 2>/dev/null || echo "0")
MAPPED_COUNT=$(grep -c "Phase [0-9]" .planning/REQUIREMENTS.md 2>/dev/null || echo "0")
```

**Decision:**

- If `UNMAPPED` = 0 AND `MAPPED_COUNT` >= `V1_COUNT`: Approve
- Otherwise: Request revision

**Trace output:**

```
Auto-decided: approve roadmap -- 100% requirement coverage, deps satisfied [POLICY-04, 12/12 requirements mapped]
```

**Fallback:** If counts ambiguous, present to user for verification.

### POLICY-05: Plan Approval

**Decision point:** `/gsd:plan-phase` Step 11 (after checker return)

**Applies when:** Deciding whether to approve plans

**Policy rule:**

```
IF checker returns "## VERIFICATION PASSED"
THEN auto-approve plans
BECAUSE checker validates plan quality
```

**Observable condition check:**

```bash
# Check checker output contains VERIFICATION PASSED
echo "$CHECKER_OUTPUT" | grep -q "## VERIFICATION PASSED"
```

**Decision:**

- If grep succeeds: Approve
- If "## ISSUES FOUND": Trigger revision loop (up to 3 iterations per existing code)

**Trace output:**

```
Auto-decided: approve plans -- Checker passed verification [POLICY-05, VERIFICATION PASSED]
```

**Fallback:** If checker returns neither PASSED nor ISSUES, present to user.

### POLICY-06: Checkpoint Decision Selection

**Decision point:** execute-plan.md checkpoint_protocol for `checkpoint:decision`

**Applies when:** Selecting from multiple options in a checkpoint:decision task

**Policy rule:**

```
IF context (PROJECT.md, REQUIREMENTS.md, RESEARCH.md) explicitly addresses this decision
THEN select option that matches context
BECAUSE user preferences and requirements take precedence

IF no explicit context but one option is clearly safest/most reversible
THEN select safest option
BECAUSE conservative defaults minimize risk
```

**Observable condition check:**

Uses context assembly pattern from context-assembly.md:
1. Check PROJECT.md for explicit preference
2. Check REQUIREMENTS.md for requirement constraint
3. Check session history for related decision
4. Check RESEARCH.md for recommendation

**Decision:**

- If explicit preference: Select matching option (HIGH confidence)
- If research recommendation: Select matching option (MEDIUM confidence)
- If no guidance: Select safest/most reversible option (LOW confidence)

**Trace output:**

```
Auto-decided: postgresql -- PROJECT.md specifies relational data [POLICY-06, PROJECT.md:Constraints, HIGH]
```

```
Auto-decided: supabase -- No preference, safest option (most documented) [POLICY-06, Assumption: standard provider, LOW]
```

**Fallback:** Safest option heuristics from autonomous-defaults.md.

### POLICY-07: Checkpoint Human-Verify Auto-Approval

**Decision point:** execute-plan.md checkpoint_protocol for `checkpoint:human-verify`

**Applies when:** All automated verifications pass

**Policy rule:**

```
IF all automated verifications pass (tests, build, endpoints)
THEN auto-approve verification
BECAUSE automated checks cover what matters
```

**Observable condition check:**

```bash
# Run verifications specified in task
npm test 2>&1 | tail -10
TEST_EXIT=$?

npm run build 2>&1 | tail -10
BUILD_EXIT=$?

# Any endpoint checks specified
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"
CURL_EXIT=$?
```

**Decision:**

- If ALL exit codes = 0: Approve (HIGH confidence)
- If ANY exit code != 0: Fall back to human (even in autonomous mode)

**Trace output:**

```
Auto-decided: approved -- All verification checks passed [POLICY-07, tests: 42/42, build: success, endpoint: 200]
```

**Fallback:** If any check fails, present failure details and wait for human.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Implicit decisions | Explicit policies | Phase 3 | Every decision has defined rule |
| Reasoning-based | Rule-based | Phase 3 | Predictable, auditable |
| Per-workflow inline | Centralized reference | Phase 3 | Single source of truth |
| General defaults only | Domain-specific policies | Phase 3 | Better autonomous decisions |

**Current best practices:**

- Policies are declarative rules, not reasoning processes
- Observable conditions only (file checks, counts, pattern matches)
- Every policy has trace format and fallback behavior
- Policies are centralized in reference document
- Workflows apply policies, don't define them

## Policy Reference Summary

Quick reference for all policies:

| Policy | Decision Point | Observable Condition | Choice |
|--------|----------------|---------------------|--------|
| POLICY-01 | new-project brownfield | code exists AND no map | trigger mapping |
| POLICY-02 | new-project research | config.research=true AND greenfield | enable research |
| POLICY-03 | new-project scoping | table stakes OR PROJECT.md mention | classify v1 |
| POLICY-04 | new-project roadmap | 100% coverage AND deps satisfied | approve |
| POLICY-05 | plan-phase approval | checker PASSED | approve |
| POLICY-06 | execute-plan decision | context matches option | select option |
| POLICY-07 | execute-plan verify | all checks pass | approve |

## Open Questions

Things that couldn't be fully resolved:

1. **Policy conflict resolution**
   - What we know: Each policy applies to distinct decision points
   - What's unclear: What if future policies overlap?
   - Recommendation: For now, policies are distinct. Add conflict rules if needed later.

2. **Policy versioning**
   - What we know: Policies may need to evolve
   - What's unclear: How to handle policy changes mid-project
   - Recommendation: Policies apply based on when autonomous mode is enabled. Changes apply to new sessions.

3. **Policy testing**
   - What we know: Policies should be testable
   - What's unclear: How to validate policies without running full workflows
   - Recommendation: Add manual testing during implementation. Automated testing is Phase 5 scope (tech debt).

## Sources

### Primary (HIGH confidence)

- `.planning/REQUIREMENTS.md` - POLICY-01 through POLICY-07 specifications
- `get-shit-done/references/autonomous.md` - Autonomous decision patterns from Phase 1
- `get-shit-done/references/autonomous-defaults.md` - Default behavior patterns from Phase 1
- `get-shit-done/references/context-assembly.md` - Context gathering patterns from Phase 2
- `get-shit-done/workflows/execute-plan.md` - Checkpoint handling implementation
- `commands/gsd/new-project.md` - Brownfield detection, research toggle, roadmap approval points
- `commands/gsd/plan-phase.md` - Plan approval points
- `.planning/phases/01-inner-voice-foundation/01-RESEARCH.md` - Foundation patterns
- `.planning/phases/02-context-aware-reasoning/02-RESEARCH.md` - Context patterns

### Secondary (MEDIUM confidence)

- Analysis of existing GSD decision points (grep for AskUserQuestion, checkpoint)
- Phase 1 and Phase 2 SUMMARY files showing what was implemented

### Tertiary (LOW confidence)

- None - this is internal implementation research, all findings are from codebase analysis

## Metadata

**Confidence breakdown:**
- Policy definitions: HIGH - Clear requirements, existing infrastructure
- Observable conditions: HIGH - Based on existing GSD file patterns
- Workflow integration: HIGH - Clear integration points already exist
- Policy format: MEDIUM - Format is new, may need iteration during implementation

**Research date:** 2026-01-26
**Valid until:** N/A - Implementation research for specific phase, not technology research

---

*Phase: 03-decision-policies*
*Research completed: 2026-01-26*
*Ready for planning: yes*
