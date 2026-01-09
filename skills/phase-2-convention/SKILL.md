---
name: phase-2-convention
description: |
  Skill for defining coding rules and conventions.
  Ensures consistent code style and specifies coding standards for AI collaboration.

  Triggers: convention, coding style, naming rules, 컨벤션, コンベンション, 编码风格
agent: pipeline-guide
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
user-invocable: false
---

# Phase 2: 코딩 컨벤션

> 코드 작성 규칙 정의

## 목적

일관된 코드 스타일을 유지합니다. AI와 협업할 때 특히 중요 - AI가 어떤 스타일로 코드를 작성할지 명확히 합니다.

## 이 Phase에서 하는 것

1. **네이밍 규칙**: 변수, 함수, 파일, 폴더 이름
2. **코드 스타일**: 들여쓰기, 따옴표, 세미콜론 등
3. **구조 규칙**: 폴더 구조, 파일 분리 기준
4. **패턴 정의**: 자주 사용할 코드 패턴

## 산출물

```
프로젝트 루트/
├── CONVENTIONS.md          # 전체 컨벤션
└── docs/01-plan/
    ├── naming.md           # 네이밍 규칙
    └── structure.md        # 구조 규칙
```

## PDCA 적용

- **Plan**: 필요한 컨벤션 항목 파악
- **Design**: 규칙 상세 설계
- **Do**: 컨벤션 문서 작성
- **Check**: 일관성/실용성 검토
- **Act**: 확정 후 Phase 3로

## 레벨별 적용

| 레벨 | 적용 수준 |
|------|----------|
| Starter | 기본 (필수 규칙만) |
| Dynamic | 확장 (API, 상태관리 포함) |
| Enterprise | 확장 (서비스별 규칙) |

## 핵심 컨벤션 항목

### 네이밍
- 컴포넌트: PascalCase
- 함수: camelCase
- 상수: UPPER_SNAKE_CASE
- 파일: kebab-case 또는 PascalCase

### 폴더 구조
```
src/
├── components/     # 재사용 컴포넌트
├── features/       # 기능별 모듈
├── hooks/          # 커스텀 훅
├── utils/          # 유틸리티
└── types/          # 타입 정의
```

---

## 환경 변수 컨벤션

### 왜 설계 단계에서 정의해야 하는가?

```
❌ 배포 직전에 환경 변수 정리
   → 빠진 변수 발견, 네이밍 불일치, 배포 지연

✅ 설계 단계에서 컨벤션 확립
   → 일관된 네이밍, 명확한 분류, 빠른 배포
```

### 환경 변수 네이밍 규칙

| 접두사 | 용도 | 노출 범위 | 예시 |
|--------|------|----------|------|
| `NEXT_PUBLIC_` | 클라이언트 노출 가능 | 브라우저 | `NEXT_PUBLIC_API_URL` |
| `DB_` | 데이터베이스 | 서버만 | `DB_HOST`, `DB_PASSWORD` |
| `API_` | 외부 API 키 | 서버만 | `API_STRIPE_SECRET` |
| `AUTH_` | 인증 관련 | 서버만 | `AUTH_SECRET`, `AUTH_GOOGLE_ID` |
| `SMTP_` | 이메일 서비스 | 서버만 | `SMTP_HOST`, `SMTP_PASSWORD` |
| `STORAGE_` | 파일 저장소 | 서버만 | `STORAGE_S3_BUCKET` |

```
⚠️ 보안 원칙
- NEXT_PUBLIC_* 외에는 절대 클라이언트에 노출 금지
- API 키, 비밀번호는 반드시 서버 전용 변수로
- 민감 정보는 .env 파일에 커밋 금지
```

### .env 파일 구조

```
프로젝트 루트/
├── .env.example        # 템플릿 (Git에 포함, 값은 비워둠)
├── .env.local          # 로컬 개발용 (Git 무시)
├── .env.development    # 개발 환경 기본값
├── .env.staging        # 스테이징 환경 기본값
├── .env.production     # 프로덕션 기본값 (민감 정보 X)
└── .env.test           # 테스트 환경
```

### .env.example 템플릿

