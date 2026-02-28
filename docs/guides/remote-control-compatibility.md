# Remote Control Compatibility Pre-check

> bkit v1.5.7 | Claude Code v2.1.58+ (Remote Control 확대)
> #28379 해결 대비 bkit skills RC 호환성 사전 점검

---

## 1. Current Status

- Remote Control: v2.1.51 도입, v2.1.58 접근 범위 확대 (Pro/Max plans)
- bkit slash commands: RC에서 **미지원** (#28379 Open)
- 영향: `/pdca`, `/starter`, `/dynamic` 등 모든 bkit slash commands가 RC UI에서 실행 불가

---

## 2. bkit Skills RC 호환성 매트릭스

### 2.1 User-Invocable Skills (12)

| Skill | Slash Command | RC 호환성 예상 | 블로커 |
|-------|--------------|:-------------:|--------|
| pdca | /pdca plan/design/do/... | Pending | #28379 |
| plan-plus | /plan-plus {feature} | Pending | #28379 |
| starter | /starter init {name} | Pending | #28379 |
| dynamic | /dynamic init {name} | Pending | #28379 |
| enterprise | /enterprise init {name} | Pending | #28379 |
| development-pipeline | /development-pipeline start | Pending | #28379 |
| code-review | /code-review {path} | Pending | #28379 |
| zero-script-qa | /zero-script-qa | Pending | #28379 |
| claude-code-learning | /claude-code-learning | Pending | #28379 |
| mobile-app | /mobile-app | Pending | #28379 |
| desktop-app | /desktop-app | Pending | #28379 |
| bkit-rules | /bkit-rules | Pending | #28379 |

### 2.2 Phase Skills (9, auto-invoked)

Phase skills는 pipeline에 의해 자동 호출되며, RC에서는 pipeline이 직접 호출되므로 phase skills의 RC 호환성은 pipeline skill에 의존합니다.

### 2.3 Agents (16)

Agent는 Task tool을 통해 호출되며, RC에서 Task tool이 지원되면 agent도 자동으로 호환됩니다. 현재 RC에서 Task tool 지원 여부는 미확인입니다.

---

## 3. 준비 사항 (#28379 해결 시)

1. 모든 12 user-invocable skills의 RC 실행 테스트
2. Hook system (SessionStart, PostToolUse 등)의 RC 환경 동작 확인
3. AskUserQuestion tool의 RC UI 렌더링 확인
4. agent-memory의 RC 세션 간 지속성 확인
5. Output Styles의 RC 적용 여부 확인

---

## 4. Timeline

- **현재**: #28379 Open, RC에서 slash commands 미지원
- **예상 해결**: CC v2.2.x 이후 (2026 Q1~Q2)
- **bkit 대응**: #28379 해결 확인 후 별도 PDCA 피처로 진행
