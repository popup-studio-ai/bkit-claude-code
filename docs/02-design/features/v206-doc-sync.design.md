# Design: v2.0.6 Documentation Sync

## Executive Summary

| Item | Detail |
|------|--------|
| Feature | v2.0.6 Documentation Sync |
| Date | 2026-03-25 |
| Plan Reference | docs/01-plan/features/v206-doc-sync.plan.md |

## Change Specification

### Count Updates (Global)

| Metric | Old (v2.0.5) | New (v2.0.6) |
|--------|:------------:|:------------:|
| Version | 2.0.5 | 2.0.6 |
| Lib Modules | 78 (docs say 76) | 88 |
| Lib Subdirectories | 10 | 11 |
| Agents | 31 | 32 |
| Skills | 36 | 37 |
| Scripts | 54 | 57 |
| Hook Events | 18 | 18 (unchanged) |
| Exports | ~580+ | ~620+ |
| LOC | ~40K | ~45K |

### File-by-File Change Map

#### 1. `bkit.config.json` (line 3)
```
"version": "2.0.5" → "version": "2.0.6"
```

#### 2. `.claude-plugin/plugin.json` (lines 3, 5)
```
"version": "2.0.5" → "version": "2.0.6"
"description": update counts: "37 Skills, 32 Agents, 18 Hook Events"
```

#### 3. `.claude-plugin/marketplace.json` (lines 4, 36-37)
```
"version": "2.0.5" → "version": "2.0.6" (top-level)
"description": update counts: "37 Skills, 32 Agents"
"version": "2.0.5" → "version": "2.0.6" (bkit plugin entry)
```

#### 4. `README.md`

| Line | Old | New |
|------|-----|-----|
| 5 | Version-2.0.5 | Version-2.0.6 |
| 39 | 36 Skills | 37 Skills |
| 40 | 31 Agents | 32 Agents |
| 41 | ~580+ Functions | ~620+ Functions |
| 48 | 18 events | 18 events (unchanged) |
| 53 | 21 modules | 21 modules → add "lib/context" mention |
| 64 | Add new v2.0.6 feature bullet after v2.0.3 line |
| 66 | 76 lib modules, 36 skills, 31 agents | 88 lib modules, 37 skills, 32 agents |
| 81 | 31 agents | 32 agents |
| 92 | 36 Skills | 37 Skills |
| 93 | 31 Agents (10 opus / 19 sonnet / 2 haiku) | 32 Agents (11 opus / 19 sonnet / 2 haiku) |
| 94 | 21 Hook Scripts | keep or update to match actual |
| 95 | ~580+ … 76 lib modules across 10 | ~620+ … 88 lib modules across 11 |
| 116 | 36 skills | 37 skills |
| 156 | 36 skills | 37 skills |
| 276 | 76 modules across 10 subdirs | 88 modules across 11 subdirs |
| 582 | ~580+ functions across 76 modules, 36 skills, and 31 agents | ~620+ … 88 modules, 37 skills, 32 agents |

#### 5. `CHANGELOG.md` — Insert new section at top (after line 7)

New `[2.0.6]` entry documenting:
- Living Context System (lib/context/ 7 modules)
- Self-Healing Agent + scripts
- Deploy Skill + deploy state machine
- PDCA Handoff Loss Fix Phase 2+3
- Infrastructure templates (11 new)
- Updated counts

#### 6. `AI-NATIVE-DEVELOPMENT.md`

| Line | Old | New |
|------|-----|-----|
| 17 | 36 Skills | 37 Skills |
| 18 | 31 Agents | 32 Agents |
| 145 | 36 Skills | 37 Skills |
| 146 | 31 Agents | 32 Agents |
| 147 | ~580+ funcs | ~620+ funcs |
| 186 | 36 skills … 17 Workflow / 18 Capability / 1 Hybrid | 37 skills … 18 Workflow / 18 Capability / 1 Hybrid |
| 187 | 18 events, 54 scripts | 18 events, 57 scripts |
| 188 | 76 modules … 10 subdirectories | 88 modules … 11 subdirectories (+context) |
| 195 | 36 Skills | 37 Skills |
| 196 | 31 Agents | 32 Agents |
| 215 | 31 Specialized Agents | 32 Specialized Agents |
| 215 | 10 opus + 19 sonnet + 2 haiku | 11 opus + 19 sonnet + 2 haiku |

