---
name: phase-5-design-system
description: |
  Skill for building platform-independent design systems.
  Develops consistent component libraries for all UI frameworks.

  Triggers: design system, component library, design tokens, shadcn, 디자인 시스템, デザインシステム, 设计系统
agent: pipeline-guide
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Bash
user-invocable: false
---

# Phase 5: 디자인 시스템

> 플랫폼 독립적 디자인 시스템 구축

## 목적

재사용 가능한 UI 컴포넌트 라이브러리를 구축합니다. 일관된 디자인과 빠른 개발을 가능하게 합니다.

---

## 디자인 시스템이란?

### 정의

디자인 시스템은 **재사용 가능한 컴포넌트와 명확한 표준의 집합**으로, 일관된 사용자 경험을 대규모로 구축할 수 있게 합니다.

### 왜 필요한가? (프레임워크 무관)

| 문제 | 디자인 시스템의 해결 |
|------|---------------------|
| 디자이너-개발자 간 불일치 | 단일 진실 공급원 (Single Source of Truth) |
| 중복 컴포넌트 개발 | 재사용 가능한 컴포넌트 라이브러리 |
| 일관성 없는 UI/UX | 통일된 디자인 토큰과 규칙 |
| 유지보수 비용 증가 | 중앙화된 변경 관리 |
| 신규 팀원 온보딩 지연 | 문서화된 컴포넌트 카탈로그 |

### 디자인 시스템의 3계층

```
┌─────────────────────────────────────────────────────┐
│              Design Tokens (디자인 토큰)              │
│   Color, Typography, Spacing, Radius, Shadow, ...   │
├─────────────────────────────────────────────────────┤
│              Core Components (기본 컴포넌트)          │
│   Button, Input, Card, Dialog, Avatar, Badge, ...   │
├─────────────────────────────────────────────────────┤
│            Composite Components (복합 컴포넌트)       │
│   Form, DataTable, Navigation, SearchBar, ...       │
└─────────────────────────────────────────────────────┘
```

### 플랫폼별 구현 도구

| 플랫폼 | 권장 도구 | 디자인 토큰 방식 |
|--------|----------|-----------------|
| **Web (React/Next.js)** | shadcn/ui, Radix | CSS Variables |
| **Web (Vue)** | Vuetify, PrimeVue | CSS Variables |
| **Flutter** | Material 3, Custom Theme | ThemeData |
| **iOS (SwiftUI)** | Native Components | Asset Catalog, Color Set |
| **Android (Compose)** | Material 3 | MaterialTheme |
| **React Native** | NativeBase, Tamagui | StyleSheet + Theme |

---

## 이 Phase에서 하는 것

1. **기본 컴포넌트 설치**: Button, Input, Card 등
2. **커스터마이징**: 프로젝트 스타일에 맞게 조정
3. **복합 컴포넌트**: 여러 기본 컴포넌트 조합
4. **문서화**: 컴포넌트 사용법 정리

## 산출물

```
components/
└── ui/                     # shadcn/ui 컴포넌트
    ├── button.tsx
    ├── input.tsx
    ├── card.tsx
    └── ...

lib/
└── utils.ts                # 유틸리티 (cn 함수 등)

docs/02-design/
└── design-system.md        # 디자인 시스템 명세
```

## PDCA 적용

- **Plan**: 필요 컴포넌트 목록
- **Design**: 컴포넌트 구조, 변형(variants) 설계
- **Do**: 컴포넌트 구현/커스터마이징
- **Check**: 일관성 검토
- **Act**: 확정 후 Phase 6로

## 레벨별 적용

| 레벨 | 적용 방식 |
|------|----------|
| Starter | 선택적 (간단한 프로젝트는 생략 가능) |
| Dynamic | 필수 |
| Enterprise | 필수 (디자인 토큰 포함) |

## shadcn/ui 설치

```bash
# 초기 설정
npx shadcn@latest init

# 컴포넌트 추가
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add card
```

## 필수 컴포넌트 목록

### 기본
- Button, Input, Textarea
- Card, Badge, Avatar
- Dialog, Sheet, Popover

### 폼
- Form, Label, Select
- Checkbox, Radio, Switch

### 네비게이션
- Navigation Menu, Tabs
- Breadcrumb, Pagination

