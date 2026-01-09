---
name: desktop-app
description: |
  Desktop app development guide for cross-platform desktop applications.
  Covers Electron and Tauri frameworks.

  Triggers: desktop app, Electron, Tauri, mac app, windows app, 데스크톱 앱, デスクトップアプリ, 桌面应用
agent: pipeline-guide
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - WebSearch
user-invocable: false
---

# 데스크톱 앱 개발 전문 지식

## 개요

웹 기술(HTML, CSS, JavaScript)로 데스크톱 앱을 개발하는 가이드입니다.
하나의 코드베이스로 Windows, macOS, Linux를 동시에 지원합니다.

---

## 프레임워크 선택 가이드

### 추천 프레임워크

| 프레임워크 | 추천 대상 | 장점 | 단점 |
|-----------|----------|------|------|
| **Electron** | 빠른 개발, 풍부한 생태계 | 쉬운 시작, 많은 예제 | 큰 번들 사이즈 (~150MB) |
| **Tauri** | 경량 앱, 성능 중시 | 작은 번들 (~10MB), 빠른 실행 | Rust 필요, 작은 생태계 |

### 레벨별 추천

```
Starter → Electron + electron-vite
  - 웹 지식만으로 바로 시작 가능

Dynamic → Electron + 자동 업데이트
  - 서버 연동, 자동 업데이트 포함

Enterprise → Tauri
  - 성능과 보안이 중요한 앱
```

---

## Electron 가이드

### 프로젝트 생성

```bash
# electron-vite로 생성 (추천)
npm create @electron-vite/create my-electron-app
cd my-electron-app

# 의존성 설치
npm install

# 개발 서버 시작
npm run dev
```

### 폴더 구조

```
my-electron-app/
├── src/
│   ├── main/               # 메인 프로세스 (Node.js)
│   │   └── index.ts        # 앱 진입점, 윈도우 관리
│   ├── preload/            # 프리로드 스크립트
│   │   └── index.ts        # 렌더러↔메인 브릿지
│   └── renderer/           # 렌더러 프로세스 (웹)
│       ├── src/            # React/Vue 코드
│       └── index.html      # HTML 진입점
├── resources/              # 앱 아이콘, 에셋
├── electron.vite.config.ts # 빌드 설정
├── electron-builder.yml    # 배포 설정
└── package.json
```

### 핵심 개념: 프로세스 분리

```
┌─────────────────────────────────────────────────────┐
│                    Electron App                      │
├─────────────────────────────────────────────────────┤
│  Main Process (Node.js)                             │
│  - 시스템 API 접근 (파일, 네트워크 등)                │
│  - 윈도우 생성/관리                                  │
│  - 메뉴, 트레이 관리                                 │
├─────────────────────────────────────────────────────┤
│  Preload Script (브릿지)                            │
│  - 메인↔렌더러 안전한 통신                          │
│  - 특정 API만 노출                                  │
├─────────────────────────────────────────────────────┤
│  Renderer Process (Chromium)                        │
│  - 웹 UI (React, Vue 등)                            │
│  - DOM 접근                                         │
│  - 직접 Node.js API 접근 불가 (보안)                │
└─────────────────────────────────────────────────────┘
```

### 메인 프로세스

```typescript
// src/main/index.ts
import { app, BrowserWindow, ipcMain } from 'electron';
import { join } from 'path';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
    },
  });

  // 개발 모드: Vite 서버 로드
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // 프로덕션: 빌드된 파일 로드
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC: 렌더러에서 요청 처리
ipcMain.handle('read-file', async (event, filePath) => {
  const fs = await import('fs/promises');
  return fs.readFile(filePath, 'utf-8');
});
```

### 프리로드 스크립트

```typescript
// src/preload/index.ts
import { contextBridge, ipcRenderer } from 'electron';

// 렌더러에 안전하게 노출할 API
contextBridge.exposeInMainWorld('electronAPI', {
  // 파일 읽기
  readFile: (filePath: string) => ipcRenderer.invoke('read-file', filePath),

  // 파일 저장 다이얼로그
  saveFile: (content: string) => ipcRenderer.invoke('save-file', content),

  // 앱 버전
  getVersion: () => process.env.npm_package_version,

  // 플랫폼
  platform: process.platform,
});

// 타입 정의 (렌더러에서 사용)
declare global {
  interface Window {
    electronAPI: {
      readFile: (path: string) => Promise<string>;
      saveFile: (content: string) => Promise<void>;
      getVersion: () => string;
      platform: NodeJS.Platform;
    };
  }
}
```

