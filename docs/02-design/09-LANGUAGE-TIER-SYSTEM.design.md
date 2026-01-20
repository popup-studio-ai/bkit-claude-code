# Language & Framework Tier System - Detailed Design Document

> **Version**: 1.0
> **Created**: 2026-01-20
> **Author**: Claude Code Analysis
> **Status**: Ready for Implementation
> **Related Plan**: [09-LANGUAGE-TIER-SYSTEM-PLAN.md](../01-plan/09-LANGUAGE-TIER-SYSTEM-PLAN.md)

---

## 1. Design Overview

### 1.1 Objective

bkit 플러그인에 **체계적인 언어/프레임워크 Tier 시스템**을 도입하여:

1. AI-Native 개발 및 Vibe Coding 트렌드 반영
2. 명확한 선정 기준으로 언어/프레임워크 분류
3. Level(Starter/Dynamic/Enterprise)과 Tier의 연계
4. 사용자에게 적절한 기술 스택 가이드 제공

### 1.2 Tier Definition (Approved)

```
┌─────────────────────────────────────────────────────────────────────┐
│  Tier 1: AI-Native 필수                                             │
│  ─────────────────────────────────────────────────────────────────  │
│  Languages: Python, TypeScript, JavaScript                          │
│  Frameworks: React/Next.js, Svelte/SvelteKit                        │
│  Characteristics: AI 도구 생태계 완비, Vibe Coding 최적화            │
├─────────────────────────────────────────────────────────────────────┤
│  Tier 2: 주류 권장                                                  │
│  ─────────────────────────────────────────────────────────────────  │
│  Languages: Go, Rust, Dart                                          │
│  Frameworks: Vue/Nuxt, Astro, React Native, Flutter, Tauri          │
│  Characteristics: 특정 도메인 강점, AI 도구 지원 양호                │
├─────────────────────────────────────────────────────────────────────┤
│  Tier 3: 도메인 특화                                                │
│  ─────────────────────────────────────────────────────────────────  │
│  Languages: Java, Kotlin, Swift, C, C++                             │
│  Frameworks: Angular, Electron, Native iOS/Android                   │
│  Characteristics: 플랫폼 필수, AI 도구 지원 보통                     │
├─────────────────────────────────────────────────────────────────────┤
│  Tier 4: 레거시/니치                                                │
│  ─────────────────────────────────────────────────────────────────  │
│  Languages: PHP, Ruby, C#, Scala, Elixir                            │
│  Characteristics: 유지보수 목적, 신규 프로젝트 비권장                │
├─────────────────────────────────────────────────────────────────────┤
│  Experimental: 향후 검토                                            │
│  ─────────────────────────────────────────────────────────────────  │
│  Languages: Mojo, Zig, V                                            │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.3 Extension Mapping (Approved)

| Tier | Extensions |
|------|------------|
| **Tier 1** | `.py`, `.pyx`, `.pyi`, `.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`, `.cjs` |
| **Tier 2** | `.go`, `.rs`, `.dart`, `.astro`, `.vue`, `.svelte`, `.mdx` |
| **Tier 3** | `.java`, `.kt`, `.kts`, `.swift`, `.c`, `.cpp`, `.cc`, `.h`, `.hpp`, `.sh`, `.bash` |
| **Tier 4** | `.php`, `.rb`, `.erb`, `.cs`, `.scala`, `.ex`, `.exs` |
| **Experimental** | `.mojo`, `.zig`, `.v` |

---

## 2. Phase 1: Core Implementation (lib/common.sh)

### 2.1 Current State Analysis

**File**: `lib/common.sh`
**Current Lines**: 385

**Current Functions**:
- `is_code_file()` (Lines 88-136): 20+ 확장자 체크, Tier 구분 없음
- `is_ui_file()` (Lines 141-149): UI 컴포넌트 감지
- `is_source_file()` (Lines 58-82): 제외 패턴 + 확장자 기반

### 2.2 Changes Required

#### 2.2.1 Add Tier Constants (After Line 51)

```bash
# ============================================================
# Language Tier System (v1.2.1)
# ============================================================