```bash
# .env.example - 이 파일은 Git에 포함됩니다
# 실제 값은 .env.local에 설정하세요

# ===== 앱 설정 =====
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ===== 데이터베이스 =====
DB_HOST=
DB_PORT=5432
DB_NAME=
DB_USER=
DB_PASSWORD=

# ===== 인증 =====
AUTH_SECRET=                    # openssl rand -base64 32
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=

# ===== 외부 서비스 =====
NEXT_PUBLIC_API_URL=
API_STRIPE_SECRET=
SMTP_HOST=
SMTP_USER=
SMTP_PASSWORD=
```

### 환경별 값 분류

| 변수 유형 | .env.example | .env.local | CI/CD Secrets |
|----------|:------------:|:----------:|:-------------:|
| 앱 URL | 템플릿 | 로컬 값 | 환경별 값 |
| API 엔드포인트 | 템플릿 | 로컬/개발 | 환경별 값 |
| DB 비밀번호 | 빈 값 | 로컬 값 | ✅ Secrets |
| API 키 | 빈 값 | 테스트 키 | ✅ Secrets |
| JWT Secret | 빈 값 | 로컬 값 | ✅ Secrets |

### 환경 변수 검증

```typescript
// lib/env.ts - 앱 시작 시 환경 변수 검증
import { z } from 'zod';

const envSchema = z.object({
  // 필수
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(32),

  // 선택 (기본값)
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),

  // 클라이언트 노출
  NEXT_PUBLIC_APP_URL: z.string().url(),
});

// 검증 및 타입 추론
export const env = envSchema.parse(process.env);

// 타입 안전한 사용
// env.DATABASE_URL  ← 자동완성 지원
```

### 환경 변수 체크리스트

- [ ] **네이밍 일관성**
  - [ ] 접두사 규칙 준수 (NEXT_PUBLIC_, DB_, API_ 등)
  - [ ] UPPER_SNAKE_CASE 사용

- [ ] **파일 구조**
  - [ ] .env.example 작성 (템플릿)
  - [ ] .gitignore에 .env.local 등록
  - [ ] 환경별 .env 파일 분리

- [ ] **보안**
  - [ ] 민감 정보 분류
  - [ ] 클라이언트 노출 변수 확인
  - [ ] Secrets 목록 정리 (Phase 9 배포 시 사용)

---

## 클린 아키텍처 원칙

### 왜 설계 단계에서 정의해야 하는가?

```
클린 아키텍처 = 변경에 강한 코드

❌ 아키텍처 없이 개발
   → 스파게티 코드, 수정할 때마다 여러 파일 변경

✅ 설계 단계에서 계층 정의
   → 관심사 분리, 테스트 용이, 유지보수 쉬움
```

### 4계층 아키텍처 (권장)

```
src/
├── presentation/        # 또는 app/, pages/
│   ├── components/      # UI 컴포넌트
│   ├── hooks/           # 상태 관리 훅
│   └── pages/           # 페이지 컴포넌트
│
├── application/         # 또는 services/, features/
│   ├── use-cases/       # 비즈니스 유스케이스
│   └── services/        # API 서비스 래퍼
│
├── domain/              # 또는 types/, entities/
│   ├── entities/        # 도메인 엔티티
│   ├── types/           # 타입 정의
│   └── constants/       # 도메인 상수
│
└── infrastructure/      # 또는 lib/, api/
    ├── api/             # API 클라이언트
    ├── db/              # 데이터베이스 연결
    └── external/        # 외부 서비스
```

### 계층별 책임과 규칙

| 계층 | 책임 | 의존 가능 | 의존 금지 |
|------|------|----------|----------|
| **Presentation** | UI 렌더링, 사용자 이벤트 | Application, Domain | Infrastructure 직접 |
| **Application** | 비즈니스 로직 오케스트레이션 | Domain, Infrastructure | Presentation |
| **Domain** | 핵심 비즈니스 규칙, 타입 | 없음 (독립적) | 모든 외부 계층 |
| **Infrastructure** | 외부 시스템 연결 | Domain | Application, Presentation |

### 의존성 규칙 (Dependency Rule)

