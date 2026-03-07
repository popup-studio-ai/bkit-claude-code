## Output Quality Criteria for bkend Quickstart Skill

### 1. MCP Connection Setup
- Provides the correct MCP add command (claude mcp add bkend --transport http https://api.bkend.ai/mcp)
- Explains the OAuth 2.1 + PKCE authentication flow (browser auto-opens, no API key needed)
- Mentions optional .mcp.json creation for team sharing with correct JSON structure
- Includes troubleshooting tips for common connection issues (popup blocker, re-auth)
- Suggests verifying connection with claude mcp list or get_context tool

### 2. Resource Hierarchy Explanation
- Clearly explains the Organization -> Project -> Environment hierarchy
- Describes that dev environment is auto-created when a project is created
- Differentiates between Tenant (service builder) and User (app end-user) roles
- Mentions environment isolation (dev/staging/prod have separate data)
- Uses the get_context MCP tool to demonstrate current session context

### 3. Project Creation Steps
- Uses backend_project_create MCP tool with correct parameters (organizationId, name)
- Shows how to list organizations first with backend_org_list to get the organizationId
- Verifies project creation with backend_project_get or backend_project_list
- Confirms dev environment existence with backend_env_list
- Sets project description parameter for the "my-blog" project

### 4. Table Creation with Proper Schema
- Uses backend_table_create MCP tool for both posts and comments tables
- Defines correct column types: String for title/content/author/body, Array for tags, Boolean for published
- Applies appropriate constraints (required on title, default false on published)
- Mentions auto-generated system fields (id, createdBy, createdAt, updatedAt)
- Notes that bkend uses "id" not "_id" in API responses

### 5. Step-by-Step Walkthrough Quality
- Presents steps in logical sequential order (connect -> verify -> create project -> create tables)
- Explains what each MCP tool does before invoking it
- Shows expected output or response format after each step
- Does not skip ahead or assume knowledge the user does not have
- Provides clear transition between steps with context of what was accomplished

### 6. Next Steps and Skill Routing
- Mentions bkend-data skill for CRUD operations on the created tables
- Mentions bkend-auth skill for adding authentication later
- Mentions bkend-storage skill for file uploads
- References bkend-cookbook for practical tutorial projects similar to the blog
- Provides the bkend console URL (https://console.bkend.ai) for web-based management