# Tier 1: AI-Native Essential
# - AI tool ecosystem complete (Copilot, Claude, Cursor)
# - Optimized for Vibe Coding
# - Top market share + abundant training data
TIER_1_EXTENSIONS="py pyx pyi ts tsx js jsx mjs cjs"

# Tier 2: Mainstream Recommended
# - Strong in specific domains (mobile, system, cloud)
# - Good AI tool support
# - Growing or stable market share
TIER_2_EXTENSIONS="go rs dart astro vue svelte mdx"

# Tier 3: Domain Specific
# - Platform essential (iOS, Android, Enterprise)
# - Moderate AI tool support
TIER_3_EXTENSIONS="java kt kts swift c cpp cc h hpp sh bash"

# Tier 4: Legacy/Niche
# - Maintenance purpose
# - Limited AI tool support
# - Not recommended for new projects
TIER_4_EXTENSIONS="php rb erb cs scala ex exs"

# Experimental: Future Consideration
TIER_EXPERIMENTAL_EXTENSIONS="mojo zig v"

# All supported extensions (union of all tiers)
ALL_CODE_EXTENSIONS="$TIER_1_EXTENSIONS $TIER_2_EXTENSIONS $TIER_3_EXTENSIONS $TIER_4_EXTENSIONS $TIER_EXPERIMENTAL_EXTENSIONS"
```

#### 2.2.2 Add Tier Detection Function (After Line 149)

```bash
# ============================================================
# Tier Detection Functions
# ============================================================

# Get language tier for a file
# Usage: get_language_tier "/path/to/file.ts"
# Output: "1" | "2" | "3" | "4" | "experimental" | "unknown"
get_language_tier() {
    local file_path="$1"
    local ext="${file_path##*.}"

    # Check each tier
    for e in $TIER_1_EXTENSIONS; do
        [[ "$ext" == "$e" ]] && echo "1" && return 0
    done

    for e in $TIER_2_EXTENSIONS; do
        [[ "$ext" == "$e" ]] && echo "2" && return 0
    done

    for e in $TIER_3_EXTENSIONS; do
        [[ "$ext" == "$e" ]] && echo "3" && return 0
    done

    for e in $TIER_4_EXTENSIONS; do
        [[ "$ext" == "$e" ]] && echo "4" && return 0
    done

    for e in $TIER_EXPERIMENTAL_EXTENSIONS; do
        [[ "$ext" == "$e" ]] && echo "experimental" && return 0
    done

    echo "unknown"
}

# Get tier description
# Usage: get_tier_description "1"
# Output: "AI-Native Essential"
get_tier_description() {
    local tier="$1"

    case "$tier" in
        1) echo "AI-Native Essential" ;;
        2) echo "Mainstream Recommended" ;;
        3) echo "Domain Specific" ;;
        4) echo "Legacy/Niche" ;;
        experimental) echo "Experimental" ;;
        *) echo "Unknown" ;;
    esac
}

# Get PDCA recommendation based on tier
# Usage: get_tier_pdca_guidance "1"
get_tier_pdca_guidance() {
    local tier="$1"

    case "$tier" in
        1)
            echo "Tier 1 (AI-Native): Full PDCA support. Vibe coding optimized."
            ;;
        2)
            echo "Tier 2 (Mainstream): PDCA recommended. Good AI tool compatibility."
            ;;
        3)
            echo "Tier 3 (Domain): PDCA supported. Platform-specific considerations apply."
            ;;
        4)
            echo "Tier 4 (Legacy): Basic PDCA. Consider migration to Tier 1-2."
            ;;
        experimental)
            echo "Experimental: Limited PDCA support. Use with caution."
            ;;
        *)
            echo ""
            ;;
    esac
}

# Check if extension is in a specific tier
# Usage: is_tier_1 "/path/to/file.ts"
is_tier_1() {
    [[ "$(get_language_tier "$1")" == "1" ]]
}

is_tier_2() {
    [[ "$(get_language_tier "$1")" == "2" ]]
}

is_tier_3() {
    [[ "$(get_language_tier "$1")" == "3" ]]
}