### 렌더러 프로세스

```typescript
// src/renderer/src/App.tsx
import { useState } from 'react';

function App() {
  const [content, setContent] = useState('');

  const handleOpenFile = async () => {
    const result = await window.electronAPI.readFile('/path/to/file.txt');
    setContent(result);
  };

  return (
    <div className="app">
      <h1>My Electron App</h1>
      <p>Platform: {window.electronAPI.platform}</p>
      <button onClick={handleOpenFile}>Open File</button>
      <pre>{content}</pre>
    </div>
  );
}

export default App;
```

### 메뉴 만들기

```typescript
// src/main/menu.ts
import { Menu, app, shell } from 'electron';

const template: Electron.MenuItemConstructorOptions[] = [
  {
    label: '파일',
    submenu: [
      { label: '새 파일', accelerator: 'CmdOrCtrl+N', click: () => {} },
      { label: '열기', accelerator: 'CmdOrCtrl+O', click: () => {} },
      { type: 'separator' },
      { label: '종료', role: 'quit' },
    ],
  },
  {
    label: '편집',
    submenu: [
      { label: '실행 취소', role: 'undo' },
      { label: '다시 실행', role: 'redo' },
      { type: 'separator' },
      { label: '잘라내기', role: 'cut' },
      { label: '복사', role: 'copy' },
      { label: '붙여넣기', role: 'paste' },
    ],
  },
  {
    label: '도움말',
    submenu: [
      {
        label: '문서',
        click: () => shell.openExternal('https://docs.example.com'),
      },
    ],
  },
];

// macOS 앱 메뉴 추가
if (process.platform === 'darwin') {
  template.unshift({
    label: app.getName(),
    submenu: [
      { role: 'about' },
      { type: 'separator' },
      { role: 'services' },
      { type: 'separator' },
      { role: 'hide' },
      { role: 'unhide' },
      { type: 'separator' },
      { role: 'quit' },
    ],
  });
}

export const menu = Menu.buildFromTemplate(template);
```

### 시스템 트레이

```typescript
// src/main/tray.ts
import { Tray, Menu, nativeImage } from 'electron';
import { join } from 'path';

let tray: Tray | null = null;

export function createTray() {
  const icon = nativeImage.createFromPath(join(__dirname, '../../resources/icon.png'));
  tray = new Tray(icon.resize({ width: 16, height: 16 }));

  const contextMenu = Menu.buildFromTemplate([
    { label: '열기', click: () => {} },
    { type: 'separator' },
    { label: '종료', role: 'quit' },
  ]);

  tray.setToolTip('My App');
  tray.setContextMenu(contextMenu);
}
```

---

## Tauri 가이드

### 프로젝트 생성

```bash
# 전제조건: Rust 설치 필요
# https://rustup.rs 에서 설치

# Tauri 프로젝트 생성
npm create tauri-app my-tauri-app
cd my-tauri-app

# 의존성 설치
npm install

# 개발 서버 시작
npm run tauri dev
```

### 폴더 구조

```
my-tauri-app/
├── src/                    # 프론트엔드 (React, Vue 등)
│   ├── App.tsx
│   └── main.tsx
├── src-tauri/              # Tauri 백엔드 (Rust)
│   ├── src/
│   │   ├── main.rs         # 메인 진입점
│   │   └── lib.rs          # 커맨드 정의
│   ├── tauri.conf.json     # Tauri 설정
│   └── Cargo.toml          # Rust 의존성
├── public/
└── package.json
```

### 커맨드 정의 (Rust)

```rust
// src-tauri/src/lib.rs
use tauri::command;

#[command]
fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}

#[command]
async fn read_file(path: &str) -> Result<String, String> {
    std::fs::read_to_string(path)
        .map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![greet, read_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### 프론트엔드에서 호출

```typescript
// src/App.tsx
import { invoke } from '@tauri-apps/api/core';

