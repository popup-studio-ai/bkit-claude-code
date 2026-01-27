---
name: desktop-app
description: |
  Desktop app development guide for cross-platform desktop applications.
  Covers Electron and Tauri frameworks.

  Use proactively when user wants to build desktop applications with web technologies.

  Triggers: desktop app, Electron, Tauri, mac app, windows app, 데스크톱 앱, デスクトップアプリ, 桌面应用,
  aplicación de escritorio, app de escritorio,
  application de bureau, application desktop,
  Desktop-Anwendung, Desktop-App,
  applicazione desktop, app desktop

  Do NOT use for: web-only projects, mobile apps, or server-side development.
agent: bkit:pipeline-guide
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

# Desktop App Development Expertise

## Overview

A guide for developing desktop apps using web technologies (HTML, CSS, JavaScript).
Support Windows, macOS, and Linux simultaneously with a single codebase.

---

## Framework Selection Guide

### Framework Selection by Tier (v1.3.0)

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

### Level-wise Recommendations

```
Starter → Tauri (v2) [Tier 2]
  - Simpler setup than Electron
  - Smaller output bundles (~3MB vs ~150MB)

Dynamic → Tauri + auto-update [Tier 2]
  - Includes server integration, auto-update
  - Lower memory footprint

Enterprise → Tauri [Tier 2] or Electron [Tier 3]
  - Tauri for performance and security
  - Electron for complex Node.js integration
```

---

## Electron Guide

### Project Creation

```bash
# Create with electron-vite (recommended)
npm create @electron-vite/create my-electron-app
cd my-electron-app

# Install dependencies
npm install

# Start development server
npm run dev
```

### Folder Structure

```
my-electron-app/
├── src/
│   ├── main/               # Main process (Node.js)
│   │   └── index.ts        # App entry point, window management
│   ├── preload/            # Preload script
│   │   └── index.ts        # Renderer↔Main bridge
│   └── renderer/           # Renderer process (Web)
│       ├── src/            # React/Vue code
│       └── index.html      # HTML entry point
├── resources/              # App icons, assets
├── electron.vite.config.ts # Build configuration
├── electron-builder.yml    # Deployment configuration
└── package.json
```

### Core Concept: Process Separation

```
┌─────────────────────────────────────────────────────┐
│                    Electron App                      │
├─────────────────────────────────────────────────────┤
│  Main Process (Node.js)                             │
│  - System API access (files, network, etc.)         │
│  - Window creation/management                       │
│  - Menu, tray management                            │
├─────────────────────────────────────────────────────┤
│  Preload Script (Bridge)                            │
│  - Safe main↔renderer communication                 │
│  - Expose only specific APIs                        │
├─────────────────────────────────────────────────────┤
│  Renderer Process (Chromium)                        │
│  - Web UI (React, Vue, etc.)                        │
│  - DOM access                                       │
│  - No direct Node.js API access (security)          │
└─────────────────────────────────────────────────────┘
```

### Main Process

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

  // Dev mode: Load Vite server
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // Production: Load built files
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC: Handle requests from renderer
ipcMain.handle('read-file', async (event, filePath) => {
  const fs = await import('fs/promises');
  return fs.readFile(filePath, 'utf-8');
});
```

### Preload Script

```typescript
// src/preload/index.ts
import { contextBridge, ipcRenderer } from 'electron';

// APIs to safely expose to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Read file
  readFile: (filePath: string) => ipcRenderer.invoke('read-file', filePath),

  // Save file dialog
  saveFile: (content: string) => ipcRenderer.invoke('save-file', content),

  // App version
  getVersion: () => process.env.npm_package_version,

  // Platform
  platform: process.platform,
});

// Type definitions (for use in renderer)
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

### Renderer Process

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

### Creating Menus

```typescript
// src/main/menu.ts
import { Menu, app, shell } from 'electron';

const template: Electron.MenuItemConstructorOptions[] = [
  {
    label: 'File',
    submenu: [
      { label: 'New File', accelerator: 'CmdOrCtrl+N', click: () => {} },
      { label: 'Open', accelerator: 'CmdOrCtrl+O', click: () => {} },
      { type: 'separator' },
      { label: 'Quit', role: 'quit' },
    ],
  },
  {
    label: 'Edit',
    submenu: [
      { label: 'Undo', role: 'undo' },
      { label: 'Redo', role: 'redo' },
      { type: 'separator' },
      { label: 'Cut', role: 'cut' },
      { label: 'Copy', role: 'copy' },
      { label: 'Paste', role: 'paste' },
    ],
  },
  {
    label: 'Help',
    submenu: [
      {
        label: 'Documentation',
        click: () => shell.openExternal('https://docs.example.com'),
      },
    ],
  },
];

// Add macOS app menu
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

### System Tray

```typescript
// src/main/tray.ts
import { Tray, Menu, nativeImage } from 'electron';
import { join } from 'path';

