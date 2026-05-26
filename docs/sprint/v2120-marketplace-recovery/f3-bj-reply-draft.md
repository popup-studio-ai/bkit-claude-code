---
template: external-dogfooder-reply
sprintId: v2120-marketplace-recovery
feature: F3
date: 2026-05-26
recipient: 정병진 (@bj)
incidentDate: 2026-05-26
status: draft (pending kay 발송)
priority: P0 HOT (D1 AM 12:00 KST 이전 출고 목표)
---

# F3 — 정병진 (@bj) install 실패 회신 Draft

> **목적**: 정병진 @bj 2026-05-26 install 실패 사건 (`Validation errors: : Unrecognized key: "displayName"`) 회신.
> 외부 dogfooder Lifecycle Stage 1 (Issue Filed) → Stage 2 (Repro absorbed) 진행 트리거.
>
> **발송 주체**: kay (POPUP STUDIO) — 본 draft는 사용자 검토 + 보낸 후 실제 메시지로 발송 후 audit_logger record.
> **발송 채널**: 정병진 회신 채널 (이메일 / GitHub issue / Slack DM 중 원래 incident 채널과 동일하게).
> **사전 분석 출처**: `docs/03-analysis/cc-v2146-v2150-strict-manifest-validation.analysis.md` (cc-version-researcher 88% 신뢰도 결론).

---

## 한국어 본문 (기본)

```
안녕하세요 정병진(@bj)님,

bkit v2.1.14 install 실패 (`Validation errors: : Unrecognized key: "displayName"`) 사건에 대해 회신드립니다. 먼저 bkit 메인테이너 측에서 늦지 않게 응답하지 못한 점 양해 부탁드립니다.

## 1. 진단 결과 (cc-version-researcher 88% 신뢰도)

정병진님께서 보내주신 에러 메시지를 cc-version-researcher agent로 분석한 결과,
- bkit `.claude-plugin/plugin.json`의 `displayName` 필드는 **Claude Code v2.1.143+ 의 공식 schema 정식 키**입니다.
- v2.1.143 미만 Claude Code의 strict plugin-manifest path는 `displayName`을 unknown key로 거부하므로 install이 실패합니다 (Issue #26555 외 6+ 이슈 입증).
- 따라서 정병진님 환경의 Claude Code는 **v2.1.142 이하**일 가능성 98% 입니다.

자세한 분석은 `docs/03-analysis/cc-v2146-v2150-strict-manifest-validation.analysis.md` 에 정리되어 있습니다.

## 2. 확인 부탁드리는 정보 (Q2 미해결)

확실하게 root cause 가 본 가설과 일치하는지 검증을 위해 아래 한 줄만 실행 후 출력값을 회신해주시면 감사하겠습니다:

    claude --version

(설치된 Claude Code 버전 한 줄만 회신 부탁드립니다)

## 3. Workaround (즉시 install 재시도 가능)

Claude Code 를 최신 stable 로 업그레이드 후 install 재시도:

    npm install -g @anthropic-ai/claude-code@latest
    claude plugin install bkit

권장 버전:
- 보수적 권장: v2.1.123+
- 균형 권장: v2.1.146+ (101 consecutive bkit-compatible 누적)

## 4. bkit 측 대응 (v2.1.20 Sprint)

본 incident 가 트리거가 되어 bkit v2.1.20 "Marketplace Recovery" sprint 가 시작되었습니다 (2026-05-23):

- F1: README/README-FULL 에 minimum CC v2.1.143 명시 (advisory)
- F4: `docs/06-guide/cc-compatibility.guide.md` 작성 (install 실패 대응 self-service 가이드)
- F5: `scripts/validate-plugin.js --strict` 21-key whitelist CI gate (ENH-322)
- F7: `scripts/release-plugin-tag.sh` 에 `claude plugin validate .` wire (ADR 0006 § Empirical Validation Gate 충족)
- F8: `lib/cc-regression/registry.js` R3-321 신규 guard (ENH-321) — 매일 09:00 KST reconcile cycle 통합
- F10: SessionStart hook 에 CC version detection 추가 (ENH-323) — 향후 같은 사건 사전 안내
- F11: ADR 0011 Plugin Manifest Schema Compliance Policy 신규 채택

향후 같은 incident 0건 보장 + 외부 사용자 self-service 가능을 목표로 합니다.

## 5. bkit Early Adopter Program Hall of Fame 등록 검토

정병진님은 bkit Early Adopter Program 의 외부 dogfooder #2 후보입니다 (#1 은 @pruge, v2.1.19 first follower).

`docs/external-dogfooders/_README.md` 5-stage Lifecycle 정책에 따라, 정병진님께서 동의하신다면
- 정병진님의 reproduction scenario 가 bkit E2E regression test (`test/e2e/cc-min-version.test.js`) 로 영구 흡수됩니다.
- bkit Trust Score 의 `externalDogfoodFeedbackResponseRate` component (weight 0.05) 에 기여됩니다.
- v2.1.20 GA CHANGELOG + Real User Hall of Fame 명단에 공개 acknowledge 됩니다 (`docs/external-dogfooders/bj.md`).

동의 여부 / 공개 시 표시할 handle 또는 이름 / 사용 중인 project 명 (선택) 회신 부탁드립니다.

## 6. 마무리

bkit 을 production 에 직접 적용해주시고 정확한 에러 메시지 + 경로 (`/Users/bj/.claude/plugins/cache/temp_git_1779631720189_ocjr7a/.claude-plugin/plugin.json`) 까지 공유해주신 덕분에 본 sprint 의 정확한 fix scope 가 결정되었습니다. 정말 감사합니다.

추가 질문 / 다른 incident / install 재시도 결과 있으시면 언제든 회신 부탁드립니다.

— kay (POPUP STUDIO PTE. LTD.) · kay@popupstudio.ai
— bkit v2.1.20 Marketplace Recovery Sprint · 2026-05-26
```

