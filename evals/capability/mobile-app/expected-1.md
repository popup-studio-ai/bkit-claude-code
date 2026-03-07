## Output Quality Criteria for Mobile App Skill

### 1. Framework Selection and Project Setup
- Recommends Expo with TypeScript as the primary framework (Tier 1)
- Provides correct project creation commands (npx create-expo-app)
- Configures NativeWind/Tailwind CSS for React Native styling
- Sets up proper folder structure following Expo Router conventions

### 2. Navigation Architecture
- Implements tab-based navigation using Expo Router Tabs component
- Defines at least 3 tab screens (Home, Workout, Profile)
- Uses proper _layout.tsx files for both root and tab layouts
- Includes tab bar icons using a vector icon library (e.g., Ionicons)
- Handles stack navigation for sub-screens within tabs

### 3. Platform-Specific Handling
- Uses SafeAreaView or safe area insets for notch and home indicator handling
- Addresses keyboard avoidance for input screens (workout logging form)
- Considers platform differences between iOS and Android UI patterns
- Uses SecureStore (expo-secure-store) for sensitive token storage instead of AsyncStorage
- Handles platform-specific status bar styling

### 4. Component and Code Structure
- Creates reusable components in a components/ directory
- Implements custom hooks (e.g., useApi, useAuth) in a hooks/ directory
- Uses TypeScript interfaces for data models (Workout, UserProfile, DailyStats)
- Applies StyleSheet.create or NativeWind className patterns consistently
- Separates business logic from presentation components

### 5. Data and State Management
- Implements proper state management for fitness data (context or state library)
- Includes API integration patterns with loading and error states
- Handles offline data caching considerations for step count tracking
- Uses environment variables via Expo config for API endpoints
- Provides data model definitions appropriate for fitness tracking domain

### 6. Mobile UX Best Practices
- Includes pull-to-refresh for data lists
- Uses FlatList or ScrollView appropriately for scrollable content
- Implements proper touch targets (minimum 44x44 points)
- Considers gesture-based interactions appropriate for fitness tracking
- Addresses different screen sizes (phone and tablet layouts)
