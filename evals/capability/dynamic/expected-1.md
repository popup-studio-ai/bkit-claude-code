## Expected Output Verification

Following the expected structure and format patterns:

## Project Structure Quality
1. Follows Next.js App Router convention with app/ directory containing layout.tsx and page.tsx
2. Separates concerns into logical folders (components/, lib/, types/, hooks/)
3. TypeScript is configured with strict mode enabled in tsconfig.json
4. Tailwind CSS is properly configured with tailwind.config.ts and globals.css
5. Environment variables are defined in .env.example with clear naming (NEXT_PUBLIC_BKEND_*, etc.)

## Authentication Integration Quality
6. bkend.ai SDK is imported and initialized with proper configuration
7. Auth flow includes registration with email/password and login with session token handling
8. Protected routes use middleware.ts or route-level auth checks to redirect unauthenticated users
9. Session state is managed via React context or cookies with proper expiration handling
10. Logout functionality clears session data and redirects to the login page

## API Routes and Data Quality
11. API routes under app/api/ follow RESTful conventions (GET, POST, PUT, DELETE for tasks)
12. Task schema includes id, title, description, priority (enum), dueDate, status, and userId fields
13. Input validation is applied on both client forms and API route handlers
14. Error responses use consistent JSON structure with status codes (400, 401, 404, 500)
15. Dashboard page fetches tasks filtered by the authenticated user with loading and error states
