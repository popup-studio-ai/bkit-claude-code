---
name: phase-7-seo-security
description: |
  Skill for enhancing search optimization (SEO) and security.
  Covers meta tags, semantic HTML, and security vulnerability checks.

  Triggers: SEO, security, meta tags, XSS, CSRF, 보안, セキュリティ, 安全
agent: code-analyzer
allowed-tools:
  - Read
  - Edit
  - Glob
  - Grep
  - WebSearch
user-invocable: false
---

# Phase 7: SEO/보안

> 검색 최적화 및 보안 강화

## 목적

사용자가 검색으로 찾을 수 있게 하고, 보안 취약점을 방어합니다.

## 이 Phase에서 하는 것

1. **SEO 최적화**: 메타태그, 구조화된 데이터, 사이트맵
2. **성능 최적화**: Core Web Vitals 개선
3. **보안 강화**: 인증, 인가, 취약점 방어

## 산출물

```
docs/02-design/
├── seo-spec.md             # SEO 명세
└── security-spec.md        # 보안 명세

src/
├── middleware/             # 보안 미들웨어
└── components/
    └── seo/                # SEO 컴포넌트
```

## PDCA 적용

- **Plan**: SEO/보안 요구사항 정의
- **Design**: 메타태그, 보안 정책 설계
- **Do**: SEO/보안 구현
- **Check**: 점검 및 검증
- **Act**: 개선 후 Phase 8로

## 레벨별 적용

| 레벨 | 적용 방식 |
|------|----------|
| Starter | SEO만 (보안은 최소) |
| Dynamic | SEO + 기본 보안 |
| Enterprise | SEO + 고급 보안 |

## SEO 체크리스트

### 기본
- [ ] 페이지별 title, description
- [ ] Open Graph 메타태그
- [ ] 정규 URL (canonical)
- [ ] sitemap.xml
- [ ] robots.txt

### 구조화된 데이터
- [ ] JSON-LD 스키마
- [ ] 빵 부스러기(Breadcrumb)
- [ ] 제품/리뷰 스키마 (해당 시)

### 성능
- [ ] 이미지 최적화 (next/image)
- [ ] 폰트 최적화
- [ ] 코드 스플리팅

## 보안 체크리스트

### 인증/인가
- [ ] 안전한 세션 관리
- [ ] CSRF 방어
- [ ] 적절한 권한 검사

### 데이터 보호
- [ ] 입력 검증
- [ ] SQL 인젝션 방어
- [ ] XSS 방어

### 통신 보안
- [ ] HTTPS 강제
- [ ] 보안 헤더 설정
- [ ] CORS 정책

---

## 보안 아키텍처 (Phase 간 연결)

### 보안 레이어 구조

```
┌─────────────────────────────────────────────────────────────┐
│                     Client (Browser)                         │
├─────────────────────────────────────────────────────────────┤
│   Phase 6: UI 보안                                           │
│   - XSS 방어 (입력 이스케이프)                                │
│   - CSRF 토큰 포함                                           │
│   - 민감 정보 클라이언트 저장 금지                            │
├─────────────────────────────────────────────────────────────┤
│   Phase 4/6: API 통신 보안                                   │
│   - HTTPS 강제                                               │
│   - Authorization 헤더 (Bearer Token)                        │
│   - Content-Type 검증                                        │
├─────────────────────────────────────────────────────────────┤
│   Phase 4: API 서버 보안                                     │
│   - 입력 검증 (Validation)                                   │
│   - Rate Limiting                                            │
│   - 에러 메시지 최소화 (민감 정보 노출 방지)                  │
├─────────────────────────────────────────────────────────────┤
│   Phase 2/9: 환경 변수 보안                                  │
│   - Secrets 관리                                             │
│   - 환경별 분리                                              │
│   - 클라이언트 노출 변수 구분                                │
└─────────────────────────────────────────────────────────────┘
```

### Phase별 보안 책임

| Phase | 보안 책임 | 검증 항목 |
|-------|----------|----------|
| **Phase 2** | 환경 변수 컨벤션 | NEXT_PUBLIC_* 구분, Secrets 목록 |
| **Phase 4** | API 보안 설계 | 인증 방식, 에러 코드, 입력 검증 |
| **Phase 6** | 클라이언트 보안 | XSS 방어, 토큰 관리, 민감 정보 |
| **Phase 7** | 보안 구현/점검 | 전체 보안 체크리스트 |
| **Phase 9** | 배포 보안 | Secrets 주입, HTTPS, 보안 헤더 |

---

