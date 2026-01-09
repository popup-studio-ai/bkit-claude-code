---
name: mobile-app
description: |
  Mobile app development guide for cross-platform apps.
  Covers React Native, Flutter, and Expo frameworks.

  Triggers: mobile app, React Native, Flutter, Expo, iOS, Android, 모바일 앱, モバイルアプリ, 移动应用
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

# 모바일 앱 개발 전문 지식

## 개요

웹 개발 경험을 바탕으로 모바일 앱을 개발하는 가이드입니다.
크로스플랫폼 프레임워크를 활용하여 iOS와 Android를 동시에 개발합니다.

---

## 프레임워크 선택 가이드

### 추천 프레임워크

| 프레임워크 | 추천 대상 | 장점 | 단점 |
|-----------|----------|------|------|
| **Expo (React Native)** | 웹 개발자, 빠른 출시 | React 지식 활용, 빠른 개발 | 네이티브 모듈 제한 |
| **React Native CLI** | 복잡한 앱, 네이티브 통합 | 완전한 네이티브 접근 | 설정 복잡 |
| **Flutter** | 고성능 UI, 새로 배울 의향 | 빠른 렌더링, 일관된 UI | Dart 학습 필요 |

### 레벨별 추천

```
Starter → Expo (React Native)
  - 설정이 간단하고 웹 지식 활용 가능

Dynamic → Expo + EAS Build
  - 서버 연동 포함, 프로덕션 빌드 지원

Enterprise → React Native CLI 또는 Flutter
  - 복잡한 네이티브 기능, 성능 최적화 필요
```

---

## Expo (React Native) 가이드

### 프로젝트 생성

```bash
# Expo CLI 설치
npm install -g expo-cli

# 새 프로젝트 생성
npx create-expo-app my-app
cd my-app

# 개발 서버 시작
npx expo start
```

### 폴더 구조

```
my-app/
├── app/                    # Expo Router 페이지
│   ├── (tabs)/            # 탭 네비게이션
│   │   ├── index.tsx      # 홈 탭
│   │   ├── explore.tsx    # 탐색 탭
│   │   └── _layout.tsx    # 탭 레이아웃
│   ├── _layout.tsx        # 루트 레이아웃
│   └── +not-found.tsx     # 404 페이지
├── components/            # 재사용 컴포넌트
├── hooks/                 # 커스텀 훅
├── constants/             # 상수
├── assets/               # 이미지, 폰트 등
├── app.json              # Expo 설정
└── package.json
```

### 네비게이션 패턴

```typescript
// app/_layout.tsx - 스택 네비게이션
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
// app/(tabs)/_layout.tsx - 탭 네비게이션
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: '홈',
          tabBarIcon: ({ color }) => <Ionicons name="home" color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '프로필',
          tabBarIcon: ({ color }) => <Ionicons name="person" color={color} size={24} />,
        }}
      />
    </Tabs>
  );
}
```

### 스타일링 패턴

```typescript
// 기본 StyleSheet
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
// NativeWind (Tailwind for RN) - 추천
import { View, Text } from 'react-native';

export function MyComponent() {
  return (
    <View className="flex-1 p-4 bg-white">
      <Text className="text-2xl font-bold">Hello</Text>
    </View>
  );
}
```

### API 연동

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