```typescript
// ❌ 나쁜 예: Presentation이 Infrastructure 직접 호출
// components/UserList.tsx
import { apiClient } from '@/lib/api/client';  // 직접 import 금지!

export function UserList() {
  const users = apiClient.get('/users');  // ❌
}

// ✅ 좋은 예: Presentation → Application → Infrastructure
// hooks/useUsers.ts
import { userService } from '@/services/user.service';

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: userService.getList,  // ✅ Service 통해 호출
  });
}

// components/UserList.tsx
import { useUsers } from '@/hooks/useUsers';

export function UserList() {
  const { data: users } = useUsers();  // ✅ Hook 통해 호출
}
```

### 파일 간 import 규칙

```typescript
// ===== 허용되는 import 방향 =====

// presentation/ 에서:
import { User } from '@/domain/types';           // ✅ Domain OK
import { useUsers } from '@/hooks/useUsers';     // ✅ 같은 계층 OK
import { userService } from '@/services/user';   // ✅ Application OK

// application/ 에서:
import { User } from '@/domain/types';           // ✅ Domain OK
import { apiClient } from '@/lib/api/client';    // ✅ Infrastructure OK

// domain/ 에서:
// 외부 import 최소화 (순수 타입/로직만)

// infrastructure/ 에서:
import { User } from '@/domain/types';           // ✅ Domain OK

// ===== 금지되는 import =====

// domain/ 에서:
import { apiClient } from '@/lib/api/client';    // ❌ Infrastructure 금지
import { Button } from '@/components/ui/button'; // ❌ Presentation 금지

// infrastructure/ 에서:
import { useUsers } from '@/hooks/useUsers';     // ❌ Presentation 금지
```

### 레벨별 적용

| 레벨 | 아키텍처 적용 |
|------|--------------|
| **Starter** | 단순 구조 (components, lib) |
| **Dynamic** | 3~4계층 분리 (권장 구조) |
| **Enterprise** | 엄격한 계층 분리 + DI 컨테이너 |

### Starter 레벨 폴더 구조

```
src/
├── components/     # UI 컴포넌트
├── lib/            # 유틸리티, API
└── types/          # 타입 정의
```

### Dynamic 레벨 폴더 구조

```
src/
├── components/     # Presentation
│   └── ui/
├── features/       # 기능별 모듈 (Application + Presentation)
│   ├── auth/
│   └── product/
├── hooks/          # Presentation (상태 관리)
├── services/       # Application
├── types/          # Domain
└── lib/            # Infrastructure
    └── api/
```

### Enterprise 레벨 폴더 구조

```
src/
├── presentation/
│   ├── components/
│   ├── hooks/
│   └── pages/
├── application/
│   ├── use-cases/
│   └── services/
├── domain/
│   ├── entities/
│   └── types/
└── infrastructure/
    ├── api/
    └── db/
```

---

## Phase 간 연결

이 Phase에서 정의한 컨벤션은 다음 Phase에서 검증됩니다:

| 정의 (Phase 2) | 검증 (Phase 8) |
|----------------|----------------|
| 네이밍 규칙 | 네이밍 일관성 검사 |
| 폴더 구조 | 구조 일관성 검사 |
| 환경 변수 컨벤션 | 환경 변수 네이밍 검사 |
| 클린 아키텍처 원칙 | 의존성 방향 검사 |

---

## 템플릿

`templates/pipeline/phase-2-convention.template.md` 참조

## 다음 Phase

Phase 3: 목업 개발 → 규칙이 정해졌으니 빠르게 프로토타입

---

## 6. 재사용성 원칙

### 6.1 함수 설계

#### 범용 함수 만들기
```typescript
// ❌ 특정 케이스만 처리
function formatUserName(user: User) {
  return `${user.firstName} ${user.lastName}`
}

// ✅ 범용적으로
function formatFullName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`
}

// 사용
formatFullName(user.firstName, user.lastName)
formatFullName(author.first, author.last)
```

#### 파라미터 일반화
```typescript
// ❌ 특정 타입에 종속
function calculateOrderTotal(order: Order) {
  return order.items.reduce((sum, item) => sum + item.price, 0)
}

// ✅ 인터페이스로 일반화
interface HasPrice { price: number }
function calculateTotal<T extends HasPrice>(items: T[]) {
  return items.reduce((sum, item) => sum + item.price, 0)
}

