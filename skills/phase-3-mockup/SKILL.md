---
name: phase-3-mockup
description: |
  Skill for creating mockups with UI/UX trends without a designer.
  Designs HTML/CSS/JS prototypes that can be converted to Next.js components.

  Triggers: mockup, prototype, wireframe, UI design, 목업, モックアップ, 原型
agent: pipeline-guide
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - WebSearch
user-invocable: false
---

# Phase 3: 목업 개발

> 디자이너 없이도 트렌디한 UI 구현 + Next.js 컴포넌트화 고려

## 목적

실제 구현 전에 빠르게 아이디어를 검증합니다. **디자이너가 없더라도** UI/UX 트렌드를 조사하여 완성도 높은 프로토타입을 만들고, 이후 Next.js 컴포넌트로 쉽게 전환할 수 있도록 설계합니다.

## 이 Phase에서 하는 것

1. **화면 목업**: HTML/CSS로 UI 구현
2. **인터랙션**: 기본 JavaScript로 동작 구현
3. **데이터 시뮬레이션**: JSON 파일로 API 응답 모사
4. **기능 검증**: 사용자 흐름 테스트

## 산출물

```
mockup/
├── pages/          # HTML 페이지
│   ├── index.html
│   ├── login.html
│   └── ...
├── styles/         # CSS
│   └── main.css
├── scripts/        # JavaScript
│   └── app.js
└── data/           # JSON 목 데이터
    ├── users.json
    └── products.json

docs/02-design/
└── mockup-spec.md  # 목업 명세
```

## PDCA 적용

- **Plan**: 어떤 화면/기능을 목업할지
- **Design**: 화면 구조, 인터랙션 설계
- **Do**: HTML/CSS/JS 구현
- **Check**: 기능 동작 검증
- **Act**: 피드백 반영 후 Phase 4로

## 레벨별 적용

| 레벨 | 적용 방식 |
|------|----------|
| Starter | 이 단계가 최종 산출물일 수 있음 |
| Dynamic | 다음 단계 진행을 위한 검증용 |
| Enterprise | 빠른 PoC용 |

## 핵심 원칙

```
"완벽한 코드보다 동작하는 프로토타입"

- 프레임워크 없이 순수 HTML/CSS/JS
- API 대신 JSON 파일로 데이터 시뮬레이션
- 빠른 피드백 루프
- Next.js 컴포넌트화를 고려한 구조
```

---

## UI/UX 트렌드 조사 방법

### 디자이너 없이 트렌디한 UI 만들기

#### 1. 트렌드 리서치 소스

| 소스 | 용도 | URL |
|------|------|-----|
| **Dribbble** | UI 디자인 트렌드, 컬러 팔레트 | dribbble.com |
| **Behance** | 실제 프로젝트 케이스 스터디 | behance.net |
| **Awwwards** | 수상작 기반 최신 웹 트렌드 | awwwards.com |
| **Mobbin** | 모바일 앱 UI 패턴 | mobbin.com |
| **Godly** | 랜딩 페이지 레퍼런스 | godly.website |
| **Land-book** | 랜딩 페이지 갤러리 | land-book.com |

#### 2. 2024-2025 UI/UX 트렌드

```
🎨 비주얼 트렌드
├── Bento Grid Layout (벤토 박스 레이아웃)
├── Glassmorphism (유리 효과)
├── Gradient Mesh (메쉬 그라데이션)
├── 3D Elements (미니멀 3D 요소)
└── Micro-interactions (마이크로 인터랙션)

📱 UX 트렌드
├── Dark Mode First
├── Skeleton Loading
├── Progressive Disclosure
├── Thumb-friendly Mobile Design
└── Accessibility (WCAG 2.1)

🔤 타이포그래피
├── Variable Fonts
├── Large Hero Text
└── Mixed Font Weights
```

#### 3. 빠른 UI 구현 도구

| 도구 | 용도 |
|------|------|
| **v0.dev** | AI 기반 UI 생성 (shadcn/ui 호환) |
| **Tailwind UI** | 고품질 컴포넌트 템플릿 |
| **Heroicons** | 아이콘 |
| **Lucide** | 아이콘 (React 호환) |
| **Coolors** | 컬러 팔레트 생성 |
| **Realtime Colors** | 실시간 컬러 미리보기 |

#### 4. 목업 작성 전 체크리스트

```markdown
## UI 리서치 체크리스트

- [ ] 유사 서비스 3개 이상 분석
- [ ] 컬러 팔레트 결정 (Primary, Secondary, Accent)
- [ ] 타이포그래피 선정 (Heading, Body)
- [ ] 레이아웃 패턴 선택 (Grid, Bento, etc.)
- [ ] 참고 디자인 스크린샷 수집
```

