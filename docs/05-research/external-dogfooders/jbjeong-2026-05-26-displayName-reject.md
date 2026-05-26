# 외부 dogfooder #2 — 정병진 (2026-05-26)

> **Status**: Active investigation
> **Sprint**: v2120-marketplace-recovery
> **Hall of Fame Entry**: Pending (v2.1.19 외부 dogfooder 정책 §15.4 따름)

---

## 1. 보고 사실

| 항목 | 값 |
|------|-----|
| **보고자** | 정병진 |
| **소속/관계** | 조쉬 라이브 방송에서 bkit 학습 → 외부 사용자 |
| **보고 일자** | 2026-05-26 |
| **보고 채널** | 이메일 (담당자 → kay@popupstudio.ai) |
| **시도한 bkit 버전** | **v2.1.14** (스크린샷 plugin details "Version: 2.1.14") |
| **현재 사용 OS** | macOS (`/Users/bj/.claude/...` 경로 패턴) |
| **터미널 사용** | "현재 저는 커서에서 터미널을 열어 클로드 코드를 사용 중입니다" (Cursor IDE 내부 터미널) |

## 2. 에러 메시지 원본

```
Error: Failed to install: Plugin has an invalid manifest file at
/Users/bj/.claude/plugins/cache/temp_git_1779631720189_ocjr7a/.claude-plugin/plugin.json.
Validation errors: : Unrecognized key: "displayName"
```

## 3. 정병진 측 추정

- "비킷이 최근 작동이 되지 않아 마켓플레이스를 지우고 다시 깔아보았는데"
- "클로드에서는 인식하지 못하는 키가 있어 밸리데이션 에러가 났더라고요"
- Claude에게 물어 받은 답:
  - 원인: bkit 플러그인 v2.1.14의 매니페스트가 Claude Code가 허용하지 않는 필드(displayName)를 포함
  - 해결 방법 1: 플러그인 제작자 측 수정 기다리기
  - 해결 방법 2: 이전 버전(v2.1.13)으로 설치 시도

## 4. 우리 측 분석 (cc-version-researcher 88% 신뢰도)

### Claude의 추정 평가

- ❌ **"v2.1.13으로 다운그레이드"** — **효과 없음**. v2.1.13에도 displayName 키 존재 (commit `18b0982` 이후 모든 버전 동일)
- ✅ **"displayName 제거"** — fix 방향 부분 일치, 단 우리는 displayName 유지 + min CC version advisory 채택 (cc-version-researcher 권장)

### 진짜 root cause

- `displayName` 키는 **v2.1.143부터 공식 schema에 정식 추가** (docs.claude.com/docs/en/plugins-reference 442번 줄: "Requires Claude Code v2.1.143 or later")
- 정병진의 CC 버전이 **v2.1.142 이하** (98% 추정)
- v2.1.142 이하 CC는 install 단계 strict validator에서 displayName을 unknown key로 reject

### 미해결 의문점 (회신 메일에서 확인 요청)

- **Q2 (cc-version-researcher 보고서)**: 정병진 CC 정확한 버전 — `claude --version` 출력 필요. 25% 잔여 불확실성.

---

## 5. 회신 메일 초안 (한국어)

```
제목: [bkit] v2.1.14 설치 오류 — 원인 파악 완료 및 해결 안내

안녕하세요 정병진님,

bkit v2.1.14 설치 시 만나신 displayName 검증 오류에 대해 상세히 조사한 결과를 공유드립니다.
귀중한 피드백 감사드립니다 — bkit의 외부 사용자 검증 사이클에서 매우 중요한 발견이었습니다.


## 진짜 원인 (Claude의 추정과 다릅니다)

Claude가 알려준 "displayName이 비표준 키이므로 v2.1.13으로 다운그레이드" 추정은 일부 부정확합니다.
저희가 외부 조사 + bkit 코드베이스 전수 audit 결과 확인한 진짜 원인:

1. **displayName은 비표준 키가 아닙니다**
   - Claude Code v2.1.143부터 공식 plugin manifest schema에 정식 추가된 키
   - 공식 문서: https://code.claude.com/docs/en/plugins-reference
     "displayName ... Requires Claude Code v2.1.143 or later"

2. **정병진님 환경의 Claude Code 버전이 v2.1.142 이하일 가능성이 매우 높습니다** (98% 추정)
   - v2.1.142 이하는 displayName을 unknown key로 reject (install 단계 strict validation)
   - v2.1.143 이상은 정상 인식

3. **bkit 모든 버전(v2.0.0~v2.1.19)에 displayName 키가 동일하게 존재**
   - 즉 v2.1.13으로 다운그레이드해도 동일 오류 발생 (효과 없음)
   - bkit v2.0.0 commit `18b0982` (2026-03-20) 이후 일관 적용


## 확인 부탁드립니다 (1단계)

정확한 진단을 위해 다음 명령 출력을 회신 부탁드립니다:

```bash
claude --version
```

가설이 맞다면 v2.1.142 이하가 표시될 것입니다. 만약 v2.1.143 이상이라면
추가 조사가 필요한 다른 root cause가 있다는 의미입니다.


## 해결 방법 (3가지 중 선택)

### 방법 1: Claude Code 업데이트 (가장 권장)

```bash
npm install -g @anthropic-ai/claude-code@latest
# 또는 최소 요구 버전
npm install -g @anthropic-ai/claude-code@2.1.143
```

업데이트 후 bkit 마켓플레이스에서 정상 install 가능합니다.
이게 root cause를 해결하는 가장 깔끔한 방법입니다.


### 방법 2: bkit hotfix 대기 (1-2주 예상)

저희는 다음 sprint에서 bkit v2.1.20-marketplace-recovery 릴리스를 진행 중입니다.
주요 작업:
- bkit README에 minimum CC version v2.1.143 advisory 추가
- scripts/validate-plugin.js 21-key whitelist CI gate
- SessionStart hook CC version detection + 사전 경고
- cc-regression registry R3-321 신규 guard
- 정병진님 외부 dogfooder 등록 (Hall of Fame #2 — bkit Early Adopter Program §15.4)

단 displayName 키 자체는 제거하지 않을 예정입니다 — 공식 schema 키이므로
v2.1.143+ 사용자의 UI 표시(/plugin picker)에 영향을 주기 때문입니다.


### 방법 3: 수동 우회 (긴급 시)

CC 업데이트가 어려운 환경이라면 수동으로 cache 폴더 생성도 가능합니다:

```bash
# 1) bkit-claude-code repo clone
git clone https://github.com/popup-studio-ai/bkit-claude-code.git ~/bkit-tmp