#### 7. `CUSTOMIZATION-GUIDE.md`

Search and update any component count tables referencing old numbers.

#### 8. `bkit-system/README.md`

| Line | Old | New |
|------|-----|-----|
| 41 | 36 skills, 54 scripts | 37 skills, 57 scripts |
| 72 | (36 Skills) / (31 Agents) / (10 subdirs) | (37 Skills) / (32 Agents) / (11 subdirs) |
| 241 | 76 modules | 88 modules |
| 252 | 31 agents | 32 agents |
| 264 | 10 subdirectories | 11 subdirectories |
| 354 | 36 skills, 31 agents, 54 scripts | 37 skills, 32 agents, 57 scripts |
| 383 | ~580+ exports (10 subdirectories) | ~620+ exports (11 subdirectories) |
| Add v2.0.6 version note in header area |

#### 9. `bkit-system/_GRAPH-INDEX.md`

| Line | Old | New |
|------|-----|-----|
| 43 | 36 skills | 37 skills |
| 44 | 54 scripts, ~580+ | 57 scripts, ~620+ |
| 118 | 36 Skills | 37 Skills |
| 119 | 31 Agents | 32 Agents |
| 120 | ~580+ exports | ~620+ exports |
| 219 | 31 agents | 32 agents |
| 428 | 36 skills | 37 skills |
| 429 | 31 agents | 32 agents |
| 430 | 54 scripts | 57 scripts |
| 431 | 76 modules (~580+) | 88 modules (~620+) |

#### 10. `bkit-system/philosophy/context-engineering.md`

| Line | Old | New |
|------|-----|-----|
| 6 | 76 lib modules, ~465 exports | 88 lib modules, ~620+ exports |
| 19 | 36 skills, 31 agents | 37 skills, 32 agents |
| 76 | 31 agents | 32 agents |
| 89 | 76 files across 10 subdirectories, ~465 | 88 files across 11 subdirectories, ~620+ |
| 122 | 36 Skills | 37 Skills |
| 126 | 36 Skills | 37 Skills |
| 152 | 31 Agents | 32 Agents |
| 183 | 10 subdirs | 11 subdirs |

#### 11. `bkit-system/philosophy/core-mission.md`

| Line | Old | New |
|------|-----|-----|
| 123 | 36 skills | 37 skills |
| 136 | 31 agents | 32 agents |
| 151 | 36 Skills, 31 Agents | 37 Skills, 32 Agents |
| 161 | 76 files across 10 subdirs (~465) | 88 files across 11 subdirs (~620+) |

#### 12. `bkit-system/philosophy/ai-native-principles.md`

| Line | Old | New |
|------|-----|-----|
| 138 | 31 agents | 32 agents |

#### 13. `bkit-system/components/skills/_skills-overview.md`

| Line | Old | New |
|------|-----|-----|
| 3 | 36 Skills (v2.0.4) | 37 Skills (v2.0.6) |
| 13 | 36 skills | 37 skills |
| 68 | 36 skills | 37 skills |

#### 14. `bkit-system/components/agents/_agents-overview.md`

| Line | Old | New |
|------|-----|-----|
| 3 | 31 Agents (v2.0.4) | 32 Agents (v2.0.6) |
| 15 | 31 agents | 32 agents |
| 272 | 31 agents | 32 agents |
| Add self-healing agent entry to agent list |

#### 15. `bkit-system/components/scripts/_scripts-overview.md`

| Line | Old | New |
|------|-----|-----|
| 80 | ~580+ exports | ~620+ exports |
| 225 | 10 subdirectories, 76 modules with ~580+ | 11 subdirectories, 88 modules with ~620+ |
| 240 | ~580+ | ~620+ |
| 242 | ~580+ total exports … 10 subdirectories, 76 modules | ~620+ … 11 subdirectories, 88 modules |

#### 16. `bkit-system/components/hooks/_hooks-overview.md`

| Line | Old | New |
|------|-----|-----|
| 5 | 54 scripts | 57 scripts |

## Implementation Order

1. Config files (bkit.config.json, plugin.json, marketplace.json)
2. CHANGELOG.md (new section)
3. README.md (version badge + counts)
4. AI-NATIVE-DEVELOPMENT.md (counts)
5. CUSTOMIZATION-GUIDE.md (counts)
6. bkit-system/ files (README, GRAPH-INDEX, philosophy/, components/)
