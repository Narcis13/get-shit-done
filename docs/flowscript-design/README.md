# FlowScript Design Documents

Text-native workflow engine design — like n8n but markdown-based.

## Documents

| File | Description |
|------|-------------|
| `WORKFLOW-ENGINE-BRAINSTORM.md` | Core concepts, node architecture, runtime design |
| `WORKFLOW-ENGINE-PARADIGM-SHIFTS.md` | 10 revolutionary concepts that differentiate this system |
| `WORKFLOW-ENGINE-SPEC.md` | Formal syntax specification (YAML + XML + Markdown) |

## Quick Overview

**FlowScript** = Executable workflows defined in `.flow.md` files

```
workflow.flow.md
├── YAML Frontmatter    ← Config, triggers, schemas
├── XML Body            ← Execution logic (nodes, branches, loops)
└── Markdown Footer     ← Auto-populated logs, learnings
```

## Key Innovations

1. **AI as first-class citizen** — Not just "call AI" but AI reasoning in control flow
2. **Self-evolving workflows** — Learn from outcomes, improve prompts automatically
3. **Typed data flow** — Schema validation between nodes
4. **Git-native** — Review workflows in PRs, track changes, collaborate
5. **Multi-agent collaboration** — Specialized agents work as a team

## Status

Design phase. Not yet implemented.
