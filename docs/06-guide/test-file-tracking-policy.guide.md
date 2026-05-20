---
title: Test 파일 Tracked Policy 가이드
audience: bkit 메인테이너, 컨트리뷰터
status: Active
since: v2.1.18
last-updated: 2026-05-20
---

# Test 파일 Tracked Policy 가이드

> CI workflow가 실행하는 test 파일이 git untracked 상태로 release까지 진행된 5/20 사고 (`Cannot find module`) 재발 방지 + 정책 명문화.

---

## 1. Policy 한 줄 요약

**bkit의 모든 production test 파일은 git tracked가 default.** 로컬 임시 test만 명시적 ignore 패턴으로 제외.

---

## 2. v2.1.18 이전 (사고 클래스)

기존 `.gitignore`:

```gitignore
test/
tests/*
!test/contract/
!test/contract/**
!tests/contract/
!tests/contract/**
!tests/unit/
!tests/unit/**
```

### 사고 메커니즘

1. `test/` 가 디렉터리 자체를 ignore — git은 traversal halt
2. 후속 `!test/contract/**` 은 effective 하지 않음 (이미 차단된 디렉터리 안의 path)
3. 새 `.test.js` 파일이 자동으로 untracked 상태 진입
4. 개발자가 `git add .` 해도 안 추가됨 (.gitignore 룰 적용)
5. `git add -f <file>`만 추가 가능 — 이 사실을 모르면 위장된 결함 발생
6. CI workflow가 `node test/...` 실행 시 `Cannot find module`

### 실제 위장 사례 (v2.1.14~v2.1.16)

| 파일 | 영향 |
|------|------|
| `tests/qa/bkit-full-system.test.js` | CI workflow Release Gate가 매번 ENOENT (Invocation Contract red로 가려짐) |
| `tests/qa/bkit-deep-system.test.js` | qa-aggregate scan에서 누락, 5/20 release 시 "33/36 → 36/36" 결과는 사실 local-only |
| `test/contract/l2-hook-attribution.test.js` | v2.1.17 PR #97 첫 CI run에서 노출 |
| `test/contract/l3-mcp-runtime.test.js` | 동일 |
| `test/contract/baseline/v2.1.9/agents/sprint-master-planner.json` 외 11 file | manifest와 불일치한 orphan baseline JSON, runner 동작에는 영향 없으나 hygiene 손상 |

---

## 3. v2.1.18 새 정책 (`.gitignore`)

```gitignore
# Production test directories are tracked by default.
# Only explicit local/temporary patterns are ignored.
test-scripts/
test/contract/baseline/tmp/
test/contract/baseline/.tmp/
test/local/
test/manual-only/
tests/local/
tests/manual-only/
```

핵심:
- `test/`, `tests/*` 통째 ignore 제거
- `git status` 에 새 test 파일 자동 표시
- `git add .` 또는 `git add -A` 시 자동 staging
- `-f` 옵션 불필요

---

## 4. PR self-review 체크리스트

신규 test 파일 추가 시:

- [ ] `git status` 출력에 새 파일이 표시되는가?
- [ ] `git add <file>` (force 없이) 성공하는가?
- [ ] `git ls-files <file>` 으로 tracked 확인
- [ ] CI workflow에서 직접 실행하는 파일인지 확인 (`grep "node $file" .github/workflows/*.yml`)
- [ ] qa-aggregate scan 디렉터리(`tests/qa/`, `test/contract/`, `test/unit/`, 등)에 포함되면 자동 검출됨

신규 디렉터리 (예: `test/foo/`) 추가 시:

- [ ] `.gitignore` 에 새 패턴 추가 필요한지 검토 — production이면 무 추가, local-only면 명시 ignore
- [ ] 변경 전후 `git ls-files | wc -l` 비교

---

## 5. .gitignore 변경 절차

`.gitignore` 수정 시 다음 검증:

```bash
# 변경 전 staged file count
before=$(git ls-files | wc -l)

# .gitignore 수정 후
git status --short | grep "^??" | wc -l  # 새로 visible해진 untracked

# 의도된 변경인지 visual review
git status --short | grep "^??" | head -20

# 전체 verify-all.sh 실행
bash /tmp/v2117-verify-all.sh
```

`.gitignore` PR에는 다음 포함:
- 변경 라인 수
- 새로 tracked 가능한 파일 수
- visual review 결과 (sensitive content 0)
- 영향받는 workflow step 확인

---

## 6. Local-only test 추가 시

진짜 local-only (release 외 파일) 작성 시:

| 위치 | 예시 | .gitignore 룰 |
|------|------|--------------|
| `test/local/` | 개인 디버깅 scratch | (이미 ignore) |
| `test/manual-only/` | 수동 실행 expensive test | (이미 ignore) |
| `tests/local/` | 동일 (tests 디렉터리) | (이미 ignore) |
| `test-scripts/` | shell utilities | (이미 ignore) |

위 디렉터리 외 위치에 두면 자동으로 tracked. local-only인지 인지하고 위치 선택.

---

## 7. 사고 기록

### 7.1 2026-05-12 ~ 2026-05-20 — Untracked CI-referenced test files

**원인**: 위 §2 메커니즘. v2.1.14~v2.1.16 사이클 3회 release 모두 영향.

**조치 (v2.1.17 + v2.1.18)**:
- v2.1.17 PR #97: 4 file force-tracked (`bkit-full-system`, `bkit-deep-system`, `l2-hook-attribution`, `l3-mcp-runtime`)
- v2.1.18 PR (본 PDCA): `.gitignore` narrow화로 root cause 해소 + 잔여 29 tests/qa file + 6 test/contract file 일괄 추가
- v2.1.18: 12 orphan baseline JSON (manifest 미등재) 삭제로 baseline hygiene 회복

**Lesson learned**:
1. `.gitignore` 의 `directory/` 형식은 deep negate를 막는다 — narrow file/path 패턴 사용
2. CI workflow에서 직접 실행하는 file은 무조건 tracked 확인
3. `git ls-files <file>` 한 줄 검증이 위장된 결함을 차단

---

## 8. 관련 문서

- `docs/06-guide/contract-baseline-rollforward.guide.md` — Baseline snapshot 정책
- `docs/04-report/features/v2117-ci-cd-hardening.report.md` §3.3 — 5/20 위장된 untracked 발견 경위
- `.gitignore` — 룰 자체
- `docs/01-plan/features/v2118-carryover-cleanup.plan.md` — CO-6 도입 PDCA

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-05-20 | Initial policy (v2.1.18 도입 시점) | kay |
