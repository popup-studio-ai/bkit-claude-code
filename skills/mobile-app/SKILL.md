---
name: mobile-app
description: |
  Mobile app development guide for cross-platform apps.
  Covers React Native, Flutter, and Expo frameworks.

  Use proactively when user wants to build mobile apps or convert web apps to mobile.

  Triggers: mobile app, React Native, Flutter, Expo, iOS, Android, 모바일 앱, モバイルアプリ, 移动应用,
  aplicación móvil, app móvil, desarrollo móvil,
  application mobile, développement mobile,
  mobile Anwendung, mobile App, mobile Entwicklung,
  applicazione mobile, app mobile, sviluppo mobile

  Do NOT use for: web-only projects, backend-only development, or desktop apps.
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

# Mobile App Development Expertise

## Overview

A guide for developing mobile apps based on web development experience.
Develop for iOS and Android simultaneously using cross-platform frameworks.

---

## Framework Selection Guide

### Framework Selection by Tier (v1.3.0)

| Framework | Tier | Recommendation | Use Case |
|-----------|------|----------------|----------|
| **React Native (Expo)** | Tier 1 | ⭐ Primary | TypeScript ecosystem, AI tools |
| **React Native CLI** | Tier 1 | Recommended | Native module needs |
| **Flutter** | Tier 2 | Supported | Multi-platform (6 OS), performance |

> **AI-Native Recommendation**: React Native with TypeScript
> - Full Copilot/Claude support
> - Extensive npm ecosystem
> - 20:1 developer availability vs Dart

> **Performance Recommendation**: Flutter
> - Impeller rendering engine
> - Single codebase for 6 platforms
> - Smaller bundles

### Level-wise Recommendations

```
Starter → Expo (React Native) [Tier 1]
  - Simple setup, can leverage web knowledge
  - Full AI tool support

Dynamic → Expo + EAS Build [Tier 1] or Flutter [Tier 2]
  - Includes server integration, production build support
  - Choose Flutter for multi-platform needs

Enterprise → React Native CLI [Tier 1] or Flutter [Tier 2]
  - Complex native features, performance optimization needed
  - Flutter for consistent cross-platform UI
```

---

## Expo (React Native) Guide

### Project Creation

```bash
# Install Expo CLI
npm install -g expo-cli

# Create new project
npx create-expo-app my-app
cd my-app

# Start development server
npx expo start
```

### Folder Structure

```
my-app/
├── app/                    # Expo Router pages
│   ├── (tabs)/            # Tab navigation
│   │   ├── index.tsx      # Home tab
│   │   ├── explore.tsx    # Explore tab
│   │   └── _layout.tsx    # Tab layout
│   ├── _layout.tsx        # Root layout
│   └── +not-found.tsx     # 404 page
├── components/            # Reusable components
├── hooks/                 # Custom hooks
├── constants/             # Constants
├── assets/               # Images, fonts, etc.
├── app.json              # Expo configuration
└── package.json
```

### Navigation Patterns

```typescript
// app/_layout.tsx - Stack navigation
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
```

```typescript
// app/(tabs)/_layout.tsx - Tab navigation
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Ionicons name="home" color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Ionicons name="person" color={color} size={24} />,
        }}
      />
    </Tabs>
  );
}
```

### Styling Patterns

```typescript
// Basic StyleSheet
import { StyleSheet, View, Text } from 'react-native';

export function MyComponent() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hello</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});
```

```typescript
// NativeWind (Tailwind for RN) - Recommended
import { View, Text } from 'react-native';

export function MyComponent() {
  return (
    <View className="flex-1 p-4 bg-white">
      <Text className="text-2xl font-bold">Hello</Text>
    </View>
  );
}
```

### API Integration

```typescript
// hooks/useApi.ts
import { useState, useEffect } from 'react';

export function useApi<T>(endpoint: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}${endpoint}`);
        if (!response.ok) throw new Error('API Error');
        const json = await response.json();
        setData(json);
      } catch (e) {
        setError(e as Error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [endpoint]);

  return { data, loading, error };
}
```

### Authentication Pattern

```typescript
// context/AuthContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