// 다양한 곳에서 사용 가능
calculateTotal(order.items)
calculateTotal(cart.products)
calculateTotal(invoice.lineItems)
```

### 6.2 컴포넌트 설계

#### 합성 가능한 컴포넌트
```tsx
// ❌ 하드코딩된 구조
function UserCard({ user }: { user: User }) {
  return (
    <div className="card">
      <img src={user.avatar} />
      <h3>{user.name}</h3>
      <p>{user.email}</p>
    </div>
  )
}

// ✅ 합성 가능하게
function Card({ children, className }: CardProps) {
  return <div className={cn("card", className)}>{children}</div>
}

function Avatar({ src, alt }: AvatarProps) {
  return <img src={src} alt={alt} className="avatar" />
}

// 조합해서 사용
<Card>
  <Avatar src={user.avatar} alt={user.name} />
  <h3>{user.name}</h3>
  <p>{user.email}</p>
</Card>
```

#### Props 확장성
```tsx
// ❌ 제한된 props
interface ButtonProps {
  label: string
  onClick: () => void
}

// ✅ HTML 속성 확장
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

// 모든 button 속성 사용 가능
<Button type="submit" disabled={isLoading}>
  저장
</Button>
```

### 6.3 추출 기준

#### 언제 함수로 추출하는가
```
1. 같은 로직이 2번 이상 사용될 때
2. 로직이 복잡해서 이름이 필요할 때
3. 테스트가 필요한 로직일 때
4. 다른 파일에서도 쓸 수 있을 때
```

#### 언제 컴포넌트로 추출하는가
```
1. 같은 UI 패턴이 반복될 때
2. 독립적인 상태를 가질 때
3. 재사용 가능한 단위일 때
4. 50줄 이상의 JSX일 때
```

---

## 7. 확장성 원칙

### 7.1 설정 기반 설계

```typescript
// ❌ 조건문 나열
function getStatusColor(status: string) {
  if (status === 'active') return 'green'
  if (status === 'pending') return 'yellow'
  if (status === 'error') return 'red'
  return 'gray'
}

// ✅ 설정 객체
const STATUS_CONFIG = {
  active: { color: 'green', label: '활성' },
  pending: { color: 'yellow', label: '대기' },
  error: { color: 'red', label: '오류' },
} as const

function getStatusConfig(status: keyof typeof STATUS_CONFIG) {
  return STATUS_CONFIG[status] ?? { color: 'gray', label: status }
}

// 새 상태 추가 = 설정만 추가
```

### 7.2 전략 패턴

```typescript
// ❌ switch문 나열
function processPayment(method: string, amount: number) {
  switch (method) {
    case 'card':
      // 카드 결제 로직
      break
    case 'bank':
      // 계좌이체 로직
      break
  }
}

// ✅ 전략 패턴
interface PaymentStrategy {
  process(amount: number): Promise<Result>
}

const paymentStrategies: Record<string, PaymentStrategy> = {
  card: new CardPayment(),
  bank: new BankTransfer(),
}

function processPayment(method: string, amount: number) {
  const strategy = paymentStrategies[method]
  if (!strategy) throw new Error(`Unknown method: ${method}`)
  return strategy.process(amount)
}

// 새 결제 수단 추가 = 전략만 추가
```

### 7.3 플러그인 구조

```typescript
// 확장 가능한 시스템
interface Plugin {
  name: string
  init(): void
  execute(data: unknown): unknown
}

class PluginManager {
  private plugins: Plugin[] = []
  
  register(plugin: Plugin) {
    this.plugins.push(plugin)
  }
  
  executeAll(data: unknown) {
    return this.plugins.reduce(
      (result, plugin) => plugin.execute(result),
      data
    )
  }
}

// 새 기능 = 플러그인 추가
```

---

## 8. 중복 방지 체크리스트

### 코드 작성 전
- [ ] 유사 함수가 utils/에 있는가?
- [ ] 유사 컴포넌트가 components/에 있는가?
- [ ] 유사 훅이 hooks/에 있는가?
- [ ] 프로젝트 전체 검색 해봤는가?

### 코드 작성 후
- [ ] 같은 코드가 2곳 이상 있는가? → 추출
- [ ] 이 코드를 다른 곳에서 쓸 수 있는가? → 이동
- [ ] 하드코딩된 값이 있는가? → 상수화
- [ ] 특정 타입에 종속되어 있는가? → 일반화
