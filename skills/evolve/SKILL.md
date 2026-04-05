---
name: evolve
description: Skill Evolution — PDCA 데이터 기반 스킬 자동 생성/관리
classification: workflow
classification-reason: PDCA 사이클 데이터에서 패턴을 감지하고 스킬을 자동 생성하는 프로세스 자동화
deprecation-risk: none
triggers:
  - evolve
  - skill evolution
  - pattern mining
  - 스킬 진화
  - 패턴 마이닝
---

# Skill Evolution

> PDCA 사이클 데이터(btw 제안, M1-M10 메트릭, gap 분석)로부터 반복 패턴을 감지하고 스킬을 자동 생성하는 Auditable Skill Evolution 시스템.

## Commands

| Command | Description | Example |
|---------|-------------|---------|
| `/evolve mine` | 수동 패턴 마이닝 실행 | `/evolve mine` |
| `/evolve status` | 현재 진화 상태 (제안/배포/효과) | `/evolve status` |
| `/evolve approve <name>` | 제안 승인 → skills/로 배포 | `/evolve approve convention-guard` |
| `/evolve reject <name>` | 제안 거부 (사유 입력) | `/evolve reject type-safety-reminder` |
| `/evolve history` | 진화 이력 조회 | `/evolve history` |

## Action: mine

Run pattern mining across 3 data sources:

1. Load `lib/evolution` module
2. Call `mineAll()` — scans:
   - `.bkit/btw-suggestions.json` (Pattern C: btw 클러스터)
   - `.bkit/state/quality-history.json` (Pattern B: 메트릭 하락)
   - `docs/03-analysis/*.analysis.md` (Pattern A: gap 반복)
3. Score patterns by confidence (occurrences * evidence_strength * recency_weight)
4. Filter by threshold (default: confidence >= 0.7)
5. Take top 5 patterns
6. Call `synthesizeAll(patterns)` — generates SKILL.md + eval.yaml per pattern
7. Call `propose(stagedSkills)` — records proposals + audit log
8. Display results table

## Action: status

1. Call `getStatus()` from `lib/evolution`
2. Display: pending proposals, deployed skills count, measured skills
3. For each pending proposal: name, classification, pattern type, confidence

## Action: approve

1. Parse skill name from arguments
2. Call `approve(skillName)` from `lib/evolution`
3. Moves skill from `.bkit/evolution/staging/{name}/` to `.claude/skills/project/{name}/`
4. Records in history + audit log
5. Display success message with deploy path

## Action: reject

1. Parse skill name from arguments
2. Ask for rejection reason via AskUserQuestion
3. Call `reject(skillName, reason)` from `lib/evolution`
4. Records rejection with reason in history + audit log

## Action: history

1. Call `getHistory(20)` from `lib/evolution`
2. Display recent evolution entries (proposed/approved/rejected)

## Auto-Trigger

Pattern mining runs automatically when `/pdca report` completes (if `evolution.autoTriggerOnReport` is true in `bkit.config.json`).

## Configuration

Settings in `bkit.config.json` → `evolution` section:

| Key | Default | Description |
|-----|---------|-------------|
| `enabled` | true | Evolution 기능 활성화 |
| `minConfidence` | 0.6 | 최소 confidence 임계값 |
| `initialConfidence` | 0.7 | 초기 보수적 임계값 |
| `maxProposals` | 5 | 최대 제안 수 |
| `minOccurrences` | 3 | 최소 패턴 발생 횟수 |
| `btwSimilarityThreshold` | 0.7 | Jaccard 유사도 임계값 |
| `autoTriggerOnReport` | true | Report 완료 시 자동 실행 |
