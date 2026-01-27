---
name: phase-7-seo-security
description: |
  Skill for enhancing search optimization (SEO) and security.
  Covers meta tags, semantic HTML, and security vulnerability checks.

  Use proactively when user asks about search ranking, security hardening, or vulnerability fixes.

  Triggers: SEO, security, meta tags, XSS, CSRF, 보안, セキュリティ, 安全,
  seguridad, etiquetas meta, optimización de búsqueda,
  sécurité, balises méta, optimisation pour les moteurs de recherche,
  Sicherheit, Meta-Tags, Suchmaschinenoptimierung,
  sicurezza, tag meta, ottimizzazione per i motori di ricerca

  Do NOT use for: backend-only APIs, internal tools, or basic development setup.
imports:
  - ${PLUGIN_ROOT}/templates/pipeline/phase-7-seo-security.template.md
agent: bkit:code-analyzer
allowed-tools:
  - Read
  - Edit
  - Glob
  - Grep
  - WebSearch
user-invocable: false
next-skill: phase-8-review
pdca-phase: do
task-template: "[Phase-7] {feature}"
---

# Phase 7: SEO/Security

> Search optimization and security enhancement

## Purpose

Make the application discoverable through search and defend against security vulnerabilities.

## What to Do in This Phase

1. **SEO Optimization**: Meta tags, structured data, sitemap
2. **Performance Optimization**: Core Web Vitals improvement
3. **Security Enhancement**: Authentication, authorization, vulnerability defense

## Deliverables

```
docs/02-design/
├── seo-spec.md             # SEO specification
└── security-spec.md        # Security specification

src/
├── middleware/             # Security middleware
└── components/
    └── seo/                # SEO components
```

## PDCA Application

- **Plan**: Define SEO/security requirements
- **Design**: Meta tags, security policy design
- **Do**: SEO/security implementation
- **Check**: Inspection and verification
- **Act**: Improve and proceed to Phase 8

## Level-wise Application

| Level | Application Method |
|-------|-------------------|
| Starter | SEO only (minimal security) |
| Dynamic | SEO + basic security |
| Enterprise | SEO + advanced security |

## SEO Checklist

### Basic
- [ ] Per-page title, description
- [ ] Open Graph meta tags
- [ ] Canonical URL
- [ ] sitemap.xml
- [ ] robots.txt

### Structured Data
- [ ] JSON-LD schema
- [ ] Breadcrumb
- [ ] Product/Review schema (if applicable)

### Performance
- [ ] Image optimization (next/image)
- [ ] Font optimization
- [ ] Code splitting

## Security Checklist

### Authentication/Authorization
- [ ] Secure session management
- [ ] CSRF protection
- [ ] Proper permission checks

### Data Protection
- [ ] Input validation
- [ ] SQL injection defense
- [ ] XSS defense

### Communication Security
- [ ] HTTPS enforcement
- [ ] Security header configuration
- [ ] CORS policy

---

## Security Architecture (Cross-Phase Connection)

### Security Layer Structure

```
┌─────────────────────────────────────────────────────────────┐
│                     Client (Browser)                         │
├─────────────────────────────────────────────────────────────┤
│   Phase 6: UI Security                                       │
│   - XSS defense (input escaping)                            │
│   - CSRF token inclusion                                     │
│   - No sensitive info storage on client                      │
├─────────────────────────────────────────────────────────────┤
│   Phase 4/6: API Communication Security                      │
│   - HTTPS enforcement                                        │
│   - Authorization header (Bearer Token)                      │
│   - Content-Type validation                                  │
├─────────────────────────────────────────────────────────────┤
│   Phase 4: API Server Security                               │
│   - Input validation                                         │
│   - Rate Limiting                                            │
│   - Minimal error messages (prevent sensitive info exposure) │
├─────────────────────────────────────────────────────────────┤
│   Phase 2/9: Environment Variable Security                   │
│   - Secrets management                                       │
│   - Environment separation                                   │
│   - Client-exposed variable distinction                      │
└─────────────────────────────────────────────────────────────┘
```