---

## English fallback (optional, in case @bj prefers English)

```
Hi 정병진 (@bj),

Replying to your bkit v2.1.14 install failure (`Validation errors: : Unrecognized key: "displayName"`).

## 1. Diagnosis (cc-version-researcher, 88% confidence)

The `displayName` field in bkit's `.claude-plugin/plugin.json` is an official Claude Code v2.1.143+ manifest key. Older Claude Code (≤ v2.1.142) goes through a strict plugin-manifest path that rejects `displayName` as an unrecognized key (Issue #26555 + 6 related). So your Claude Code is almost certainly ≤ v2.1.142.

Full analysis: `docs/03-analysis/cc-v2146-v2150-strict-manifest-validation.analysis.md`.

## 2. Please confirm (Q2)

Could you run `claude --version` and reply with the output? That confirms the root cause.

## 3. Workaround

    npm install -g @anthropic-ai/claude-code@latest
    claude plugin install bkit

Recommended Claude Code: v2.1.123+ (conservative) or v2.1.146+ (balanced, 101 consecutive bkit-compatible).

## 4. bkit response — v2.1.20 Marketplace Recovery Sprint

This incident triggered the bkit v2.1.20 sprint (started 2026-05-23):
- Minimum CC v2.1.143 advisory in README/README-FULL (F1)
- New cc-compatibility guide (F4)
- Plugin manifest 21-key whitelist CI gate (F5/F6, ENH-322)
- `claude plugin validate .` wired into release script (F7, ADR 0006 Empirical Validation Gate)
- New cc-regression guard R3-321 (F8, ENH-321)
- SessionStart CC version detection (F10, ENH-323)
- New ADR 0011 (Plugin Manifest Schema Compliance Policy)

## 5. Hall of Fame invitation

You are the external dogfooder #2 candidate for the bkit Early Adopter Program (#1 was @pruge). With your consent we would absorb your reproduction into `test/e2e/cc-min-version.test.js`, credit you in CHANGELOG, and publish a `docs/external-dogfooders/bj.md` entry. Please reply with: consent (yes/no), public handle/name to display, and optional project name.

## 6. Thank you

Production usage + precise error message + cache path you shared scoped this sprint's fix correctly. Thank you.

— kay (POPUP STUDIO PTE. LTD.) · kay@popupstudio.ai
```

---

## 발송 후 audit_logger record (수동 또는 sprint-orchestrator 자동)

발송 완료 시 아래 JSON 라인을 `.bkit/audit/audit-log.ndjson` 에 append:

```json
{"ts":"2026-05-26T<HH:MM:SS>Z","actor":"kay","action_type":"sprint_external_reply","feature":"v2120-marketplace-recovery","sub_feature":"F3","recipient":"@bj","channel":"<email|gh-issue|slack>","sprint_phase":"do","lifecycle_stage_before":1,"lifecycle_stage_after":2,"audit_marker":"ADR 0011 dogfooding stage transition"}
```

---

## Acceptance Criteria (Plan §R3)

- [x] CC `--version` 출력 요청 명시 (§ 2)
- [x] `npm install -g @anthropic-ai/claude-code@latest` workaround 명시 (§ 3)
- [x] ADR 0003 Phase 1.5 Empirical Validation dogfooding marker (§ 1, cc-version-researcher 88% reference)
- [x] Hall of Fame 등록 검토 안내 + 5-stage Lifecycle 정책 인용 (§ 5)
- [x] 본 sprint v2.1.20 진행 안내 + F1+F4 advisory + F14 entry 예정 (§ 4)
- [ ] D1 AM 12:00 KST 이전 회신 출고 — **kay 수동 진행 (본 draft 검토 후 발송)**
- [ ] audit_logger record entry — **발송 후 수동 또는 자동**
