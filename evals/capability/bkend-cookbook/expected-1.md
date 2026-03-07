## Output Quality Criteria for bkend Cookbook Skill

### 1. Tutorial Structure and Step-by-Step Flow
- Follows the common cookbook pattern: Auth setup -> Core CRUD -> Advanced features
- Numbers each step clearly and explains what it accomplishes before showing code
- Builds incrementally (each step works before moving to the next)
- Provides context on why each step matters, not just how to do it
- Estimates complexity level as Beginner and sets appropriate expectations

### 2. Authentication Setup Section
- Walks through email signup endpoint (POST /v1/auth/email/signup)
- Walks through login endpoint (POST /v1/auth/email/signin)
- Explains JWT token storage and usage for subsequent API calls
- Shows how to attach the access token to requests via Authorization header
- Mentions token refresh pattern for handling expired access tokens

### 3. Table Creation with Complete Schema
- Creates the todos table with correct types (String title/description, Boolean completed, Date dueDate, String priority)
- Sets appropriate constraints (required on title, default false on completed)
- Explains each field choice and its purpose in the todo domain
- Uses backend_table_create MCP tool or explains REST equivalent
- Mentions auto-generated fields (id, createdBy, createdAt, updatedAt) and their role

### 4. CRUD Operations with Working Examples
- Provides create todo example with all fields populated
- Shows list todos with default pagination behavior
- Demonstrates update for toggling completed status (PATCH with partial data)
- Shows delete operation with confirmation of what gets removed
- Each operation includes the complete API call with headers, method, and body

### 5. Row Level Security (RLS) Configuration
- Explains the self RBAC group for owner-only access based on createdBy field
- Configures RLS policies so users only see their own todos
- Differentiates between admin (full access), self (owner only), and guest (no access) roles
- Tests the RLS by showing that unauthenticated requests are rejected
- Explains how createdBy is auto-populated by bkend on record creation

### 6. Filtering, Sorting, and Practical Usage
- Demonstrates filtering by completed status ($eq operator on Boolean field)
- Shows filtering by priority level ($eq or $in operator)
- Implements sorting by dueDate (ascending for upcoming deadlines)
- Combines multiple filters in a single query (completed=false AND priority=high)
- Provides a troubleshooting section referencing common errors (401, 403, 404, 409)
