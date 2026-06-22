# bkit Project Rules

## Language Rules

### Conversation
- Always respond in the **same language the user's prompt is written in**. Match the user's language for all conversational replies (e.g., English prompt → English reply, 한국어 프롬프트 → 한국어 답변).

### Code & Documentation Language
- **English by default** for ALL generated content:
  - Code, comments, commit messages, PR descriptions
  - README.md, CHANGELOG.md, and all non-docs/ markdown files
  - Agent definitions (`agents/*.md`), skill definitions (`skills/*/SKILL.md`)
  - Templates (`templates/*.md`)
  - Config files, error messages, log messages

- **Bilingual docs (`docs/` only)** — every NEW file under `docs/` and its subdirectories (`docs/01-plan/`, `docs/02-design/`, `docs/03-analysis/`, `docs/04-report/`, etc.) MUST be created as a matched pair of sibling files:
  - `<base>.en.md` — English version
  - `<base>.ko.md` — Korean (한국어) version
  - Suffix convention: dot separator with ISO language codes (`en`, `ko`). Use `ko`, not `kr`.
  - Both versions must stay in sync in content; only the language differs.
  - Applies to NEW files only — do NOT retroactively rename or translate existing docs.
- **Korean-only exceptions** (한국어 작성, single file):
  - 8-language auto-trigger keywords (EN, KO, JA, ZH, ES, FR, DE, IT) in agent/skill trigger lists
  - bkit memory state descriptions in `.bkit/state/memory.json`

### Key Principle
bkit is a **global service**. Keep all public-facing and code-level content in English. Conversation language follows the user's prompt language. New `docs/` files are bilingual (`.en.md` + `.ko.md` siblings); everything else stays English-only.

### Do NOT
- Do NOT create a new `docs/` file in only one language — always produce both `.en.md` and `.ko.md` siblings
- Do NOT retroactively rename or translate existing docs (waste of tokens; new-files-only rule)
- Do NOT mix languages within a single file (except trigger keyword lists)

## Sprint Management (v2.1.13)

Sprint Management is a meta-container that groups one or more features under a
shared scope, budget, and timeline. Each sprint runs its own 8-phase lifecycle:
`prd → plan → design → do → iterate → qa → report → archived`.

When the user mentions "sprint", invoke `bkit:sprint` skill (`/sprint <action>`).
Sprint phases coexist with PDCA's 9-phase enum — both may track concurrently
(see `docs/06-guide/sprint-migration.guide.md`).

Trust Level scope (`SPRINT_AUTORUN_SCOPE`, L0–L4) controls auto-run boundaries.
At L4 Full-Auto, the orchestrator advances phases until any of 4 auto-pause
triggers fires (quality gate fail / iteration exhausted / budget exceeded /
phase timeout).

For deep-dive Korean guidance, see `docs/06-guide/sprint-management.guide.md`.