is_tier_4() {
    [[ "$(get_language_tier "$1")" == "4" ]]
}
```

#### 2.2.3 Refactor is_code_file() (Replace Lines 88-136)

```bash
# Check if path is a code file by extension
# Enhanced with Tier-based multi-language support (v1.2.1)
# Usage: is_code_file "/path/to/file.ts"
# Returns: 0 (true) or 1 (false)
is_code_file() {
    local file_path="$1"
    local ext="${file_path##*.}"

    # Check against all supported extensions
    for e in $ALL_CODE_EXTENSIONS; do
        [[ "$ext" == "$e" ]] && return 0
    done

    return 1
}
```

#### 2.2.4 Update is_ui_file() (Replace Lines 141-149)

```bash
# Check if path is a UI component file
# Supports: React, Vue, Svelte, Astro (v1.2.1)
# Usage: is_ui_file "/path/to/Component.tsx"
# Returns: 0 (true) or 1 (false)
is_ui_file() {
    local file_path="$1"

    # UI component extensions (framework-agnostic)
    [[ "$file_path" == *.tsx ]] || \
    [[ "$file_path" == *.jsx ]] || \
    [[ "$file_path" == *.vue ]] || \
    [[ "$file_path" == *.svelte ]] || \
    [[ "$file_path" == *.astro ]]
}
```

### 2.3 Implementation Summary

| Change | Lines | Type | Description |
|--------|-------|------|-------------|
| Tier Constants | After 51 | Add | 6 tier extension variables |
| `get_language_tier()` | After 149 | Add | Tier detection function |
| `get_tier_description()` | After 149 | Add | Tier name helper |
| `get_tier_pdca_guidance()` | After 149 | Add | PDCA guidance by tier |
| `is_tier_N()` helpers | After 149 | Add | 4 tier check functions |
| `is_code_file()` | 88-136 | Replace | Tier-based refactor |
| `is_ui_file()` | 141-149 | Replace | Add .astro support |

**Estimated Lines Added**: +80 lines
**Estimated Lines Modified**: 60 lines

---

## 3. Phase 2: Documentation Update (bkit-system/)

### 3.1 _GRAPH-INDEX.md

**File**: `bkit-system/_GRAPH-INDEX.md`
**Current Version Note**: v1.2.1

#### Changes Required (After Line 147)

```markdown
### Language Tier System (v1.2.1)

bkit supports languages and frameworks organized by tier:

| Tier | Category | Languages/Frameworks |
|------|----------|---------------------|
| **Tier 1** | AI-Native Essential | Python, TypeScript, JavaScript, React/Next.js, Svelte |
| **Tier 2** | Mainstream Recommended | Go, Rust, Dart, Vue, Astro, Flutter, Tauri |
| **Tier 3** | Domain Specific | Java, Kotlin, Swift, C/C++, Angular, Electron |
| **Tier 4** | Legacy/Niche | PHP, Ruby, C#, Scala, Elixir |

**Tier Selection Criteria**:
- AI tool ecosystem compatibility
- Vibe Coding optimization
- Market share and growth potential
- Training data availability
```

#### Update Version Note (Line 7)

```markdown
> **v1.2.1 Language Tier System**: Tier-based language classification for AI-Native development
```

### 3.2 components/scripts/_scripts-overview.md

**File**: `bkit-system/components/scripts/_scripts-overview.md`
**Current Version**: v1.2.1

#### Replace Supported Languages Table (Lines 140-157)

```markdown
### Supported Languages by Tier (v1.2.1)

#### Tier 1: AI-Native Essential
| Language | Extensions | AI Compatibility |
|----------|------------|------------------|
| Python | `.py`, `.pyx`, `.pyi` | ⭐⭐⭐ Full |
| TypeScript | `.ts`, `.tsx` | ⭐⭐⭐ Full |
| JavaScript | `.js`, `.jsx`, `.mjs`, `.cjs` | ⭐⭐⭐ Full |