## 클라이언트 보안 (Phase 6 연계)

### XSS 방어 원칙

```
⚠️ XSS (Cross-Site Scripting) 방어

1. innerHTML 직접 사용 금지
2. 사용자 입력을 HTML로 렌더링 시 반드시 sanitize
3. React의 자동 이스케이프 활용
4. 필요 시 DOMPurify 라이브러리 사용
```

### 민감 정보 저장 금지

```typescript
// ❌ 금지: localStorage에 민감 정보
localStorage.setItem('password', password);
localStorage.setItem('creditCard', cardNumber);

// ✅ 허용: 토큰만 저장 (httpOnly 쿠키 권장)
localStorage.setItem('auth_token', token);

// ✅ 더 안전: httpOnly 쿠키 (서버에서 설정)
// Set-Cookie: token=xxx; HttpOnly; Secure; SameSite=Strict
```

### CSRF 방어

```typescript
// API 클라이언트에서 CSRF 토큰 포함
// lib/api/client.ts
private async request<T>(endpoint: string, config: RequestConfig = {}) {
  const headers = new Headers(config.headers);

  // CSRF 토큰 추가
  const csrfToken = this.getCsrfToken();
  if (csrfToken) {
    headers.set('X-CSRF-Token', csrfToken);
  }
  // ...
}
```

---

## API 보안 (Phase 4 연계)

### 입력 검증 (서버 측)

```typescript
// 모든 입력은 서버에서 다시 검증
import { z } from 'zod';

const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  name: z.string().min(1).max(50),
});

// API Route에서 사용
export async function POST(req: Request) {
  const body = await req.json();

  const result = CreateUserSchema.safeParse(body);
  if (!result.success) {
    return Response.json({
      error: {
        code: 'VALIDATION_ERROR',
        message: '입력값이 올바르지 않습니다.',
        details: result.error.flatten().fieldErrors,
      }
    }, { status: 400 });
  }

  const { email, password, name } = result.data;
}
```

### 에러 메시지 보안

```typescript
// ❌ 위험: 상세한 에러 정보 노출
{
  message: 'User with email test@test.com not found',
  stack: error.stack,  // 스택 트레이스 노출!
}

// ✅ 안전: 최소한의 정보만
{
  code: 'NOT_FOUND',
  message: '사용자를 찾을 수 없습니다.',
}

// 상세 로그는 서버에서만
console.error(`User not found: ${email}`, error);
```

### Rate Limiting

```typescript
// middleware.ts
import { Ratelimit } from '@upstash/ratelimit';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
});

export async function middleware(request: NextRequest) {
  const ip = request.ip ?? '127.0.0.1';
  const { success } = await ratelimit.limit(ip);

  if (!success) {
    return new Response('Too Many Requests', { status: 429 });
  }
}
```

---

## 환경 변수 보안 (Phase 2/9 연계)

### 클라이언트 노출 점검

```typescript
// lib/env.ts
const serverEnvSchema = z.object({
  DATABASE_URL: z.string(),      // 서버 전용
  AUTH_SECRET: z.string(),       // 서버 전용
});

const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string(),   // 클라이언트 노출 가능
});

export const serverEnv = serverEnvSchema.parse(process.env);
export const clientEnv = clientEnvSchema.parse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
});
```

### 보안 헤더 설정

```javascript
// next.config.js
const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
];

module.exports = {
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};
```

---

## 보안 검증 체크리스트 (Phase 8 연계)

### 필수 (모든 레벨)
- [ ] HTTPS 강제
- [ ] 민감 정보 클라이언트 노출 없음
- [ ] 입력 검증 (서버 측)
- [ ] XSS 방어
- [ ] 에러 메시지에 민감 정보 없음

### 권장 (Dynamic 이상)
- [ ] CSRF 토큰 적용
- [ ] Rate Limiting 적용
- [ ] 보안 헤더 설정
- [ ] httpOnly 쿠키 (인증 토큰)

### 고급 (Enterprise)
- [ ] Content Security Policy (CSP)
- [ ] 보안 감사 로그
- [ ] 정기적 보안 스캔

## Next.js SEO 예시

```tsx
// app/layout.tsx
export const metadata: Metadata = {
  title: {
    default: '사이트 이름',
    template: '%s | 사이트 이름',
  },
  description: '사이트 설명',
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: 'https://example.com',
    siteName: '사이트 이름',
  },
};
```

## 템플릿

`templates/pipeline/phase-7-seo-security.template.md` 참조

## 다음 Phase

Phase 8: 리뷰 → 최적화 후 전체 코드 품질 검증
