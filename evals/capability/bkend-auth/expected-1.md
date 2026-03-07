## Output Quality Criteria for bkend Auth Skill

### 1. Auth Endpoint Usage Accuracy
- Uses correct bkend REST endpoints (POST /v1/auth/email/signup, POST /v1/auth/email/signin)
- Uses GET /v1/auth/me for fetching current user profile
- Uses POST /v1/auth/refresh for token refresh with the refresh token
- Uses POST /v1/auth/signout for logout
- Uses POST /v1/auth/password/reset/request and /confirm for password reset flow

### 2. JWT Token Handling
- Explains the dual-token structure (Access Token: 1 hour, Refresh Token: 7 days)
- Implements automatic token refresh before or upon access token expiration
- Stores tokens securely (httpOnly cookies preferred, or secure client-side storage)
- Includes the access token in Authorization header as Bearer token for API calls
- Handles token refresh race conditions (multiple concurrent requests during refresh)

### 3. Password Validation and Security
- Enforces bkend password policy (8+ characters, uppercase, lowercase, numbers, special characters)
- Implements client-side validation matching the server-side policy
- Does not log or expose passwords in error messages or network requests
- Sanitizes user input before sending to auth endpoints
- Mentions RBAC roles (admin, user, self, guest) and their access scopes

### 4. Auth State Management Pattern
- Implements an AuthContext or auth store pattern for React
- Provides signIn, signOut, and getCurrentUser functions
- Persists auth state across page refreshes (checks stored token on app mount)
- Exposes loading and error states for auth operations
- Implements a ProtectedRoute component that checks auth state before rendering

### 5. Error Handling and Edge Cases
- Handles 401 Unauthorized responses by triggering token refresh or redirect to login
- Handles signup errors (duplicate email, weak password, validation failures)
- Handles login errors (wrong credentials, account not found)
- Provides user-friendly error messages for each failure scenario
- Implements session management awareness (GET /v1/auth/sessions)

### 6. Code Quality and Integration
- Generates TypeScript code with proper type definitions for auth responses
- Creates a reusable auth service module separate from UI components
- Uses fetch or axios with interceptors for automatic token attachment
- Follows React patterns (hooks, context) consistent with the user's existing project
- Includes the complete password reset flow with both request and confirmation steps
