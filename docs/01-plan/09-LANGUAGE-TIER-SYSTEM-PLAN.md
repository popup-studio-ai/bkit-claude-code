# Language & Framework Tier System Plan

> **Version**: 1.0
> **Created**: 2026-01-20
> **Author**: Claude Code Analysis
> **Status**: Proposal
> **Related**: 07-PATH-PORTABILITY-FIX-PLAN.md (Multi-Language Support)

---

## 1. Executive Summary

### 1.1 문제 인식

현재 bkit의 언어/프레임워크 지원은 **체계적 기준 없이** 구현되었습니다:

```
현재 상태: "흔히 쓰이는 언어" 수준의 ad-hoc 나열
- 선정 근거 없음
- AI-Native/Vibe Coding 트렌드 미반영
- 시장 점유율/성장 가능성 미고려
```

### 1.2 제안

**Tier 기반 언어/프레임워크 분류 시스템** 도입:

- 명확한 선정 기준 수립
- AI-Native 개발 및 Vibe Coding 친화도 반영
- 시장 점유율, 성장 가능성, 채용 시장 고려
- bkit 전체 컴포넌트에 일관되게 적용

---

## 2. Research Findings

### 2.1 조사 출처

| Source | Date | Focus |
|--------|------|-------|
| [IEEE Spectrum Top Programming Languages 2025](https://spectrum.ieee.org/top-programming-languages-2025) | Aug 2025 | 언어 순위 |
| [The New Stack - AI Engineering Trends](https://thenewstack.io/ai-engineering-trends-in-2025-agents-mcp-and-vibe-coding/) | Dec 2025 | Vibe Coding |
| [2025 JavaScript Rising Stars](https://risingstars.js.org/2025/en) | Jan 2026 | JS 생태계 |
| [Flutter vs React Native 2026](https://www.techaheadcorp.com/blog/flutter-vs-react-native-in-2026-the-ultimate-showdown-for-app-development-dominance/) | Jan 2026 | 모바일 |
| [Tauri vs Electron 2025](https://codeology.co.nz/articles/tauri-vs-electron-2025-desktop-development.html) | 2025 | 데스크탑 |

### 2.2 AI-Native & Vibe Coding 트렌드

#### Vibe Coding의 부상

> "Andrej Karpathy가 2025년 2월 'vibe coding' 용어를 만들었다. 자연어로 소프트웨어를 설명하면 AI가 코드를 작성, 수정, 디버깅하는 접근 방식."
> — The New Stack

**핵심 통계:**
- Stack Overflow 2025: 개발자 65%가 AI 도구를 주 1회 이상 사용
- Sonar 조사: 개발자 72%가 AI 도구를 매일 사용, 커밋 코드의 42%가 AI 기여
- Gartner 예측: 2026년 말까지 기업 애플리케이션 40%가 AI 에이전트 탑재

#### AI 친화적 언어/프레임워크 특성

| 특성 | 설명 | 예시 |
|------|------|------|
| **단순한 문법** | AI가 생성하기 쉬움 | Python, Svelte |
| **타입 안전성** | AI 오류 감소 | TypeScript, Rust |
| **풍부한 학습 데이터** | LLM 훈련 데이터 충분 | Python, JavaScript |
| **명확한 컨벤션** | 일관된 코드 생성 | Go (gofmt), Rust |

### 2.3 프로그래밍 언어 현황 (2025-2026)

#### IEEE Spectrum 2025 순위

| Rank | Language | 특징 | AI 친화도 |
|------|----------|------|----------|
| 1 | **Python** | AI/ML 사실상 표준 | ⭐⭐⭐ |
| 2 | **Java** | 엔터프라이즈 | ⭐⭐ |
| 3 | **C++** | 시스템/게임 | ⭐ |
| 4 | **C** | 임베디드 | ⭐ |
| 5 | **TypeScript** | 웹 대세 | ⭐⭐⭐ |
| 6 | **JavaScript** | Vibe Coding으로 하락 (3→6위) | ⭐⭐⭐ |
| 7 | **Rust** | 13→7위 급상승, 72% 지지율 | ⭐⭐ |
| 7 | **Go** | 클라우드 네이티브 표준 | ⭐⭐ |

#### 신흥 언어

| Language | 특징 | 성장 가능성 |
|----------|------|-----------|
| **Mojo** | Python 호환 + 고성능 AI | 높음 |
| **Zig** | C 대체, 시스템 프로그래밍 | 중간 |
| **V** | 단순성 + 성능 | 실험적 |

### 2.4 프론트엔드 프레임워크 현황

| Framework | 점유율/지지율 | 트렌드 | AI 친화도 |
|-----------|-------------|--------|----------|
| **React/Next.js** | 44.7% | 사실상 표준, v0 생태계 | ⭐⭐⭐ |
| **Vue** | 기업 채택 45%↑ | Vue 3.6 + Vapor Mode | ⭐⭐ |
| **Svelte** | 62.4% 만족도 (1위) | 180% 성장 | ⭐⭐⭐ |
| **Astro** | 급부상 | 프레임워크 믹스 | ⭐⭐⭐ |

> "Remix가 AI-first로 재설계 중—추상화를 단순화해 AI 코드 생성기가 더 잘 작동하도록"

### 2.5 모바일 앱 현황

| Framework | 시장 점유율 | 강점 | 약점 |
|-----------|-----------|------|------|
| **Flutter** | 46% | 6개 OS, Impeller 렌더링 | Dart 인력 20:1 열세 |
| **React Native** | 35% | JS 생태계, AI 도구 호환 | 성능 (개선 중) |

> "Flutter가 기술적으로 앞서지만, React Native가 채용과 AI 도구 호환성에서 우위"

### 2.6 데스크탑 앱 현황

| Framework | 앱 크기 | 메모리 | 트렌드 |
|-----------|--------|--------|--------|
| **Electron** | 80-120MB | 200-400MB | 성숙, VS Code/Slack |
| **Tauri** | 2.5-3MB | 20-40MB | 35%↑, Rust 기반, 모바일 지원 |

---

## 3. Proposed Tier System

### 3.1 Tier 정의

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Tier 1: AI-Native 필수                          │
│  • AI 도구 생태계 완비 (Copilot, Claude, Cursor 등)                  │
│  • Vibe Coding에 최적화                                              │
│  • 시장 점유율 상위 + 풍부한 학습 데이터                              │
├─────────────────────────────────────────────────────────────────────┤
│                     Tier 2: 주류 권장                                │
│  • 특정 도메인에서 강점 (모바일, 시스템, 클라우드)                     │
│  • AI 도구 지원 양호                                                 │
│  • 성장 중이거나 안정적 점유율                                        │
├─────────────────────────────────────────────────────────────────────┤
│                     Tier 3: 도메인 특화                              │
│  • 특정 플랫폼/도메인에서 필수 (iOS, Android, 엔터프라이즈)           │
│  • AI 도구 지원 보통                                                 │
├─────────────────────────────────────────────────────────────────────┤
│                     Tier 4: 레거시/니치                              │
│  • 유지보수 목적                                                     │
│  • AI 도구 지원 제한적                                               │
│  • 신규 프로젝트 비권장                                              │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 언어 분류

| Tier | Languages | 선정 근거 |
|------|-----------|----------|
| **Tier 1** | Python, TypeScript, JavaScript | AI 필수, Vibe Coding 주력 |
| **Tier 2** | Go, Rust, Dart | 클라우드/시스템/모바일 강자 |
| **Tier 3** | Java, Kotlin, Swift, C, C++ | 플랫폼 특화 (Android, iOS, 시스템) |
| **Tier 4** | PHP, Ruby, C#, Scala, Elixir | 레거시/니치 |

### 3.3 프레임워크 분류

#### 웹 프론트엔드

| Tier | Frameworks | 선정 근거 |
|------|------------|----------|
| **Tier 1** | React/Next.js, Svelte/SvelteKit | AI 생태계, 만족도 |
| **Tier 2** | Vue/Nuxt, Astro | 안정적, 급부상 |
| **Tier 3** | Angular | 엔터프라이즈 |
| **Tier 4** | jQuery, Backbone | 레거시 |

#### 모바일

| Tier | Frameworks | 선정 근거 |
|------|------------|----------|
| **Tier 1** | React Native | JS 생태계, AI 호환 |
| **Tier 2** | Flutter | 기술 우위, 멀티플랫폼 |
| **Tier 3** | Native (Swift/Kotlin) | 최적 성능 필요 시 |

#### 데스크탑

| Tier | Frameworks | 선정 근거 |
|------|------------|----------|
| **Tier 1** | Tauri | 경량, Rust, 미래 지향 |
| **Tier 2** | Electron | 성숙 생태계 |

### 3.4 파일 확장자 매핑

#### 현재 지원 (lib/common.sh)

```bash
# 현재 is_code_file()에 포함된 확장자
.ts, .tsx, .js, .jsx, .mjs, .cjs  # JS/TS
.py, .pyx, .pyi                    # Python
.go                                # Go
.rs                                # Rust
.java, .kt, .kts                   # Java/Kotlin
.rb, .erb                          # Ruby
.php                               # PHP
.swift                             # Swift
.c, .cpp, .cc, .h, .hpp            # C/C++
.cs                                # C#
.scala                             # Scala
.ex, .exs                          # Elixir
.sh, .bash                         # Shell
.vue, .svelte                      # Vue/Svelte
```

#### 추가 필요

| Extension | Language/Framework | Tier | 우선순위 |
|-----------|-------------------|------|---------|
| `.dart` | Dart/Flutter | Tier 2 | **High** |
| `.astro` | Astro | Tier 2 | **High** |
| `.mdx` | MDX | Tier 2 | Medium |
| `.mojo` | Mojo | Tier 2 | Low (신흥) |
| `.zig` | Zig | Tier 3 | Low (신흥) |

---

## 4. Implementation Scope

### 4.1 변경 필요 컴포넌트

```
┌─────────────────────────────────────────────────────────────────────┐
│                        변경 범위                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. lib/common.sh                                                   │
│     ├── is_code_file() - 확장자 추가 (.dart, .astro, .mdx)          │
│     ├── TIER_DEFINITIONS - Tier 정의 상수 추가                      │
│     └── get_language_tier() - Tier 조회 함수 추가                   │
│                                                                     │
│  2. bkit-system/ 문서                                               │
│     ├── _GRAPH-INDEX.md - Tier 시스템 섹션 추가                     │
│     ├── components/scripts/_scripts-overview.md - Tier 테이블       │
│     └── testing/test-checklist.md - Tier별 테스트 케이스            │
│                                                                     │
│  3. skills/                                                         │
│     ├── starter/SKILL.md - Tier 1 언어 권장                         │
│     ├── dynamic/SKILL.md - Tier 1-2 언어 권장                       │
│     ├── enterprise/SKILL.md - 전체 Tier 지원                        │
│     ├── mobile-app/SKILL.md - 모바일 Tier 반영                      │
│     └── desktop-app/SKILL.md - 데스크탑 Tier 반영                   │
│                                                                     │
│  4. templates/                                                      │
│     ├── CLAUDE.template.md - Tier 기반 기술 스택 권장               │
│     └── pipeline/phase-*.template.md - Tier 반영                    │
│                                                                     │
│  5. docs/                                                           │
│     ├── 02-BKIT-PLUGIN-DESIGN.md - Tier 시스템 문서화               │
│     └── 03-BKIT-FEATURES.md - 지원 언어/프레임워크 목록             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 Phase별 구현 계획

#### Phase 1: Core Implementation (lib/common.sh)

**목표**: Tier 시스템 핵심 로직 구현

```bash
# lib/common.sh 추가 내용

# Tier Definitions
TIER_1_EXTENSIONS="ts tsx js jsx mjs cjs py"
TIER_2_EXTENSIONS="go rs dart astro vue svelte"
TIER_3_EXTENSIONS="java kt kts swift c cpp cc h hpp"
TIER_4_EXTENSIONS="php rb erb cs scala ex exs"

# Get tier for a file
get_language_tier() {
    local file_path="$1"
    local ext="${file_path##*.}"

    [[ " $TIER_1_EXTENSIONS " == *" $ext "* ]] && echo "1" && return
    [[ " $TIER_2_EXTENSIONS " == *" $ext "* ]] && echo "2" && return
    [[ " $TIER_3_EXTENSIONS " == *" $ext "* ]] && echo "3" && return
    [[ " $TIER_4_EXTENSIONS " == *" $ext "* ]] && echo "4" && return
    echo "0"  # Unknown
}

# is_code_file() 확장자 추가
.dart, .astro, .mdx
```

**파일**: `lib/common.sh`
**예상 변경량**: +30 lines

#### Phase 2: Documentation Update (bkit-system/)

**목표**: Tier 시스템 문서화

| File | Changes |
|------|---------|
| `_GRAPH-INDEX.md` | Tier 시스템 섹션 추가 |
| `components/scripts/_scripts-overview.md` | Supported Languages 테이블을 Tier 기반으로 재구성 |
| `testing/test-checklist.md` | Tier별 테스트 케이스 추가 |

**예상 변경량**: 3 files, +100 lines

#### Phase 3: Skills Update

**목표**: Level별 스킬에 Tier 권장사항 반영

| Skill | Changes |
|-------|---------|
| `starter/SKILL.md` | "Tier 1 언어 권장: Python, TypeScript" |
| `dynamic/SKILL.md` | "Tier 1-2 지원, Flutter/React Native 가이드" |
| `enterprise/SKILL.md` | "전체 Tier 지원, 마이그레이션 가이드" |
| `mobile-app/SKILL.md` | 모바일 Tier (React Native > Flutter) 반영 |
| `desktop-app/SKILL.md` | 데스크탑 Tier (Tauri > Electron) 반영 |

**예상 변경량**: 5 files, +50 lines

#### Phase 4: Templates Update

**목표**: 템플릿에 Tier 기반 권장사항 반영

| Template | Changes |
|----------|---------|
| `CLAUDE.template.md` | 기술 스택 선택 가이드에 Tier 반영 |
| `pipeline/phase-*.template.md` | 각 Phase별 Tier 권장사항 |

**예상 변경량**: 10+ files, +100 lines

#### Phase 5: Main Documentation

**목표**: 공식 문서에 Tier 시스템 반영

| Document | Changes |
|----------|---------|
| `docs/02-BKIT-PLUGIN-DESIGN.md` | 섹션 추가: "4. Language & Framework Tier System" |
| `docs/03-BKIT-FEATURES.md` | 지원 언어/프레임워크 목록을 Tier 기반으로 재구성 |

**예상 변경량**: 2 files, +150 lines

---

## 5. Success Criteria

### 5.1 기능적 요구사항

| ID | Requirement | Verification |
|----|-------------|--------------|
| F1 | `.dart`, `.astro`, `.mdx` 파일 감지 | `is_code_file()` 테스트 |
| F2 | `get_language_tier()` 함수 동작 | 단위 테스트 |
| F3 | Tier별 PDCA 가이드 차별화 | 통합 테스트 |

### 5.2 문서 요구사항

| ID | Requirement | Verification |
|----|-------------|--------------|
| D1 | 모든 Tier 정의 문서화 | bkit-system/ 확인 |
| D2 | 선정 근거 명시 | docs/ 확인 |
| D3 | 사용자 가이드 제공 | CLAUDE.template.md 확인 |

---

## 6. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Tier 분류 논쟁 | Medium | 객관적 데이터(IEEE, Stack Overflow) 기반 |
| 확장자 충돌 | Low | 명확한 우선순위 규칙 |
| 유지보수 부담 | Medium | 연 1회 Tier 재검토 프로세스 |
| 신흥 언어 누락 | Low | Tier 4에 실험적 카테고리 유지 |

---

## 7. Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Core | 1 hour | None |
| Phase 2: bkit-system docs | 1 hour | Phase 1 |
| Phase 3: Skills | 30 min | Phase 1 |
| Phase 4: Templates | 1 hour | Phase 1 |
| Phase 5: Main docs | 1 hour | Phase 1-4 |
| **Total** | **~4.5 hours** | |

---

## 8. Decision Required

### 8.1 Tier 분류 승인

제안된 Tier 분류가 적절한지 검토 필요:

- [ ] Tier 1: Python, TypeScript, JavaScript
- [ ] Tier 2: Go, Rust, Dart + React/Next.js, Svelte, Vue, Astro, React Native, Flutter, Tauri
- [ ] Tier 3: Java, Kotlin, Swift, C, C++, Electron
- [ ] Tier 4: PHP, Ruby, C#, Scala, Elixir

### 8.2 추가 확장자 승인

- [ ] `.dart` (Flutter) 추가
- [ ] `.astro` (Astro) 추가
- [ ] `.mdx` (MDX) 추가
- [ ] `.mojo` (Mojo) 추가 - 실험적
- [ ] `.zig` (Zig) 추가 - 실험적

### 8.3 구현 진행 승인

- [ ] Phase 1-5 전체 구현 승인
- [ ] 부분 구현 (Phase 1-2만)
- [ ] 보류 (추가 검토 필요)

---

## 9. References

### 9.1 조사 자료

- [IEEE Spectrum Top Programming Languages 2025](https://spectrum.ieee.org/top-programming-languages-2025)
- [The New Stack - AI Engineering Trends 2025](https://thenewstack.io/ai-engineering-trends-in-2025-agents-mcp-and-vibe-coding/)
- [2025 JavaScript Rising Stars](https://risingstars.js.org/2025/en)
- [Flutter vs React Native 2026 - TechAhead](https://www.techaheadcorp.com/blog/flutter-vs-react-native-in-2026-the-ultimate-showdown-for-app-development-dominance/)
- [Tauri vs Electron 2025 - Codeology](https://codeology.co.nz/articles/tauri-vs-electron-2025-desktop-development.html)
- [LogRocket - 8 Trends Web Dev 2026](https://blog.logrocket.com/8-trends-web-dev-2026/)

### 9.2 관련 문서

- [07-PATH-PORTABILITY-FIX-PLAN.md](./07-PATH-PORTABILITY-FIX-PLAN.md) - Multi-Language Support 구현
- [docs/02-design/07-PATH-PORTABILITY-FIX.design.md](../02-design/07-PATH-PORTABILITY-FIX.design.md) - 상세 설계

---

## Appendix A: Full Extension Mapping

```
Tier 1 (AI-Native 필수)
├── .py, .pyx, .pyi          # Python
├── .ts, .tsx                # TypeScript
├── .js, .jsx, .mjs, .cjs    # JavaScript
└── (implicit: React, Next.js, Svelte via .tsx/.svelte)

Tier 2 (주류 권장)
├── .go                      # Go
├── .rs                      # Rust
├── .dart                    # Dart/Flutter [NEW]
├── .astro                   # Astro [NEW]
├── .vue                     # Vue
├── .svelte                  # Svelte
└── .mdx                     # MDX [NEW]

Tier 3 (도메인 특화)
├── .java                    # Java
├── .kt, .kts                # Kotlin
├── .swift                   # Swift
├── .c, .cpp, .cc, .h, .hpp  # C/C++
└── .sh, .bash               # Shell

Tier 4 (레거시/니치)
├── .php                     # PHP
├── .rb, .erb                # Ruby
├── .cs                      # C#
├── .scala                   # Scala
└── .ex, .exs                # Elixir

Experimental (향후 검토)
├── .mojo                    # Mojo
├── .zig                     # Zig
└── .v                       # V
```
