---
name: starter
description: |
  Static web development skill for beginners and non-developers.
  Covers HTML/CSS/JavaScript and Next.js App Router basics.

  Triggers: static website, portfolio, HTML CSS, beginner, 정적 웹, 초보자, 静的サイト, 初心者
agent: starter-guide
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - WebSearch
user-invocable: false
---

# 초급 (Starter) 스킬

## 대상

- 프로그래밍 처음 배우는 분
- 간단한 웹사이트를 만들고 싶은 분
- 포트폴리오 사이트가 필요한 분

## 기술 스택

### 옵션 A: 순수 HTML/CSS/JS (완전 초보용)

```
HTML5        → 웹페이지 구조
CSS3         → 스타일링
JavaScript   → 동적 기능 (선택)
```

### 옵션 B: Next.js (프레임워크 사용)

```
Next.js 14+  → React 기반 프레임워크
Tailwind CSS → 유틸리티 CSS
TypeScript   → 타입 안정성 (선택)
```

## 프로젝트 구조

### 옵션 A: HTML/CSS/JS

```
프로젝트/
├── index.html          # 메인 페이지
├── about.html          # 소개 페이지
├── css/
│   └── style.css       # 스타일
├── js/
│   └── main.js         # JavaScript
├── images/             # 이미지 파일
├── docs/               # PDCA 문서
│   ├── 01-plan/
│   └── 02-design/
└── README.md
```

### 옵션 B: Next.js

```
프로젝트/
├── src/
│   ├── app/
│   │   ├── layout.tsx      # 공통 레이아웃
│   │   ├── page.tsx        # 메인 페이지
│   │   └── about/
│   │       └── page.tsx    # 소개 페이지
│   └── components/         # 재사용 컴포넌트
├── public/                 # 정적 파일
├── docs/                   # PDCA 문서
├── package.json
├── tailwind.config.js
└── README.md
```

## 핵심 개념 설명

### HTML (웹페이지의 뼈대)

```html
<!-- 기본 구조 -->
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <title>내 웹사이트</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <header>머리말</header>
    <main>본문</main>
    <footer>꼬리말</footer>
</body>
</html>
```

### CSS (웹페이지 꾸미기)

```css
/* 기본 스타일 */
body {
    font-family: 'Pretendard', sans-serif;
    margin: 0;
    padding: 0;
}

/* 가운데 정렬 */
.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

/* 반응형 (모바일 대응) */
@media (max-width: 768px) {
    .container {
        padding: 10px;
    }
}
```

### Next.js App Router (페이지 만들기)

```tsx
// app/page.tsx - 메인 페이지
export default function Home() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-3xl font-bold">
        환영합니다!
      </h1>
    </main>
  );
}

// app/about/page.tsx - 소개 페이지
// URL: /about
export default function About() {
  return (
    <div className="container mx-auto p-4">
      <h1>소개</h1>
      <p>저는 ...</p>
    </div>
  );
}
```

### Tailwind CSS (빠른 스타일링)

```tsx
// 자주 쓰는 클래스
<div className="
  container    // 가운데 정렬
  mx-auto      // 좌우 마진 자동
  p-4          // 패딩 16px
  text-center  // 글자 가운데
  text-xl      // 글자 크기 크게
  font-bold    // 굵은 글씨
  bg-blue-500  // 파란 배경
  text-white   // 흰 글씨
  rounded-lg   // 둥근 모서리
  hover:bg-blue-600  // 마우스 올리면 색 변경
">
```

## 배포 방법

### GitHub Pages (무료)

```
1. GitHub 저장소 생성
2. 코드 push
3. Settings → Pages → Source: main branch
4. https://username.github.io/repo-name 으로 접속
```

### Vercel (Next.js 권장)

```
1. vercel.com 가입 (GitHub 연동)
2. "New Project" → 저장소 선택
3. "Deploy" 클릭
4. 자동으로 URL 생성됨
```

## 제한사항

```
❌ 로그인/회원가입 (서버 필요)
❌ 데이터 저장 (데이터베이스 필요)
❌ 관리자 페이지 (백엔드 필요)
❌ 결제 기능 (백엔드 필요)
```

## 업그레이드 시점

다음이 필요하면 **Dynamic 레벨**로:

```
→ "로그인 기능이 필요해요"
→ "데이터를 저장하고 싶어요"
→ "관리자 페이지가 필요해요"
→ "회원들끼리 소통하게 하고 싶어요"
```

## 자주 하는 실수

| 실수 | 해결책 |
|------|--------|
| 이미지가 안 보임 | 경로 확인 (`./images/photo.jpg`) |
| CSS가 적용 안 됨 | link 태그 경로 확인 |
| 페이지 이동이 안 됨 | href 경로 확인 (`./about.html`) |
| 모바일에서 깨짐 | `<meta name="viewport">` 태그 확인 |