function App() {
  const [greeting, setGreeting] = useState('');

  const handleGreet = async () => {
    const result = await invoke('greet', { name: 'World' });
    setGreeting(result as string);
  };

  const handleReadFile = async () => {
    try {
      const content = await invoke('read_file', { path: '/path/to/file.txt' });
      console.log(content);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <button onClick={handleGreet}>Greet</button>
      <p>{greeting}</p>
    </div>
  );
}
```

---

## 웹 vs 데스크톱 차이점

### 파일 시스템 접근

```typescript
// 웹: 불가능 (사용자가 직접 선택해야 함)
// 데스크톱: 자유롭게 접근 가능

// Electron
const fs = require('fs');
fs.writeFileSync('/path/to/file.txt', 'content');

// Tauri
await invoke('write_file', { path: '/path/to/file.txt', content: 'content' });
```

### 시스템 통합

```
웹에서 불가능하지만 데스크톱에서 가능한 것:
- 시스템 트레이 아이콘
- 전역 단축키
- 네이티브 알림
- 드래그 앤 드롭 (파일 경로 접근)
- 클립보드 완전 제어
- 네이티브 메뉴
```

### 오프라인 지원

```
웹: Service Worker 필요, 제한적
데스크톱: 기본적으로 오프라인 동작

⚠️ 서버 연동 기능은 오프라인 처리 필수!
```

---

## 빌드 & 배포

### Electron 빌드

```yaml
# electron-builder.yml
appId: com.example.myapp
productName: My App
directories:
  buildResources: resources
files:
  - '!**/.vscode/*'
  - '!src/*'
  - '!electron.vite.config.*'
mac:
  artifactName: ${name}-${version}-${arch}.${ext}
  target:
    - dmg
    - zip
  icon: resources/icon.icns
win:
  artifactName: ${name}-${version}-${arch}.${ext}
  target:
    - nsis
  icon: resources/icon.ico
linux:
  target:
    - AppImage
    - deb
```

```bash
# 빌드 실행
npm run build:mac
npm run build:win
npm run build:linux
```

### 자동 업데이트

```typescript
// src/main/updater.ts
import { autoUpdater } from 'electron-updater';

autoUpdater.checkForUpdatesAndNotify();

autoUpdater.on('update-available', () => {
  // 업데이트 있음 알림
});

autoUpdater.on('update-downloaded', () => {
  // 재시작하여 업데이트 적용
  autoUpdater.quitAndInstall();
});
```

### Tauri 빌드

```bash
# 현재 플랫폼용 빌드
npm run tauri build

# 결과물 위치
# macOS: src-tauri/target/release/bundle/dmg/
# Windows: src-tauri/target/release/bundle/msi/
# Linux: src-tauri/target/release/bundle/appimage/
```

---

## 데스크톱 PDCA 체크리스트

### Phase 1: 스키마
```
□ 로컬 데이터 저장 방식 결정 (SQLite, JSON 파일 등)
□ 클라우드 동기화 필요 여부 결정
```

### Phase 3: 목업
```
□ 플랫폼별 UI 가이드라인 고려 (macOS, Windows)
□ 키보드 단축키 계획
□ 메뉴 구조 설계
```

### Phase 6: UI
```
□ 다크/라이트 모드 지원
□ 윈도우 크기 조절 처리
□ 플랫폼별 UI 차이 처리 (창 컨트롤 위치 등)
```

### Phase 7: 보안
```
□ Node.js API 직접 노출 금지 (contextBridge 사용)
□ 외부 URL 로드 시 보안 처리
□ 민감 데이터 암호화 저장
```

### Phase 9: 배포
```
□ 코드 서명 (macOS Notarization, Windows Signing)
□ 자동 업데이트 설정
□ 앱스토어 제출 (필요시)
```

---

## 유용한 라이브러리

### Electron

| 라이브러리 | 용도 |
|-----------|------|
| electron-store | 설정/데이터 로컬 저장 |
| electron-updater | 자동 업데이트 |
| electron-log | 로깅 |
| better-sqlite3 | SQLite 데이터베이스 |

### Tauri

| 라이브러리 | 용도 |
|-----------|------|
| tauri-plugin-store | 설정 저장 |
| tauri-plugin-sql | SQLite 지원 |
| tauri-plugin-log | 로깅 |
| tauri-plugin-updater | 자동 업데이트 |

---

## Claude에게 요청하기

### 프로젝트 생성
```
"Electron + React로 [앱 설명] 앱 프로젝트 세팅해줘.
- electron-vite 사용
- 시스템 트레이 지원
- 자동 업데이트 설정"
```

### 기능 구현
```
"파일 열기/저장 기능 구현해줘.
- 네이티브 파일 다이얼로그 사용
- 최근 파일 목록 저장
- 드래그 앤 드롭 지원"
```

### 빌드 설정
```
"electron-builder 설정 만들어줘.
- macOS: DMG + 노타라이제이션
- Windows: NSIS 인스톨러
- 자동 업데이트 서버 연동"
```