---

## Next.js 컴포넌트화를 위한 설계

### 목업 → 컴포넌트 전환 전략

목업 단계에서부터 **컴포넌트 분리**를 고려하면 Next.js 전환이 쉬워집니다.

#### 1. HTML 구조를 컴포넌트 단위로 설계

```html
<!-- ❌ 나쁜 예: 모놀리식 HTML -->
<div class="page">
  <header>...</header>
  <main>
    <div class="hero">...</div>
    <div class="features">...</div>
  </main>
  <footer>...</footer>
</div>

<!-- ✅ 좋은 예: 컴포넌트 단위로 분리 -->
<!-- components/Header.html -->
<header data-component="Header">
  <nav data-component="Navigation">...</nav>
</header>

<!-- components/Hero.html -->
<section data-component="Hero">
  <h1 data-slot="title">...</h1>
  <p data-slot="description">...</p>
  <button data-component="Button" data-variant="primary">...</button>
</section>
```

#### 2. CSS를 컴포넌트별로 분리

```
mockup/
├── styles/
│   ├── base/
│   │   ├── reset.css
│   │   └── variables.css      # CSS 변수 (디자인 토큰)
│   ├── components/
│   │   ├── button.css
│   │   ├── card.css
│   │   ├── header.css
│   │   └── hero.css
│   └── pages/
│       └── home.css
```

#### 3. 컴포넌트 매핑 문서 작성

```markdown
## 컴포넌트 매핑 (mockup → Next.js)

| 목업 파일 | Next.js 컴포넌트 | Props |
|----------|-----------------|-------|
| `components/button.html` | `components/ui/Button.tsx` | variant, size, disabled |
| `components/card.html` | `components/ui/Card.tsx` | title, description, image |
| `components/header.html` | `components/layout/Header.tsx` | user, navigation |
```

#### 4. 데이터 구조를 Props로 설계

```javascript
// mockup/data/hero.json
{
  "title": "혁신적인 서비스",
  "description": "더 나은 경험을 제공합니다",
  "cta": {
    "label": "시작하기",
    "href": "/signup"
  },
  "image": "/hero-image.png"
}

// → Next.js 전환 시
// components/Hero.tsx
interface HeroProps {
  title: string;
  description: string;
  cta: {
    label: string;
    href: string;
  };
  image: string;
}
```

### Next.js 전환 예시

**목업 (HTML)**:
```html
<!-- mockup/components/feature-card.html -->
<div class="feature-card" data-component="FeatureCard">
  <div class="feature-card__icon">🚀</div>
  <h3 class="feature-card__title">빠른 속도</h3>
  <p class="feature-card__description">최적화된 성능을 제공합니다.</p>
</div>
```

**Next.js 컴포넌트**:
```tsx
// components/FeatureCard.tsx
interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="feature-card">
      <div className="feature-card__icon">{icon}</div>
      <h3 className="feature-card__title">{title}</h3>
      <p className="feature-card__description">{description}</p>
    </div>
  );
}
```

---

## JSON 데이터 시뮬레이션 예시

```javascript
// scripts/app.js
async function loadProducts() {
  const response = await fetch('./data/products.json');
  const products = await response.json();
  renderProducts(products);
}
```

### JSON 구조 → API 스키마로 활용

```json
// mockup/data/products.json
// 이 구조가 Phase 4 API 설계의 기초가 됩니다
{
  "data": [
    {
      "id": 1,
      "name": "상품명",
      "price": 10000,
      "image": "/products/1.jpg"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50
  }
}
```

---

## 산출물 체크리스트

- [ ] **UI 리서치**
  - [ ] 참고 디자인 수집 (최소 3개)
  - [ ] 컬러 팔레트 결정
  - [ ] 폰트 선정

- [ ] **목업 구현**
  - [ ] 컴포넌트 단위로 HTML 분리
  - [ ] CSS 변수로 디자인 토큰 정의
  - [ ] JSON으로 데이터 시뮬레이션

- [ ] **Next.js 전환 준비**
  - [ ] 컴포넌트 매핑 문서 작성
  - [ ] Props 인터페이스 정의
  - [ ] 재사용 가능한 구조 확인

---

## 템플릿

`templates/pipeline/phase-3-mockup.template.md` 참조

## 다음 Phase

Phase 4: API 설계/구현 → 목업이 검증됐으니 실제 백엔드 구현