#### Tier 2: Mainstream Recommended
| Language/Framework | Extensions | AI Compatibility |
|--------------------|------------|------------------|
| Go | `.go` | ⭐⭐ Good |
| Rust | `.rs` | ⭐⭐ Good |
| Dart/Flutter | `.dart` | ⭐⭐ Good |
| Vue | `.vue` | ⭐⭐ Good |
| Svelte | `.svelte` | ⭐⭐ Good |
| Astro | `.astro` | ⭐⭐ Good |
| MDX | `.mdx` | ⭐⭐ Good |

#### Tier 3: Domain Specific
| Language | Extensions | AI Compatibility |
|----------|------------|------------------|
| Java | `.java` | ⭐ Moderate |
| Kotlin | `.kt`, `.kts` | ⭐ Moderate |
| Swift | `.swift` | ⭐ Moderate |
| C/C++ | `.c`, `.cpp`, `.cc`, `.h`, `.hpp` | ⭐ Moderate |
| Shell | `.sh`, `.bash` | ⭐ Moderate |

#### Tier 4: Legacy/Niche
| Language | Extensions | AI Compatibility |
|----------|------------|------------------|
| PHP | `.php` | Limited |
| Ruby | `.rb`, `.erb` | Limited |
| C# | `.cs` | Limited |
| Scala | `.scala` | Limited |
| Elixir | `.ex`, `.exs` | Limited |

#### Experimental
| Language | Extensions | Status |
|----------|------------|--------|
| Mojo | `.mojo` | Monitoring |
| Zig | `.zig` | Monitoring |
| V | `.v` | Monitoring |
```

### 3.3 testing/test-checklist.md

**File**: `bkit-system/testing/test-checklist.md`

#### Add Tier System Tests (After existing multi-language tests)

```markdown
### 1.1.2 Language Tier Detection (v1.2.1)

| # | 테스트 케이스 | 예상 결과 | Pass |
|---|-------------|----------|------|
| 1.1.12 | get_language_tier "test.py" | "1" (Tier 1) | [ ] |
| 1.1.13 | get_language_tier "test.ts" | "1" (Tier 1) | [ ] |
| 1.1.14 | get_language_tier "test.go" | "2" (Tier 2) | [ ] |
| 1.1.15 | get_language_tier "test.dart" | "2" (Tier 2) | [ ] |
| 1.1.16 | get_language_tier "test.astro" | "2" (Tier 2) | [ ] |
| 1.1.17 | get_language_tier "test.java" | "3" (Tier 3) | [ ] |
| 1.1.18 | get_language_tier "test.php" | "4" (Tier 4) | [ ] |
| 1.1.19 | get_language_tier "test.mojo" | "experimental" | [ ] |
| 1.1.20 | get_language_tier "test.unknown" | "unknown" | [ ] |

### 1.1.3 New Extension Support (v1.2.1)

| # | 테스트 케이스 | 예상 결과 | Pass |
|---|-------------|----------|------|
| 1.1.21 | is_code_file "app.dart" | true (Flutter) | [ ] |
| 1.1.22 | is_code_file "page.astro" | true (Astro) | [ ] |
| 1.1.23 | is_code_file "doc.mdx" | true (MDX) | [ ] |
| 1.1.24 | is_code_file "ai.mojo" | true (Mojo) | [ ] |
| 1.1.25 | is_code_file "sys.zig" | true (Zig) | [ ] |
| 1.1.26 | is_ui_file "Hero.astro" | true (Astro UI) | [ ] |
```

---

## 4. Phase 3: Skills Update

### 4.1 skills/starter/SKILL.md

**Current State**: HTML/CSS/JS와 Next.js 두 가지 옵션 제시

#### Add Tier Guidance (After Line 30, Tech Stack section)

```markdown
### Language Tier Guidance

> **Recommended**: Tier 1 languages only (Python, TypeScript, JavaScript)
>
> Starter level focuses on AI-Native development with maximum AI tool support.

| Tier | Allowed | Reason |
|------|---------|--------|
| Tier 1 | ✅ Yes | Full AI support, Vibe Coding optimized |
| Tier 2 | ⚠️ Limited | Consider Dynamic level instead |
| Tier 3-4 | ❌ No | Upgrade to Dynamic/Enterprise |
```

### 4.2 skills/dynamic/SKILL.md

**Current State**: TypeScript + bkend.ai 스택

#### Add Tier Guidance (After Line 30)

```markdown
### Language Tier Guidance

