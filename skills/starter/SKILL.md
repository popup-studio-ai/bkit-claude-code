---
name: starter
description: |
  Static web development skill for beginners and non-developers.
  Covers HTML/CSS/JavaScript and Next.js App Router basics.

  Project initialization with "init starter" or "starter init".

  Use proactively when user is a beginner or wants a simple static website.

  Triggers: static website, portfolio, landing page, HTML CSS, beginner, first website,
  simple web, personal site, init starter, starter init,
  정적 웹, 포트폴리오, 랜딩페이지, 초보자, 첫 웹사이트, 간단한 웹,
  静的サイト, ポートフォリオ, 初心者, 静态网站, 个人网站, 初学者,
  sitio web estático, portafolio, página de inicio, principiante, primer sitio web,
  site web statique, portfolio, page d'accueil, débutant, premier site web,
  statische Website, Portfolio, Landingpage, Anfänger, erste Website,
  sito web statico, portfolio, pagina di destinazione, principiante, primo sito web

  Do NOT use for: fullstack apps with backend, authentication features, or database needs.
argument-hint: "[init|guide|help]"
agent: bkit:starter-guide
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - WebSearch
  - WebFetch
user-invocable: true
imports:
  - ${PLUGIN_ROOT}/templates/design-starter.template.md
next-skill: phase-1-schema
pdca-phase: plan
task-template: "[Init-Starter] {feature}"
---

# Beginner (Starter) Skill

## Actions

| Action | Description | Example |
|--------|-------------|---------|
| `init` | Project initialization (/init-starter feature) | `/starter init my-portfolio` |
| `guide` | Display development guide | `/starter guide` |
| `help` | Beginner help | `/starter help` |

### init (Project Initialization)
1. Create project directory structure (HTML/CSS/JS or Next.js)
2. Generate package.json (when Next.js selected)
3. Create CLAUDE.md (Level: Starter specified)
4. Create docs/ folder structure (for PDCA documents)
5. Initialize .bkit-memory.json

### guide (Development Guide)
- Analyze current project state
- Suggest next steps appropriate for Starter level
- Phase 1-3 focused Pipeline guide

### help (Beginner Help)
- Explain HTML/CSS/JS basic concepts
- Answer frequently asked questions
- Provide example code

## Target Audience

- Those learning programming for the first time
- Those who want to create a simple website
- Those who need a portfolio site

## Tech Stack

### Option A: Pure HTML/CSS/JS (For Complete Beginners)

```
HTML5        → Web page structure
CSS3         → Styling
JavaScript   → Dynamic features (optional)
```

### Option B: Next.js (Using Framework)

```
Next.js 14+  → React-based framework
Tailwind CSS → Utility CSS
TypeScript   → Type safety (optional)
```

### Language Tier Guidance (v1.3.0)

> **Recommended**: Tier 1 languages only (Python, TypeScript, JavaScript)
>
> Starter level focuses on AI-Native development with maximum AI tool support.

| Tier | Allowed | Reason |
|------|---------|--------|
| Tier 1 | ✅ Yes | Full AI support, Vibe Coding optimized |
| Tier 2 | ⚠️ Limited | Consider Dynamic level instead |
| Tier 3-4 | ❌ No | Upgrade to Dynamic/Enterprise |

## Project Structure

### Option A: HTML/CSS/JS

```
project/
├── index.html          # Main page
├── about.html          # About page
├── css/
│   └── style.css       # Styles
├── js/
│   └── main.js         # JavaScript
├── images/             # Image files
├── docs/               # PDCA documents
│   ├── 01-plan/
│   └── 02-design/
└── README.md
```

### Option B: Next.js

```
project/
├── src/
│   ├── app/
│   │   ├── layout.tsx      # Common layout
│   │   ├── page.tsx        # Main page
│   │   └── about/
│   │       └── page.tsx    # About page
│   └── components/         # Reusable components
├── public/                 # Static files
├── docs/                   # PDCA documents
├── package.json
├── tailwind.config.js
└── README.md
```

## Core Concept Explanations

### HTML (Web Page Structure)

```html
<!-- Basic structure -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>My Website</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <header>Header</header>
    <main>Main content</main>
    <footer>Footer</footer>
</body>
</html>
```

### CSS (Styling Web Pages)

```css
/* Basic styles */
body {
    font-family: 'Inter', sans-serif;
    margin: 0;
    padding: 0;
}

/* Center alignment */
.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

/* Responsive (mobile support) */
@media (max-width: 768px) {
    .container {
        padding: 10px;
    }
}
```

### Next.js App Router (Creating Pages)

```tsx
// app/page.tsx - Main page
export default function Home() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-3xl font-bold">
        Welcome!
      </h1>
    </main>
  );
}

// app/about/page.tsx - About page
// URL: /about
export default function About() {
  return (
    <div className="container mx-auto p-4">
      <h1>About</h1>
      <p>I am ...</p>
    </div>
  );
}
```

### Tailwind CSS (Quick Styling)

```tsx
// Frequently used classes
<div className="
  container    // Center alignment
  mx-auto      // Auto left/right margin
  p-4          // Padding 16px
  text-center  // Center text
  text-xl      // Large text
  font-bold    // Bold text
  bg-blue-500  // Blue background
  text-white   // White text
  rounded-lg   // Rounded corners
  hover:bg-blue-600  // Color change on hover
">
```

## Deployment Methods

### GitHub Pages (Free)

```
1. Create GitHub repository
2. Push code
3. Settings → Pages → Source: main branch
4. Access at https://username.github.io/repo-name
```

### Vercel (Recommended for Next.js)

```
1. Sign up at vercel.com (GitHub integration)
2. "New Project" → Select repository
3. Click "Deploy"
4. URL automatically generated
```

## Limitations

```
❌ Login/Registration (requires server)
❌ Data storage (requires database)
❌ Admin pages (requires backend)
❌ Payment features (requires backend)
```

## When to Upgrade

Move to **Dynamic Level** if you need:

```
→ "I need login functionality"
→ "I want to store data"
→ "I need an admin page"
→ "I want users to communicate with each other"
```

## Common Mistakes

| Mistake | Solution |
|---------|----------|
| Image not showing | Check path (`./images/photo.jpg`) |
| CSS not applied | Check link tag path |
| Page navigation not working | Check href path (`./about.html`) |
| Broken on mobile | Check `<meta name="viewport">` tag |