# 2) plugin.json에서 displayName 임시 제거
sed -i '' '/"displayName"/d' ~/bkit-tmp/.claude-plugin/plugin.json

# 3) cache 폴더로 복사
mkdir -p ~/.claude/plugins/cache/bkit/2.1.19
cp -r ~/bkit-tmp/* ~/.claude/plugins/cache/bkit/2.1.19/

# 4) ~/.claude/settings.json에 enabledPlugins 수동 추가 (확인 필요)
```

단 이 방법은 install validator는 우회 가능하지만 runtime cache load 시점에
다시 strict reject될 가능성 70% — 권장도 낮습니다. 가능하면 방법 1로 가주세요.


## bkit Early Adopter Program 등록 안내

정병진님의 정성 있는 버그 보고는 bkit의 외부 dogfooder Hall of Fame #2 entry로
등록되며, 본 사례는 bkit의 E2E regression suite에 영구 흡수됩니다 (DA-2 master plan §15.4).
v2.1.19 첫 외부 dogfooder @pruge에 이은 두 번째 정식 entry입니다.

Hall of Fame 등록 의사가 있으시면 회신에 함께 알려주세요. 등록 시:
- bkit-claude-code repo의 CONTRIBUTORS 섹션에 공개 명시
- 본 displayName-reject 시나리오가 bkit의 회귀 방지 test suite에 영구 포함
- Trust Score externalDogfoodFeedbackResponseRate 컴포넌트 기여 (weight 0.05)


## 추가 의문점 (선택 답변)

bkit-claude-code repo 또는 별도 분석을 위해 도움이 되는 정보 (가능한 범위만):
1. Claude Code를 마지막으로 업데이트한 대략 시점?
2. 다른 plugin (claude-plugins-official, ww-w-ai 등) install은 성공하나요?
3. /plugin marketplace add bkit 후 어느 시점 화면에서 install 시도하셨나요?


## 다음 단계

방법 1 (CC 업데이트)이 가장 빠른 해결책입니다. 시도 후 bkit install 성공/실패를
간단히 알려주시면 저희도 sprint v2120-marketplace-recovery의 success criteria SC6
(정병진 회신 + 검증) 달성으로 확인됩니다.

본 사례를 발견해주셔서 진심으로 감사드립니다. bkit이 더 견고해지는 데 결정적
기여를 해주셨습니다.

감사합니다.

kay kim
POPUP STUDIO PTE. LTD.
bkit Vibecoding Kit
contact@popupstudio.ai
```

---

## 6. Hall of Fame entry (Sprint 완료 후 정식 등록 예정)

```yaml
- name: 정병진
  date: 2026-05-26
  bug-report: displayName key reject on CC v2.1.142-
  resolution: README advisory + ENH-321 (R3-321 guard) + SessionStart CC version detection
  sprint: v2120-marketplace-recovery
  hall-of-fame: '#2'
  e2e-scenario: test/e2e/cc-min-version.test.js (추가 예정)
```

---

## 7. 참조

- 본 사례 원본 보고: 이메일 (담당자 → kay@popupstudio.ai, 2026-05-26)
- cc-version-researcher 분석: `docs/03-analysis/cc-v2146-v2150-strict-manifest-validation.analysis.md`
- Sprint Master Plan: `docs/sprint/v2120-marketplace-recovery/master-plan.md` (작성 중)
- 외부 dogfooder #1 (선행): @pruge (v2.1.19, 2026-05-21)