> **Recommended**: Tier 1-2 languages
>
> Dynamic level supports full-stack development with strong AI compatibility.

| Tier | Allowed | Reason |
|------|---------|--------|
| Tier 1 | ✅ Primary | Full AI support |
| Tier 2 | ✅ Yes | Mobile (Flutter/RN), Modern web (Vue, Astro) |
| Tier 3 | ⚠️ Limited | Platform-specific needs only |
| Tier 4 | ❌ No | Migration recommended |

**Mobile Development**:
- React Native (Tier 1 via TypeScript) - Recommended
- Flutter (Tier 2 via Dart) - Supported
```

### 4.3 skills/enterprise/SKILL.md

**Current State**: Python FastAPI + TypeScript + Infrastructure

#### Add Tier Guidance (After Line 30)

```markdown
### Language Tier Guidance

> **Supported**: All Tiers
>
> Enterprise level handles complex requirements including legacy system integration.

| Tier | Usage | Guidance |
|------|-------|----------|
| Tier 1 | Primary services | New development, core features |
| Tier 2 | System/Cloud | Go (K8s), Rust (performance critical) |
| Tier 3 | Platform native | iOS (Swift), Android (Kotlin), legacy Java |
| Tier 4 | Legacy integration | Migration plan required |

**Migration Path**:
- PHP → TypeScript (Next.js API routes)
- Ruby → Python (FastAPI)
- Java → Kotlin or Go
```

### 4.4 skills/mobile-app/SKILL.md

**Current State**: Expo, React Native CLI, Flutter 세 옵션

#### Update Framework Selection (Lines 33-54)

```markdown
### Framework Selection by Tier

| Framework | Tier | Recommendation | Use Case |
|-----------|------|----------------|----------|
| **React Native (Expo)** | Tier 1 | ⭐ Primary | TypeScript ecosystem, AI tools |
| **React Native CLI** | Tier 1 | Recommended | Native module needs |
| **Flutter** | Tier 2 | Supported | Multi-platform (6 OS), performance |

> **AI-Native Recommendation**: React Native with TypeScript
> - Full Copilot/Claude support
> - Extensive npm ecosystem
> - 20:1 developer availability vs Dart

> **Performance Recommendation**: Flutter
> - Impeller rendering engine
> - Single codebase for 6 platforms
> - Smaller bundles
```

### 4.5 skills/desktop-app/SKILL.md

**Current State**: Electron과 Tauri 두 옵션

#### Update Framework Selection (Lines 33-53)

```markdown
### Framework Selection by Tier

| Framework | Tier | Recommendation | Use Case |
|-----------|------|----------------|----------|
| **Tauri** | Tier 2 | ⭐ Primary | Lightweight (3MB), Rust security |
| **Electron** | Tier 3 | Supported | Mature ecosystem, VS Code-like apps |

> **AI-Native Recommendation**: Tauri
> - 35% YoY growth
> - 20-40MB memory vs Electron's 200-400MB
> - Mobile support (iOS/Android) via Tauri 2.0
> - Rust backend = memory safety

> **Ecosystem Recommendation**: Electron
> - Mature tooling
> - Node.js integration
> - Proven at scale (VS Code, Slack)
```

---

## 5. Phase 4: Templates Update

### 5.1 templates/CLAUDE.template.md

**Current State**: Generic placeholders ({{LANGUAGE}}, {{FRAMEWORK}})

#### Add Tier Section (After Line 38)

```markdown
| Tier | {{TIER}} |

### Language Tier Context

