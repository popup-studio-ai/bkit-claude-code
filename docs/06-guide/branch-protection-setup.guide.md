---
title: Branch Protection 설정 가이드
audience: bkit 메인테이너 (admin 권한 보유자)
status: Active
since: v2.1.18
last-updated: 2026-05-20
---

# Branch Protection 설정 가이드

> v2.1.17 5축 매트릭스 중 **Enforcement** 축의 user action 항목. `Invocation Contract Check` workflow를 main 브랜치 Required Status Check로 강제하여 red 상태의 release를 영구 차단.

---

## 1. Background

### 1.1 사고 클래스 (해소 목적)

v2.1.14 ~ v2.1.16 release line 3건 모두 `Invocation Contract Check` workflow가 8일간 red 상태였으나 release commit이 그대로 main에 머지됨. 이유:

- main 브랜치에 **Required Status Check 설정 없음**
- workflow 결과는 informational, 머지 차단 효과 없음

v2.1.17 PR #97에서 Detection/Recovery/Governance/Evolution 4축 close 후에도 본 Enforcement 축은 user manual action으로 남음. v2.1.18 본 PDCA에서 자동화 script 도입.

### 1.2 효과

설정 후 main 브랜치는:
- PR이 통과해야 머지 가능 (`Contract Test (L1 Frontmatter + L4 Deprecation)` job)
- L5 inventory도 통과해야 머지 가능 (`Contract Test L5 (Invocation Inventory)`, v2.1.18 mandatory 승격)
- force push 차단 (`allow_force_pushes: false`)
- branch 삭제 차단 (`allow_deletions: false`)
- admin도 정책 따름 (`enforce_admins: true` 옵션 — 본 script는 `false` default)

---

## 2. 사전 요구사항

- `gh` CLI 설치 (https://cli.github.com/)
- `jq` 설치 (`brew install jq` / `apt install jq`)
- `popup-studio-ai/bkit-claude-code` repo에 **admin 권한** 보유 GitHub account
- `gh auth login`으로 admin account active

```bash
# active account 확인
gh auth status

# admin role 확인
gh api /repos/popup-studio-ai/bkit-claude-code/collaborators/$(gh api user --jq .login)/permission \
  --jq .permission
# expected: "admin"
```

---

## 3. 사용 방법

### 3.1 Dry-run (default — 실행 영향 없음)

```bash
bash scripts/setup-branch-protection.sh
# 또는
bash scripts/setup-branch-protection.sh --dry-run
```

출력 예:

```
[setup-branch-protection] Active gh user: kay-popup
[setup-branch-protection] Target: popup-studio-ai/bkit-claude-code / main

[dry-run] Would PUT /repos/.../branches/main/protection with payload:
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "Contract Test (L1 Frontmatter + L4 Deprecation)",
      "Contract Test L5 (Invocation Inventory)"
    ]
  },
  ...
}
```

### 3.2 Apply (실제 설정)

```bash
bash scripts/setup-branch-protection.sh --apply
```

성공 시 `✓ Branch protection applied successfully.` 출력.

### 3.3 검증

```bash
gh api /repos/popup-studio-ai/bkit-claude-code/branches/main/protection \
  --jq '.required_status_checks'
```

출력:

```json
{
  "url": "...",
  "strict": true,
  "contexts": [
    "Contract Test (L1 Frontmatter + L4 Deprecation)",
    "Contract Test L5 (Invocation Inventory)"
  ],
  "checks": [...]
}
```

---

## 4. Idempotency

Script는 idempotent. 재실행 시 동일 payload 전송, GitHub API는 동일 상태로 reset. 정책 drift 시 재실행으로 복구 가능.

---

## 5. Required Status Checks 추가/제거

새 workflow가 release-blocking이 되어야 한다면:

1. `.github/workflows/contract-check.yml` 에 새 job 추가
2. `scripts/setup-branch-protection.sh` 의 `CONTEXTS` 배열에 정확한 job name 추가
3. PR로 변경 → 머지 후 `--apply`

**중요**: `CONTEXTS` 이름은 workflow의 `name:` 필드와 글자 그대로 일치해야 함. 띄어쓰기/괄호 포함.

---

## 6. Admin override 정책

`enforce_admins: false` (default) — admin은 정책 우회 가능. 긴급 hotfix 등에서 사용.

`enforce_admins: true` 로 변경하면 admin도 정책 적용. 본 PDCA에서는 default `false` 유지 (긴급 상황 대비).

Hotfix 시 admin override 사용:

```bash
gh pr merge <pr-num> --admin --squash
```

사용 후 audit log에 기록 (`docs/07-adr/` 또는 release report에 사유 명시).

---

## 7. 제거 방법 (필요 시)

```bash
gh api -X DELETE /repos/popup-studio-ai/bkit-claude-code/branches/main/protection
```

다시 활성화하려면 `--apply` 재실행.

---

## 8. 사고 기록

### 8.1 v2.1.14 ~ v2.1.16 — Enforcement 부재로 인한 red release

5/12 ~ 5/20 8일간 main이 `Invocation Contract Check` red 상태였음에도 v2.1.15 (PR #88), v2.1.16 (PR #96)이 정상 머지. 누구도 차단되지 않음.

**원인**: main 브랜치에 Required Status Check 설정 없음.

**조치 (v2.1.18)**: 본 script + 가이드. user (admin) 실행만 남음.

---

## 9. 관련 문서

- `scripts/setup-branch-protection.sh` — script 자체
- `.github/workflows/contract-check.yml` — workflow 정의
- `docs/04-report/features/v2117-ci-cd-hardening.report.md` §5 — Enforcement 축 carryover (CO-1)
- `docs/01-plan/features/v2118-carryover-cleanup.plan.md` — CO-1 도입 PDCA

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-05-20 | Initial guide (v2.1.18 script 도입) | kay |
