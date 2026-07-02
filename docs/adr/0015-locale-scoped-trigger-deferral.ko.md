# ADR 0015 — Locale-Scoped Trigger Generation Deferral (로케일 한정 트리거 생성 유예)

> **Status**: Accepted (2026-07-02)
> **Issue**: [#129](https://github.com/popup-studio-ai/bkit-claude-code/issues/129) (proposal 1)
> **Context**: 32개 에이전트 frontmatter description의 8개 언어 트리거 키워드 목록
> **Supersedes/relates**: ADR 0014 (issue-response 동기 문서); v2.1.25 #129 대응 — compact 8-language trigger encoding (proposal 2, 출시됨); `test/regression/issue-129-description-budget.test.js`.

---

## 1. Context

Issue #129는 bkit의 8개 언어 트리거 키워드 목록이 매 세션 상시 상주 프롬프트 비용을 발생시킴을 확인하고 두 가지 완화안을 제시했다. Proposal 1:

> "At install/setup time (or via a /control option), write agent files whose triggers include only the detected locale + English"

즉, 8개 언어 트리거 세트 중 감지된 로케일 + 영어 2개만 담은 에이전트 파일을 사용자별로 생성하여, 나머지 6개 언어 키워드를 프롬프트 표면에서 완전히 제거하자는 제안이다.

v2.1.25는 그 대신 **proposal 2**를 출시했다 — compact trigger encoding: 32개 에이전트의 frontmatter description을 **30,065 B → 16,919 B (−44%)** 로 압축 (추가로 `skills/sprint/SKILL.md` 1,074 B → 550 B), 템플릿은 "EN 전체 + KO 전체 목록 + JA/ZH/ES/FR/DE/IT 각 1개 anchor 키워드". Proposal 1의 유예는 v2.1.25 CHANGELOG 항목에서 사전 공지되었다 ("to be documented in a follow-up ADR" — 본 문서).

## 2. Decision

**로케일 한정 트리거 생성(issue #129 proposal 1)을 유예(DEFER)한다. Claude Code의 현행 플러그인 모델에서는 구현 불가능하다.**

- **CC 플러그인은 불변(immutable) 버전 고정 marketplace checkout이다.** 설치된 플러그인은 `~/.claude/plugins/cache/<marketplace>/<plugin>/<version>/` 에 특정 릴리스 버전의 읽기 전용 사본으로 존재한다. Claude Code는 bkit이 사용자 로케일을 감지해 로케일 한정 에이전트 파일을 쓸 수 있는 **install-time / setup-time 파일 생성 훅을 제공하지 않는다**.
- **로케일별 에이전트 파일은 git 기반 업데이트와 contract collection을 깨뜨린다.** 설치 후 에이전트 `.md` 파일을 재작성하면 설치 트리가 릴리스 태그에서 벗어나고(marketplace update/refresh 의미론 파괴), bkit의 invocation-contract baseline은 `agents/` 에서 수집되므로 변조된 표면은 L1/L4 gate가 판정할 수 없는 사용자별 contract drift를 만든다.
- **유예는 라우팅에 영향을 주지 않는다.** bkit 자체의 8개 언어 intent 매칭은 `lib/intent/language.js` 레지스트리(`SUPPORTED_LANGUAGES` = 8개 언어 + `AGENT_TRIGGER_PATTERNS`)에 존재하며, 에이전트 frontmatter description에 있지 **않다**. description 트리거 목록을 줄이든(proposal 2) 로케일 전체를 유지하든 bkit 측 라우팅에는 효과가 없고, CC 네이티브의 description 기반 에이전트 노출만 영향을 받는다.

## 3. Consequences

**긍정**
- 거짓 약속 없음: 호스트 플랫폼이 지원할 수 없는 메커니즘을 출시하지 않고, 그 제약과 원인을 본 문서에 기록한다.
- 라우팅 동작은 `lib/intent/language.js` 레지스트리를 통해 8개 언어 전부에 대해 변경 없이 완전히 보존된다.
- 이미 실현된 완화(proposal 2, −44%)가 사용자별 파일 변조 없이 토큰 절감의 대부분을 달성했다.

**부정 / 한계**
- 비 EN/KO 사용자(JA/ZH/ES/FR/DE/IT)는 CC 가시 description에 언어당 anchor 키워드 1개만 유지 — 가상의 로케일 한정 빌드 대비 네이티브 description 발견성이 낮다.
- 약 16.9 KB의 description 트리거가 매 세션 상주 상태로 남는다.

**재검토 트리거**: Claude Code가 install/setup 훅(파일을 생성할 수 있는 plugin lifecycle 이벤트) 또는 로케일별 manifest 지원을 도입하는 경우. 어느 쪽이든 핵심 blocker가 해소되어 proposal 1이 재개된다.

## 4. Verification / Citations

- `test/unit/v200-skills.test.js:96-122` — VS-011~015: SKILL.md 기준 EN + KO 트리거 존재는 **필수 lock** (compact 템플릿의 "EN 전체 + KO 전체" 하한선).
- `test/regression/issue-129-description-budget.test.js` — 달성된 완화의 lock: 에이전트 description당 ≤700 B, `Triggers:` 블록 존재, 총합 ≤20,000 B.
- `lib/intent/language.js:10` — `SUPPORTED_LANGUAGES` 8개 언어 레지스트리 (description과 독립적인 라우팅 SoT).
- 설치 플러그인 불변성: `~/.claude/plugins/cache/<marketplace>/<plugin>/<version>/` 버전 고정 checkout 레이아웃 (예: `bkit-marketplace/bkit/2.1.25/`).

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-07-02 | 최초 ADR (issue #129 proposal 1 유예, v2.1.26 provisional) | kay |