## Custom Theme 구축

### 디자인 토큰 오버라이드

shadcn/ui는 CSS 변수 기반이므로 `globals.css`에서 테마를 커스터마이징합니다.

```css
/* globals.css */
@layer base {
  :root {
    /* ===== Colors ===== */
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;      /* 브랜드 메인 컬러 */
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --accent: 210 40% 96.1%;
    --destructive: 0 84.2% 60.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;

    /* ===== Typography ===== */
    --font-sans: 'Pretendard', sans-serif;
    --font-mono: 'JetBrains Mono', monospace;

    /* ===== Spacing (rem 단위) ===== */
    --spacing-xs: 0.25rem;   /* 4px */
    --spacing-sm: 0.5rem;    /* 8px */
    --spacing-md: 1rem;      /* 16px */
    --spacing-lg: 1.5rem;    /* 24px */
    --spacing-xl: 2rem;      /* 32px */

    /* ===== Border Radius ===== */
    --radius: 0.5rem;
    --radius-sm: 0.25rem;
    --radius-lg: 0.75rem;
    --radius-full: 9999px;

    /* ===== Shadows ===== */
    --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    /* ... dark mode overrides */
  }
}
```

### Tailwind 설정 확장

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          50: 'hsl(var(--brand-50))',
          500: 'hsl(var(--brand-500))',
          900: 'hsl(var(--brand-900))',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      spacing: {
        'xs': 'var(--spacing-xs)',
        'sm': 'var(--spacing-sm)',
        'md': 'var(--spacing-md)',
        'lg': 'var(--spacing-lg)',
        'xl': 'var(--spacing-xl)',
      },
      borderRadius: {
        'sm': 'var(--radius-sm)',
        'DEFAULT': 'var(--radius)',
        'lg': 'var(--radius-lg)',
        'full': 'var(--radius-full)',
      },
    },
  },
}
```

### 디자인 토큰 문서화

프로젝트별로 `docs/02-design/design-tokens.md` 생성 권장:

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--primary` | `221.2 83.2% 53.3%` | 브랜드 메인 컬러 |
| `--radius` | `0.5rem` | 기본 border-radius |
| `--font-sans` | `Pretendard` | 본문 폰트 |

## 컴포넌트 커스터마이징

```tsx
// 프로젝트 스타일에 맞게 기본 버튼 확장
const Button = React.forwardRef<
  HTMLButtonElement,
  ButtonProps & { isLoading?: boolean }
>(({ isLoading, children, ...props }, ref) => {
  return (
    <ButtonPrimitive ref={ref} {...props}>
      {isLoading ? <Spinner /> : children}
    </ButtonPrimitive>
  );
});
```

---

## 모바일 앱 디자인 시스템

### Flutter: Custom Theme 구축

Flutter는 `ThemeData`를 통해 디자인 토큰을 정의합니다.

```dart
// lib/theme/app_theme.dart
import 'package:flutter/material.dart';

class AppTheme {
  // ===== Design Tokens =====

  // Colors
  static const Color primary = Color(0xFF3B82F6);
  static const Color secondary = Color(0xFF64748B);
  static const Color destructive = Color(0xFFEF4444);
  static const Color background = Color(0xFFFFFFFF);
  static const Color foreground = Color(0xFF0F172A);

  // Spacing
  static const double spacingXs = 4.0;
  static const double spacingSm = 8.0;
  static const double spacingMd = 16.0;
  static const double spacingLg = 24.0;
  static const double spacingXl = 32.0;

  // Border Radius
  static const double radiusSm = 4.0;
  static const double radiusMd = 8.0;
  static const double radiusLg = 12.0;
  static const double radiusFull = 9999.0;

  // ===== Theme Data =====

  static ThemeData get lightTheme => ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(
      seedColor: primary,
      brightness: Brightness.light,
    ),
    fontFamily: 'Pretendard',

    // Button Theme
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        padding: EdgeInsets.symmetric(
          horizontal: spacingMd,
          vertical: spacingSm,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(radiusMd),
        ),
      ),
    ),

    // Card Theme
    cardTheme: CardTheme(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(radiusLg),
      ),
    ),

    // Input Theme
    inputDecorationTheme: InputDecorationTheme(
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(radiusMd),
      ),
      contentPadding: EdgeInsets.all(spacingSm),
    ),
  );

  static ThemeData get darkTheme => ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(
      seedColor: primary,
      brightness: Brightness.dark,
    ),
    fontFamily: 'Pretendard',
    // ... dark theme overrides
  );
}
```