{{#if TIER_1}}
> **Tier 1 (AI-Native Essential)**
> - Full AI tool support (Copilot, Claude, Cursor)
> - Vibe Coding optimized
> - PDCA automation fully supported
{{/if}}

{{#if TIER_2}}
> **Tier 2 (Mainstream Recommended)**
> - Good AI tool compatibility
> - Domain-specific strengths
> - PDCA recommended
{{/if}}

{{#if TIER_3}}
> **Tier 3 (Domain Specific)**
> - Platform-specific requirements
> - Moderate AI support
> - Consider migration path for new features
{{/if}}

{{#if TIER_4}}
> **Tier 4 (Legacy/Niche)**
> - Maintenance mode
> - Migration plan recommended
> - New features should use Tier 1-2
{{/if}}
```

#### Add Tier-specific Commands (Lines 42-57)

```markdown
## Development Workflow

### Commands (Tier-aware)

{{#if PYTHON}}
```bash
# Type check
mypy {{SOURCE_DIR}}

# Test
pytest

# Lint
ruff check .

# Format
ruff format .
```
{{/if}}

{{#if TYPESCRIPT}}
```bash
# Type check
{{TYPECHECK_COMMAND}}

# Test
{{TEST_COMMAND}}

# Lint
{{LINT_COMMAND}}

# Build
{{BUILD_COMMAND}}
```
{{/if}}

{{#if GO}}
```bash
# Build
go build ./...

# Test
go test ./...

# Lint
golangci-lint run
```
{{/if}}

{{#if RUST}}
```bash
# Build
cargo build

# Test
cargo test

# Lint
cargo clippy

# Format
cargo fmt
```
{{/if}}

{{#if DART}}
```bash
# Analyze
dart analyze

# Test
flutter test

# Build
flutter build
```
{{/if}}
```

### 5.2 New Template: CLAUDE-tier-guide.template.md

**New File**: `templates/CLAUDE-tier-guide.template.md`

```markdown
# Language Tier Quick Reference

## Your Project Tier: {{TIER}}

### Tier 1: AI-Native Essential (Python, TypeScript, JavaScript)
{{#if TIER_1}}✅ **Current**{{else}}{{/if}}
- Full PDCA automation
- Vibe Coding optimized
- Maximum AI tool support

### Tier 2: Mainstream Recommended (Go, Rust, Dart, Vue, Svelte, Astro)
{{#if TIER_2}}✅ **Current**{{else}}{{/if}}
- Good PDCA support
- Domain-specific strengths
- Growing AI compatibility

### Tier 3: Domain Specific (Java, Kotlin, Swift, C/C++)
{{#if TIER_3}}⚠️ **Current** - Consider Tier 1-2 for new features{{else}}{{/if}}
- Platform requirements
- Moderate AI support
- Migration path available

### Tier 4: Legacy/Niche (PHP, Ruby, C#, Scala, Elixir)
{{#if TIER_4}}⚠️ **Current** - Migration recommended{{else}}{{/if}}
- Maintenance mode
- Limited AI support
- Upgrade to Tier 1-2 when possible

## Recommended Migration Paths

| From | To | Method |
|------|-----|--------|
| PHP | TypeScript | Next.js API routes |
| Ruby | Python | FastAPI |
| Java | Kotlin/Go | Gradual service migration |
| Objective-C | Swift | Apple migration guide |
```

---

## 6. Phase 5: Main Documentation Update

### 6.1 docs/02-BKIT-PLUGIN-DESIGN.md

**Current State**: Multi-language 전략이 섹션 8에 간략히 언급

#### Add New Section 9: Language Tier System

```markdown
## 9. Language Tier System (v1.2.1)

### 9.1 Overview

bkit은 AI-Native 개발 및 Vibe Coding 트렌드를 반영한 4단계 Tier 시스템을 사용합니다.

### 9.2 Tier Definitions

| Tier | Category | Languages | Frameworks |
|------|----------|-----------|------------|
| 1 | AI-Native Essential | Python, TypeScript, JavaScript | React, Next.js, Svelte |
| 2 | Mainstream Recommended | Go, Rust, Dart | Vue, Astro, Flutter, Tauri |
| 3 | Domain Specific | Java, Kotlin, Swift, C/C++ | Angular, Electron |
| 4 | Legacy/Niche | PHP, Ruby, C#, Scala, Elixir | - |

### 9.3 Selection Criteria

각 Tier는 다음 기준으로 선정되었습니다:

1. **AI Tool Ecosystem**: Copilot, Claude, Cursor 등 지원 수준
2. **Vibe Coding Optimization**: 자연어 → 코드 생성 효율성
3. **Market Share**: IEEE Spectrum 2025, Stack Overflow 2025 기준
4. **Training Data**: LLM 훈련 데이터 풍부도
5. **Growth Potential**: 채용 시장, 커뮤니티 성장세

### 9.4 Level × Tier Matrix

| Level | Primary Tier | Secondary Tier | Notes |
|-------|--------------|----------------|-------|
| Starter | Tier 1 | - | AI-Native 집중 |
| Dynamic | Tier 1 | Tier 2 | 풀스택 + 모바일 |
| Enterprise | Tier 1-2 | Tier 3-4 | 레거시 통합 포함 |

### 9.5 Implementation

Tier 감지는 `lib/common.sh`의 `get_language_tier()` 함수로 수행:

```bash
tier=$(get_language_tier "$file_path")
case "$tier" in
    1) echo "Full PDCA support" ;;
    2) echo "PDCA recommended" ;;
    3) echo "Platform-specific PDCA" ;;
    4) echo "Migration recommended" ;;
esac
```

### 9.6 References

- [IEEE Spectrum Top Programming Languages 2025](https://spectrum.ieee.org/top-programming-languages-2025)
- [The New Stack - AI Engineering Trends 2025](https://thenewstack.io/ai-engineering-trends-in-2025-agents-mcp-and-vibe-coding/)
- [2025 JavaScript Rising Stars](https://risingstars.js.org/2025/en)
```

### 6.2 docs/03-BKIT-FEATURES.md

**Current State**: 기능 목록에 언어 지원이 산재

#### Add Language Support Section

```markdown
## 8. Language & Framework Support (v1.2.1)

### 8.1 Tier System

bkit은 4단계 Tier 시스템으로 언어/프레임워크를 분류합니다:

| Tier | Focus | Extensions |
|------|-------|------------|
| **Tier 1** | AI-Native | `.py`, `.ts`, `.tsx`, `.js`, `.jsx` |
| **Tier 2** | Mainstream | `.go`, `.rs`, `.dart`, `.vue`, `.svelte`, `.astro` |
| **Tier 3** | Domain | `.java`, `.kt`, `.swift`, `.c`, `.cpp` |
| **Tier 4** | Legacy | `.php`, `.rb`, `.cs`, `.scala` |

### 8.2 Full Extension List

**Total: 30+ extensions supported**

| Category | Extensions |
|----------|------------|
| Web Frontend | `.ts`, `.tsx`, `.js`, `.jsx`, `.vue`, `.svelte`, `.astro`, `.mdx` |
| Backend | `.py`, `.go`, `.rs`, `.java`, `.kt`, `.rb`, `.php` |
| Mobile | `.dart`, `.swift`, `.kt` |
| System | `.c`, `.cpp`, `.rs`, `.zig` |
| Shell | `.sh`, `.bash` |
| Config | `.json`, `.yaml`, `.toml` (excluded from source) |

### 8.3 Framework Detection

| Framework | Detection Method | Tier |
|-----------|-----------------|------|
| Next.js | `next.config.*`, `app/`, `pages/` | Tier 1 |
| React | `.tsx`, `.jsx` files | Tier 1 |
| Vue | `.vue` files, `nuxt.config.*` | Tier 2 |
| Svelte | `.svelte` files, `svelte.config.*` | Tier 2 |
| Astro | `.astro` files, `astro.config.*` | Tier 2 |
| Flutter | `.dart` files, `pubspec.yaml` | Tier 2 |
| Tauri | `tauri.conf.json` | Tier 2 |
| Electron | `electron` in package.json | Tier 3 |
```

---

## 7. Implementation Checklist

### Phase 1: lib/common.sh
- [ ] Add Tier Constants (6 variables)
- [ ] Add `get_language_tier()` function
- [ ] Add `get_tier_description()` function
- [ ] Add `get_tier_pdca_guidance()` function
- [ ] Add `is_tier_N()` helper functions (4)
- [ ] Refactor `is_code_file()` to use tier constants
- [ ] Update `is_ui_file()` to include `.astro`
- [ ] Test all new functions

### Phase 2: bkit-system/
- [ ] Update `_GRAPH-INDEX.md` version and tier section
- [ ] Replace language table in `_scripts-overview.md`
- [ ] Add tier tests to `test-checklist.md`

### Phase 3: skills/
- [ ] Add tier guidance to `starter/SKILL.md`
- [ ] Add tier guidance to `dynamic/SKILL.md`
- [ ] Add tier guidance to `enterprise/SKILL.md`
- [ ] Update `mobile-app/SKILL.md` framework selection
- [ ] Update `desktop-app/SKILL.md` framework selection

### Phase 4: templates/
- [ ] Add tier section to `CLAUDE.template.md`
- [ ] Add tier-specific commands
- [ ] Create `CLAUDE-tier-guide.template.md`

### Phase 5: docs/
- [ ] Add Section 9 to `02-BKIT-PLUGIN-DESIGN.md`
- [ ] Add Section 8 to `03-BKIT-FEATURES.md`

---

## 8. Verification

### 8.1 Unit Tests

```bash
# Test Tier detection
echo "Testing get_language_tier..."
source lib/common.sh

# Tier 1
[[ $(get_language_tier "test.py") == "1" ]] && echo "✓ Python" || echo "✗ Python"
[[ $(get_language_tier "test.ts") == "1" ]] && echo "✓ TypeScript" || echo "✗ TypeScript"

# Tier 2
[[ $(get_language_tier "test.go") == "2" ]] && echo "✓ Go" || echo "✗ Go"
[[ $(get_language_tier "test.dart") == "2" ]] && echo "✓ Dart" || echo "✗ Dart"
[[ $(get_language_tier "test.astro") == "2" ]] && echo "✓ Astro" || echo "✗ Astro"

# Tier 3
[[ $(get_language_tier "test.java") == "3" ]] && echo "✓ Java" || echo "✗ Java"

# Tier 4
[[ $(get_language_tier "test.php") == "4" ]] && echo "✓ PHP" || echo "✗ PHP"

# Experimental
[[ $(get_language_tier "test.mojo") == "experimental" ]] && echo "✓ Mojo" || echo "✗ Mojo"

# New extensions
[[ $(is_code_file "test.dart") ]] && echo "✓ .dart supported" || echo "✗ .dart"
[[ $(is_code_file "test.astro") ]] && echo "✓ .astro supported" || echo "✗ .astro"
[[ $(is_code_file "test.mdx") ]] && echo "✓ .mdx supported" || echo "✗ .mdx"
[[ $(is_ui_file "Hero.astro") ]] && echo "✓ .astro is UI" || echo "✗ .astro UI"
```

### 8.2 Integration Test

PreToolUse hook에서 Tier 정보가 올바르게 전달되는지 확인:

```bash
# Test pre-write.sh with different file types
echo '{"tool_input":{"file_path":"src/app.py","content":"test"}}' | scripts/pre-write.sh
# Expected: Tier 1 guidance in additionalContext

echo '{"tool_input":{"file_path":"src/main.dart","content":"test"}}' | scripts/pre-write.sh
# Expected: Tier 2 guidance in additionalContext
```

---

## 9. Rollback Plan

### If Phase 1 Fails

```bash
# Revert lib/common.sh
git checkout HEAD~1 -- lib/common.sh
```

### If Later Phases Fail

Phase 1 (lib/common.sh)은 backward compatible하므로 유지.
문서/스킬 변경만 롤백:

```bash
git checkout HEAD~1 -- bkit-system/ skills/ templates/ docs/
```

---

## 10. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-20 | Initial design document |

---

## Related Documents

- Plan: [09-LANGUAGE-TIER-SYSTEM-PLAN.md](../01-plan/09-LANGUAGE-TIER-SYSTEM-PLAN.md)
- Previous: [07-PATH-PORTABILITY-FIX.design.md](./07-PATH-PORTABILITY-FIX.design.md)
