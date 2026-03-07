## Output Quality Criteria for Desktop App Skill

### 1. Electron Architecture and Process Separation
- Correctly separates main process, preload script, and renderer process
- Main process handles file system operations, window management, and native dialogs
- Preload script uses contextBridge.exposeInMainWorld for secure API exposure
- Renderer process uses only the exposed electronAPI, never direct Node.js access
- Implements proper IPC communication (ipcMain.handle / ipcRenderer.invoke)

### 2. IPC Communication Design
- Defines IPC channels for file operations (read-file, write-file, open-dialog, save-dialog)
- Uses invoke/handle pattern (not send/on) for request-response operations
- Types the electronAPI interface with TypeScript declarations in the preload script
- Handles IPC errors gracefully with try-catch in both main and renderer
- Keeps IPC surface area minimal, exposing only necessary operations

### 3. Native Feature Integration
- Implements native file open/save dialogs using Electron dialog module
- Creates application menus with platform-aware structure (macOS app menu prepended)
- Adds system tray with context menu including new file, open recent, and quit
- Registers global or local keyboard shortcuts (CmdOrCtrl+S, CmdOrCtrl+O, etc.)
- Handles window lifecycle events (close, minimize, restore from tray)

### 4. Project Structure and Build Configuration
- Uses electron-vite with proper folder structure (src/main, src/preload, src/renderer)
- Configures electron-builder.yml for macOS (dmg) and Windows (nsis) targets
- Sets up proper app icons for both platforms (icns and ico)
- Includes auto-updater configuration or mentions it as a next step
- Uses environment-aware loading (Vite dev server vs built files)

### 5. Platform-Specific Handling
- Handles macOS-specific behaviors (app menu, dock, window-all-closed stays running)
- Handles Windows-specific behaviors (tray minimize, single instance lock)
- Applies platform-conditional code using process.platform checks
- Supports dark/light theme with system preference detection (nativeTheme)
- Positions window controls correctly per platform conventions

### 6. Security Best Practices
- Disables nodeIntegration in webPreferences (default in modern Electron)
- Enables contextIsolation (default in modern Electron)
- Does not expose fs, path, or other Node.js modules directly to renderer
- Validates file paths and user input before file system operations
- Sets appropriate Content-Security-Policy headers for the renderer