### 인증 패턴

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
    // 앱 시작 시 저장된 토큰 확인
    const loadToken = async () => {
      const token = await SecureStore.getItemAsync('authToken');
      if (token) {
        // 토큰으로 사용자 정보 로드
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

## Flutter 가이드

### 프로젝트 생성

```bash
# Flutter SDK 설치 후
flutter create my_app
cd my_app

# 개발 서버 시작
flutter run
```

### 폴더 구조

```
my_app/
├── lib/
│   ├── main.dart           # 앱 진입점
│   ├── app/
│   │   ├── app.dart        # MaterialApp 설정
│   │   └── routes.dart     # 라우트 정의
│   ├── features/           # 기능별 폴더
│   │   ├── auth/
│   │   │   ├── screens/
│   │   │   ├── widgets/
│   │   │   └── providers/
│   │   └── home/
│   ├── shared/
│   │   ├── widgets/        # 공용 위젯
│   │   ├── services/       # API 서비스
│   │   └── models/         # 데이터 모델
│   └── core/
│       ├── theme/          # 테마 설정
│       └── constants/      # 상수
├── assets/                 # 이미지, 폰트
├── pubspec.yaml           # 의존성 관리
└── android/ & ios/        # 네이티브 코드
```

### 기본 위젯 패턴

```dart
// lib/features/home/screens/home_screen.dart
import 'package:flutter/material.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('홈'),
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

### 상태관리 (Riverpod)

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
// 사용
class CounterScreen extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final count = ref.watch(counterProvider);

    return Text('Count: $count');
  }
}
```

---

## 웹 vs 모바일 차이점

### UI/UX 차이

| 요소 | 웹 | 모바일 |
|-----|-----|------|
| 클릭 | onClick | onPress |
| 스크롤 | overflow: scroll | ScrollView / FlatList |
| 입력 | input | TextInput |
| 링크 | a href | Link / navigation |
| 레이아웃 | div + CSS | View + StyleSheet |

### 네비게이션 차이

```
웹: URL 기반 (브라우저 뒤로가기)
모바일: 스택 기반 (화면 쌓기)

웹: /users/123
모바일: navigation.navigate('User', { id: 123 })
```

### 저장소 차이

```
웹: localStorage, sessionStorage, Cookie
모바일: AsyncStorage, SecureStore, SQLite

⚠️ 모바일은 민감정보에 SecureStore 사용 필수!
```

---

## 빌드 & 배포

### Expo EAS Build

```bash
# EAS CLI 설치
npm install -g eas-cli

# 로그인
eas login

# 빌드 설정
eas build:configure

# iOS 빌드
eas build --platform ios

# Android 빌드
eas build --platform android

# 스토어 제출
eas submit --platform ios
eas submit --platform android
```

### 환경변수

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
// 사용
import Constants from 'expo-constants';

const apiUrl = Constants.expoConfig?.extra?.apiUrl;
```

---

## 모바일 PDCA 체크리스트

### Phase 1: 스키마
```
□ 오프라인 캐싱이 필요한 데이터 식별
□ 동기화 충돌 해결 전략 정의
```

### Phase 3: 목업
```
□ iOS/Android 네이티브 UX 가이드라인 준수
□ 제스처 (스와이프, 핀치 등) 고려
□ 화면 크기별 레이아웃 (폰, 태블릿)
```

### Phase 6: UI
```
□ 키보드 처리 (입력 시 화면 조정)
□ Safe Area 처리 (노치, 홈버튼 영역)
□ 플랫폼별 UI 차이 처리
```

### Phase 7: 보안
```
□ SecureStore로 민감정보 저장
□ Certificate Pinning (필요시)
□ 앱 난독화 설정
```

### Phase 9: 배포
```
□ 앱스토어 심사 가이드라인 준수
□ 개인정보처리방침 URL 준비
□ 스크린샷, 앱 설명 준비
```

---

## 자주 묻는 질문

### Q: 웹 프로젝트를 앱으로 전환할 수 있나요?
```
A: 완전 전환보다는 별도 프로젝트 추천
   - API는 공유 가능
   - UI는 새로 작성 필요 (네이티브 UX 위해)
   - 비즈니스 로직은 공유 가능
```

### Q: Expo vs React Native CLI 어떤 걸 써야 하나요?
```
A: 시작은 Expo로!
   - 90% 이상의 앱은 Expo로 충분
   - 나중에 필요하면 eject 가능
   - 네이티브 모듈이 반드시 필요할 때만 CLI
```

### Q: 앱 심사는 얼마나 걸리나요?
```
A:
   - iOS: 1-7일 (평균 2-3일)
   - Android: 몇 시간 ~ 3일

   ⚠️ 첫 제출은 리젝 가능성 높음 → 가이드라인 꼼꼼히!
```

---

## Claude에게 요청하기

### 프로젝트 생성
```
"React Native + Expo로 [앱 설명] 앱 프로젝트 세팅해줘.
탭 네비게이션 3개 (홈, 검색, 프로필)로 구성해줘."
```

### 화면 구현
```
"[화면명] 화면 구현해줘.
- 상단에 [내용] 표시
- 중간에 [리스트/폼/등] 표시
- 하단에 [버튼/네비게이션]"
```

### API 연동
```
"[API 엔드포인트]와 연동되는 화면 구현해줘.
- 로딩 상태 표시
- 에러 처리
- 풀 리프레시 지원"
```