let tray: Tray | null = null;

export function createTray() {
  const icon = nativeImage.createFromPath(join(__dirname, '../../resources/icon.png'));
  tray = new Tray(icon.resize({ width: 16, height: 16 }));

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open', click: () => {} },
    { type: 'separator' },
    { label: 'Quit', role: 'quit' },
  ]);

  tray.setToolTip('My App');
  tray.setContextMenu(contextMenu);
}
```

---

## Tauri Guide

### Project Creation

```bash
# Prerequisite: Rust installation required
# Install from https://rustup.rs

# Create Tauri project
npm create tauri-app my-tauri-app
cd my-tauri-app

# Install dependencies
npm install

# Start development server
npm run tauri dev
```

### Folder Structure

```
my-tauri-app/
├── src/                    # Frontend (React, Vue, etc.)
│   ├── App.tsx
│   └── main.tsx
├── src-tauri/              # Tauri backend (Rust)
│   ├── src/
│   │   ├── main.rs         # Main entry point
│   │   └── lib.rs          # Command definitions
│   ├── tauri.conf.json     # Tauri configuration
│   └── Cargo.toml          # Rust dependencies
├── public/
└── package.json
```

### Command Definition (Rust)

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

### Calling from Frontend

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

## Web vs Desktop Differences

### File System Access

```typescript
// Web: Not possible (user must select directly)
// Desktop: Free access

// Electron
const fs = require('fs');
fs.writeFileSync('/path/to/file.txt', 'content');

// Tauri
await invoke('write_file', { path: '/path/to/file.txt', content: 'content' });
```

### System Integration

```
Things impossible on web but possible on desktop:
- System tray icon
- Global shortcuts
- Native notifications
- Drag and drop (file path access)
- Full clipboard control
- Native menus
```

### Offline Support

```
Web: Requires Service Worker, limited
Desktop: Works offline by default

⚠️ Server integration features must handle offline!
```

---

## Build & Deployment

### Electron Build

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
# Execute build
npm run build:mac
npm run build:win
npm run build:linux
```

### Auto-update

```typescript
// src/main/updater.ts
import { autoUpdater } from 'electron-updater';

autoUpdater.checkForUpdatesAndNotify();

autoUpdater.on('update-available', () => {
  // Notify update available
});

autoUpdater.on('update-downloaded', () => {
  // Restart to apply update
  autoUpdater.quitAndInstall();
});
```

### Tauri Build

```bash
# Build for current platform
npm run tauri build

# Output locations
# macOS: src-tauri/target/release/bundle/dmg/
# Windows: src-tauri/target/release/bundle/msi/
# Linux: src-tauri/target/release/bundle/appimage/
```

---

## Desktop PDCA Checklist

### Phase 1: Schema
```
□ Decide local data storage method (SQLite, JSON file, etc.)
□ Decide if cloud sync is needed
```

### Phase 3: Mockup
```
□ Consider platform-specific UI guidelines (macOS, Windows)
□ Plan keyboard shortcuts
□ Design menu structure
```

### Phase 6: UI
```
□ Support dark/light mode
□ Handle window resizing
□ Handle platform-specific UI differences (window control positions, etc.)
```

### Phase 7: Security
```
□ Don't expose Node.js APIs directly (use contextBridge)
□ Security handling when loading external URLs
□ Encrypt sensitive data storage
```

### Phase 9: Deployment
```
□ Code signing (macOS Notarization, Windows Signing)
□ Set up auto-update
□ App Store submission (if needed)
```

---

## Useful Libraries

### Electron

| Library | Purpose |
|---------|---------|
| electron-store | Local settings/data storage |
| electron-updater | Auto-update |
| electron-log | Logging |
| better-sqlite3 | SQLite database |

### Tauri

| Library | Purpose |
|---------|---------|
| tauri-plugin-store | Settings storage |
| tauri-plugin-sql | SQLite support |
| tauri-plugin-log | Logging |
| tauri-plugin-updater | Auto-update |

---

## Requesting from Claude

### Project Creation
```
"Set up a [app description] app project with Electron + React.
- Use electron-vite
- Support system tray
- Set up auto-update"
```

### Feature Implementation
```
"Implement file open/save functionality.
- Use native file dialogs
- Save recent file list
- Support drag and drop"
```

### Build Configuration
```
"Create electron-builder configuration.
- macOS: DMG + notarization
- Windows: NSIS installer
- Auto-update server integration"
```