interface AuthContextType {
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check for stored token on app start
    const loadToken = async () => {
      const token = await SecureStore.getItemAsync('authToken');
      if (token) {
        // Load user info with token
      }
    };
    loadToken();
  }, []);

  const signIn = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const { token, user } = await response.json();
    await SecureStore.setItemAsync('authToken', token);
    setUser(user);
  };

  const signOut = async () => {
    await SecureStore.deleteItemAsync('authToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext)!;
```

---

## Flutter Guide

### Project Creation

```bash
# After installing Flutter SDK
flutter create my_app
cd my_app

# Start development server
flutter run
```

### Folder Structure

```
my_app/
├── lib/
│   ├── main.dart           # App entry point
│   ├── app/
│   │   ├── app.dart        # MaterialApp setup
│   │   └── routes.dart     # Route definitions
│   ├── features/           # Feature-based folders
│   │   ├── auth/
│   │   │   ├── screens/
│   │   │   ├── widgets/
│   │   │   └── providers/
│   │   └── home/
│   ├── shared/
│   │   ├── widgets/        # Common widgets
│   │   ├── services/       # API services
│   │   └── models/         # Data models
│   └── core/
│       ├── theme/          # Theme settings
│       └── constants/      # Constants
├── assets/                 # Images, fonts
├── pubspec.yaml           # Dependency management
└── android/ & ios/        # Native code
```

### Basic Widget Patterns

```dart
// lib/features/home/screens/home_screen.dart
import 'package:flutter/material.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Home'),
      ),
      body: const Center(
        child: Text('Hello, Flutter!'),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {},
        child: const Icon(Icons.add),
      ),
    );
  }
}
```

### State Management (Riverpod)

```dart
// lib/providers/counter_provider.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';

final counterProvider = StateNotifierProvider<CounterNotifier, int>((ref) {
  return CounterNotifier();
});

class CounterNotifier extends StateNotifier<int> {
  CounterNotifier() : super(0);

  void increment() => state++;
  void decrement() => state--;
}
```

```dart
// Usage
class CounterScreen extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final count = ref.watch(counterProvider);

    return Text('Count: $count');
  }
}
```

---

## Web vs Mobile Differences

### UI/UX Differences

| Element | Web | Mobile |
|---------|-----|--------|
| Click | onClick | onPress |
| Scroll | overflow: scroll | ScrollView / FlatList |
| Input | input | TextInput |
| Links | a href | Link / navigation |
| Layout | div + CSS | View + StyleSheet |

### Navigation Differences

```
Web: URL-based (browser back button)
Mobile: Stack-based (screen stacking)

Web: /users/123
Mobile: navigation.navigate('User', { id: 123 })
```

### Storage Differences

```
Web: localStorage, sessionStorage, Cookie
Mobile: AsyncStorage, SecureStore, SQLite

⚠️ SecureStore is required for sensitive info on mobile!
```

---

## Build & Deployment

### Expo EAS Build

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Configure build
eas build:configure

# iOS build
eas build --platform ios

# Android build
eas build --platform android

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

### Environment Variables

```json
// app.json
{
  "expo": {
    "extra": {
      "apiUrl": "https://api.example.com"
    }
  }
}
```

```typescript
// Usage
import Constants from 'expo-constants';

const apiUrl = Constants.expoConfig?.extra?.apiUrl;
```

---

## Mobile PDCA Checklist

### Phase 1: Schema
```
□ Identify data that needs offline caching
□ Define sync conflict resolution strategy
```

### Phase 3: Mockup
```
□ Follow iOS/Android native UX guidelines
□ Consider gestures (swipe, pinch, etc.)
□ Layout for different screen sizes (phone, tablet)
```

### Phase 6: UI
```
□ Keyboard handling (screen adjustment during input)
□ Safe Area handling (notch, home button area)
□ Handle platform-specific UI differences
```

### Phase 7: Security
```
□ Store sensitive info with SecureStore
□ Certificate Pinning (if needed)
□ App obfuscation settings
```

### Phase 9: Deployment
```
□ Follow App Store review guidelines
□ Prepare Privacy Policy URL
□ Prepare screenshots, app description
```

---

## Frequently Asked Questions

### Q: Can I convert a web project to an app?
```
A: Recommend separate project over full conversion
   - APIs can be shared
   - UI needs to be rewritten (for native UX)
   - Business logic can be shared
```

### Q: Should I use Expo or React Native CLI?
```
A: Start with Expo!
   - 90%+ of apps are sufficient with Expo
   - Can eject later if needed
   - Use CLI only when native modules are absolutely required
```

### Q: How long does app review take?
```
A:
   - iOS: 1-7 days (average 2-3 days)
   - Android: Few hours ~ 3 days

   ⚠️ First submission has high rejection possibility → Follow guidelines carefully!
```

---

## Requesting from Claude

### Project Creation
```
"Set up a [app description] app project with React Native + Expo.
Configure with 3 tab navigation (Home, Search, Profile)."
```

### Screen Implementation
```
"Implement [screen name] screen.
- Display [content] at the top
- Display [list/form/etc.] in the middle
- [Button/navigation] at the bottom"
```

### API Integration
```
"Implement screen integrating with [API endpoint].
- Show loading state
- Handle errors
- Support pull-to-refresh"
```