### Flutter: 재사용 컴포넌트

```dart
// lib/components/app_button.dart
import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

enum AppButtonVariant { primary, secondary, destructive, outline }

class AppButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final AppButtonVariant variant;
  final bool isLoading;

  const AppButton({
    required this.label,
    this.onPressed,
    this.variant = AppButtonVariant.primary,
    this.isLoading = false,
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: isLoading ? null : onPressed,
      style: _getStyle(),
      child: isLoading
          ? SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(strokeWidth: 2),
            )
          : Text(label),
    );
  }

  ButtonStyle _getStyle() {
    switch (variant) {
      case AppButtonVariant.destructive:
        return ElevatedButton.styleFrom(
          backgroundColor: AppTheme.destructive,
        );
      case AppButtonVariant.outline:
        return ElevatedButton.styleFrom(
          backgroundColor: Colors.transparent,
          side: BorderSide(color: AppTheme.primary),
        );
      default:
        return ElevatedButton.styleFrom();
    }
  }
}
```

### Flutter: 프로젝트 구조

```
lib/
├── theme/
│   ├── app_theme.dart          # ThemeData + Design Tokens
│   ├── app_colors.dart         # Color 상수
│   ├── app_typography.dart     # TextStyle 정의
│   └── app_spacing.dart        # Spacing 상수
├── components/
│   ├── app_button.dart
│   ├── app_input.dart
│   ├── app_card.dart
│   └── app_dialog.dart
└── main.dart
```

---

## 크로스 플랫폼 디자인 토큰 공유

### Design Token JSON (플랫폼 독립)

Figma Tokens 또는 Style Dictionary로 토큰을 중앙 관리합니다.

```json
// tokens/design-tokens.json
{
  "color": {
    "primary": { "value": "#3B82F6" },
    "secondary": { "value": "#64748B" },
    "destructive": { "value": "#EF4444" }
  },
  "spacing": {
    "xs": { "value": "4px" },
    "sm": { "value": "8px" },
    "md": { "value": "16px" },
    "lg": { "value": "24px" }
  },
  "radius": {
    "sm": { "value": "4px" },
    "md": { "value": "8px" },
    "lg": { "value": "12px" }
  },
  "font": {
    "family": { "value": "Pretendard" },
    "size": {
      "sm": { "value": "14px" },
      "md": { "value": "16px" },
      "lg": { "value": "18px" }
    }
  }
}
```

### 플랫폼별 변환

```bash
# Style Dictionary로 각 플랫폼용 토큰 생성
npx style-dictionary build

# 출력:
# - build/css/variables.css      (Web)
# - build/dart/app_tokens.dart   (Flutter)
# - build/swift/AppTokens.swift  (iOS)
# - build/kt/AppTokens.kt        (Android)
```

---

## 디자인 시스템 체크리스트 (플랫폼 무관)

### 필수 항목

- [ ] **Design Tokens 정의**
  - [ ] Colors (Primary, Secondary, Semantic)
  - [ ] Typography (Font Family, Sizes, Weights)
  - [ ] Spacing (xs, sm, md, lg, xl)
  - [ ] Border Radius
  - [ ] Shadows/Elevation

- [ ] **Core Components**
  - [ ] Button (variants: primary, secondary, outline, destructive)
  - [ ] Input/TextField
  - [ ] Card
  - [ ] Dialog/Modal
  - [ ] Avatar
  - [ ] Badge

- [ ] **Composite Components**
  - [ ] Form (with validation)
  - [ ] Navigation (Header, Sidebar, Bottom Nav)
  - [ ] Data Display (Table, List)

- [ ] **문서화**
  - [ ] 컴포넌트 카탈로그 (Storybook / Widgetbook)
  - [ ] 사용 가이드라인
  - [ ] Do's and Don'ts

---

## 템플릿

`templates/pipeline/phase-5-design-system.template.md` 참조

## 다음 Phase

Phase 6: UI 구현 + API 연동 → 컴포넌트가 준비됐으니 실제 화면 구현
