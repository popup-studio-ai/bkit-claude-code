# SEO/Security Specification

> Phase 7 Deliverable: Search optimization and security configuration

**Project**: {{project_name}}
**Date**: {{date}}
**Version**: 1.0

---

## 1. SEO Configuration

### 1.1 Metadata

**Global Settings** (`app/layout.tsx`):
```typescript
export const metadata: Metadata = {
  title: {
    default: '{{siteName}}',
    template: '%s | {{siteName}}',
  },
  description: '{{siteDescription}}',
  keywords: ['keyword1', 'keyword2'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '{{siteUrl}}',
    siteName: '{{siteName}}',
    images: [{ url: '/og-image.png' }],
  },
  twitter: {
    card: 'summary_large_image',
  },
}
```

### 1.2 Page-specific Metadata
| Page | Title | Description |
|------|-------|-------------|
| Home | {{siteName}} | {{siteDescription}} |
| | | |

### 1.3 Structured Data
```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "{{siteName}}",
  "url": "{{siteUrl}}"
}
```

---

## 2. Sitemap & Robots

### 2.1 sitemap.xml
```typescript
// app/sitemap.ts
export default function sitemap() {
  return [
    { url: '{{siteUrl}}', lastModified: new Date() },
    // Add dynamic pages
  ]
}
```

### 2.2 robots.txt
```typescript
// app/robots.ts
export default function robots() {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: '{{siteUrl}}/sitemap.xml',
  }
}
```

---

## 3. Security Settings

### 3.1 Authentication/Authorization
| Item | Setting | Status |
|------|---------|--------|
| Session management | JWT / Session | ⬜ |
| CSRF protection | Token | ⬜ |
| Permission check | Middleware | ⬜ |

### 3.2 Security Headers
```typescript
// next.config.js
headers: [
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin',
  },
]
```

### 3.3 Input Validation
- [ ] Server-side validation
- [ ] XSS prevention (escape handling)
- [ ] SQL injection prevention (parameterized queries)

---

## 4. Performance Optimization

### 4.1 Images
- [ ] Use next/image
- [ ] WebP format
- [ ] Appropriate sizes setting

### 4.2 Fonts
- [ ] Use next/font
- [ ] Apply subset

### 4.3 Code Splitting
- [ ] Dynamic imports
- [ ] Lazy loading

---

## 5. Validation Checklist

### SEO
- [ ] All pages have metadata
- [ ] Open Graph is configured
- [ ] sitemap.xml is generated
- [ ] robots.txt is correct

### Security
- [ ] Authentication works properly
- [ ] Security headers are set
- [ ] Input validation is implemented
- [ ] HTTPS is enforced

---

## 6. Next Steps

Proceed to Phase 8: Architecture/Convention Review
