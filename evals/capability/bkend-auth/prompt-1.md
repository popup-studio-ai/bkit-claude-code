Implement email signup, login, and JWT token management using bkend.ai.
I have an existing React frontend project and a bkend.ai backend already set up
with MCP connected. I need to add complete authentication to my application.

Requirements:
1. Email/password signup with proper validation (8+ chars, uppercase, lowercase, numbers, special chars)
2. Email/password login that returns JWT tokens
3. Token storage and automatic refresh when the access token expires
4. A getCurrentUser function that fetches the authenticated user profile
5. Protected route wrapper that redirects unauthenticated users to login
6. Logout functionality that clears tokens and session
7. Password reset flow (request reset email and confirm with new password)

Please use the bkend.ai REST auth endpoints and follow security best practices.
