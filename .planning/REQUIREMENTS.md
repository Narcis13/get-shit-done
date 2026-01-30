# Requirements: GSD v2.0 IDE

**Defined:** 2026-01-30
**Core Value:** Visual interface for browsing, editing, and understanding GSD meta-prompting files

## v1 Requirements

Requirements for v2.0 IDE release. Each maps to roadmap phases.

### IDE Server

- [ ] **SRV-01**: Server starts with single command (`npm run ide`)
- [ ] **SRV-02**: Server binds to localhost only (127.0.0.1:3456)
- [ ] **SRV-03**: GET /api/tree returns directory tree for commands/, looppool/, agents/
- [ ] **SRV-04**: GET /api/file?path=... returns file content
- [ ] **SRV-05**: PUT /api/file?path=... writes file content
- [ ] **SRV-06**: Path validation prevents directory traversal attacks
- [ ] **SRV-07**: File watching detects changes in watched directories
- [ ] **SRV-08**: SSE endpoint pushes file change events to frontend

### IDE Core

- [ ] **CORE-01**: Left sidebar displays file tree of commands/, looppool/, agents/
- [ ] **CORE-02**: Directories can be collapsed/expanded
- [ ] **CORE-03**: Clicking file opens it in editor panel
- [ ] **CORE-04**: Editor displays markdown with syntax highlighting
- [ ] **CORE-05**: Editor supports YAML frontmatter syntax highlighting
- [ ] **CORE-06**: Editor shows line numbers
- [ ] **CORE-07**: Auto-save triggers 2 seconds after last keystroke
- [ ] **CORE-08**: Visual indicator shows unsaved changes
- [ ] **CORE-09**: Interface loads in under 1 second
- [ ] **CORE-10**: Works in Chrome, Firefox, Safari

### Command Viewer

- [ ] **CMD-01**: YAML frontmatter parsed and displayed as card
- [ ] **CMD-02**: Card shows name, description, argument-hint, allowed-tools
- [ ] **CMD-03**: Visual badges display allowed tools
- [ ] **CMD-04**: "Copy command" button copies /lpl:command-name to clipboard
- [ ] **CMD-05**: "View workflow" link navigates to referenced workflow file
- [ ] **CMD-06**: Related agents shown as clickable links

### State Panel

- [ ] **STATE-01**: Shows current milestone and phase from STATE.md
- [ ] **STATE-02**: Shows task completion progress from PLAN.md files
- [ ] **STATE-03**: Roadmap displayed with phases from ROADMAP.md
- [ ] **STATE-04**: Visual progress bar per phase
- [ ] **STATE-05**: Clicking phase navigates to its plan file
- [ ] **STATE-06**: "Resume work" shows CONTINUE_HERE.md if exists
- [ ] **STATE-07**: Updates when planning files change

### Graph View

- [ ] **GRAPH-01**: Commands rendered as blue nodes
- [ ] **GRAPH-02**: Workflows rendered as green nodes
- [ ] **GRAPH-03**: Agents rendered as orange nodes
- [ ] **GRAPH-04**: Templates rendered as gray nodes
- [ ] **GRAPH-05**: Edges show delegation/spawning relationships
- [ ] **GRAPH-06**: Click node opens file in editor
- [ ] **GRAPH-07**: Double-click node opens file in editor
- [ ] **GRAPH-08**: Zoom and pan supported
- [ ] **GRAPH-09**: Filter by component type
- [ ] **GRAPH-10**: Hierarchical layout (Commands → Workflows → Agents → Templates)
- [ ] **GRAPH-11**: Graph readable with 50+ nodes

## v2 Requirements

Deferred to future release. Not in current roadmap.

### Advanced Editor

- **EDIT-01**: Multi-file tabs
- **EDIT-02**: Search across files
- **EDIT-03**: Find and replace
- **EDIT-04**: Keyboard shortcuts customization

### Advanced Graph

- **GRAPH-12**: Export graph as image
- **GRAPH-13**: Save/load graph layouts
- **GRAPH-14**: Search within graph

### Integration

- **INT-01**: Terminal panel to run commands
- **INT-02**: Git integration (diff view)
- **INT-03**: Plugin system for extensions

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Multi-user collaboration | Single-user local tool, complexity not justified |
| Cloud sync | Files are local, no cloud infrastructure |
| Mobile responsive | Desktop tool for development work |
| Theme customization | Complexity, defer to v3+ |
| Plugin system | Anti-pattern per research, adds unnecessary complexity |
| Git integration | CLI handles git, IDE is for viewing/editing files only |
| Terminal panel | Out of scope per research, use actual terminal |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SRV-01 | Phase 7 | Pending |
| SRV-02 | Phase 7 | Pending |
| SRV-03 | Phase 7 | Pending |
| SRV-04 | Phase 7 | Pending |
| SRV-05 | Phase 7 | Pending |
| SRV-06 | Phase 7 | Pending |
| SRV-07 | Phase 7 | Pending |
| SRV-08 | Phase 7 | Pending |
| CORE-01 | Phase 8 | Pending |
| CORE-02 | Phase 8 | Pending |
| CORE-03 | Phase 8 | Pending |
| CORE-04 | Phase 8 | Pending |
| CORE-05 | Phase 8 | Pending |
| CORE-06 | Phase 8 | Pending |
| CORE-07 | Phase 8 | Pending |
| CORE-08 | Phase 8 | Pending |
| CORE-09 | Phase 8 | Pending |
| CORE-10 | Phase 8 | Pending |
| CMD-01 | Phase 9 | Pending |
| CMD-02 | Phase 9 | Pending |
| CMD-03 | Phase 9 | Pending |
| CMD-04 | Phase 9 | Pending |
| CMD-05 | Phase 9 | Pending |
| CMD-06 | Phase 9 | Pending |
| STATE-01 | Phase 10 | Pending |
| STATE-02 | Phase 10 | Pending |
| STATE-03 | Phase 10 | Pending |
| STATE-04 | Phase 10 | Pending |
| STATE-05 | Phase 10 | Pending |
| STATE-06 | Phase 10 | Pending |
| STATE-07 | Phase 10 | Pending |
| GRAPH-01 | Phase 11 | Pending |
| GRAPH-02 | Phase 11 | Pending |
| GRAPH-03 | Phase 11 | Pending |
| GRAPH-04 | Phase 11 | Pending |
| GRAPH-05 | Phase 11 | Pending |
| GRAPH-06 | Phase 11 | Pending |
| GRAPH-07 | Phase 11 | Pending |
| GRAPH-08 | Phase 11 | Pending |
| GRAPH-09 | Phase 11 | Pending |
| GRAPH-10 | Phase 11 | Pending |
| GRAPH-11 | Phase 11 | Pending |

**Coverage:**
- v1 requirements: 42 total
- Mapped to phases: 42
- Unmapped: 0 ✓

---
*Requirements defined: 2026-01-30*
*Last updated: 2026-01-30 after initial definition*