### Security Responsibilities by Phase

| Phase | Security Responsibility | Verification Items |
|-------|------------------------|-------------------|
| **Phase 2** | Environment variable convention | NEXT_PUBLIC_* distinction, Secrets list |
| **Phase 4** | API security design | Auth method, error codes, input validation |
| **Phase 6** | Client security | XSS defense, token management, sensitive info |
| **Phase 7** | Security implementation/inspection | Full security checklist |
| **Phase 9** | Deployment security | Secrets injection, HTTPS, security headers |

---

## Client Security (Phase 6 Connection)

### XSS Defense Principles

```
⚠️ XSS (Cross-Site Scripting) Defense

1. Never use innerHTML directly
2. Always sanitize user input when rendering as HTML
3. Leverage React's automatic escaping
4. Use DOMPurify library when needed
```

### No Sensitive Information Storage

```typescript
// ❌ Forbidden: Sensitive info in localStorage
localStorage.setItem('password', password);
localStorage.setItem('creditCard', cardNumber);

// ✅ Allowed: Store only tokens (httpOnly cookies recommended)
localStorage.setItem('auth_token', token);

// ✅ More secure: httpOnly cookie (set by server)
// Set-Cookie: token=xxx; HttpOnly; Secure; SameSite=Strict
```

### CSRF Defense

```typescript
// Include CSRF token in API client
// lib/api/client.ts
private async request<T>(endpoint: string, config: RequestConfig = {}) {
  const headers = new Headers(config.headers);

  // Add CSRF token
  const csrfToken = this.getCsrfToken();
  if (csrfToken) {
    headers.set('X-CSRF-Token', csrfToken);
  }
  // ...
}
```

---

## API Security (Phase 4 Connection)

### Input Validation (Server-side)

```typescript
// All input must be validated on the server
import { z } from 'zod';

const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  name: z.string().min(1).max(50),
});

// Usage in API Route
export async function POST(req: Request) {
  const body = await req.json();

  const result = CreateUserSchema.safeParse(body);
  if (!result.success) {
    return Response.json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Input is invalid.',
        details: result.error.flatten().fieldErrors,
      }
    }, { status: 400 });
  }

  const { email, password, name } = result.data;
}
```

### Error Message Security

```typescript
// ❌ Dangerous: Detailed error info exposure
{
  message: 'User with email test@test.com not found',
  stack: error.stack,  // Stack trace exposed!
}

// ✅ Safe: Minimal information only
{
  code: 'NOT_FOUND',
  message: 'User not found.',
}

// Detailed logs only on server
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

## Environment Variable Security (Phase 2/9 Connection)

### Client Exposure Check

```typescript
// lib/env.ts
const serverEnvSchema = z.object({
  DATABASE_URL: z.string(),      // Server only
  AUTH_SECRET: z.string(),       // Server only
});

const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string(),   // Can be exposed to client
});

export const serverEnv = serverEnvSchema.parse(process.env);
export const clientEnv = clientEnvSchema.parse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
});
```

### Security Header Configuration

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

## Security Verification Checklist (Phase 8 Connection)

### Required (All Levels)
- [ ] HTTPS enforcement
- [ ] No sensitive info exposed to client
- [ ] Input validation (server-side)
- [ ] XSS defense
- [ ] No sensitive info in error messages

### Recommended (Dynamic and above)
- [ ] CSRF token applied
- [ ] Rate Limiting applied
- [ ] Security headers configured
- [ ] httpOnly cookies (auth token)

### Advanced (Enterprise)
- [ ] Content Security Policy (CSP)
- [ ] Security audit logs
- [ ] Regular security scans

## Next.js SEO Example

```tsx
// app/layout.tsx
export const metadata: Metadata = {
  title: {
    default: 'Site Name',
    template: '%s | Site Name',
  },
  description: 'Site description',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://example.com',
    siteName: 'Site Name',
  },
};
```

## Template

See `templates/pipeline/phase-7-seo-security.template.md`

## Next Phase

Phase 8: Review → After optimization, verify overall code quality
