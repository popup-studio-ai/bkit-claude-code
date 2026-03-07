## Output Quality Criteria for bkend Data Skill

### 1. Table Schema Design
- Creates products table with correct column types (String for name/description/imageUrl, Number for price, Array for tags, Boolean for inStock)
- Creates categories table with String fields and self-referential parentCategory
- Applies appropriate constraints (required on name/price, unique on category slug)
- Uses backend_table_create MCP tool with proper parameters
- Acknowledges auto-generated system fields (id, createdBy, createdAt, updatedAt)

### 2. CRUD Operations Implementation
- Uses correct REST endpoints (POST /v1/data/{table}, GET /v1/data/{table}/{id}, PATCH, DELETE)
- Alternatively uses MCP tools (backend_data_create, backend_data_get, backend_data_update, backend_data_delete)
- Shows data parameter structure with field:value pairs for create and update
- Includes organizationId, projectId, environmentId context from get_context
- Handles partial updates with PATCH (only sends changed fields)

### 3. Filtering and Query Patterns
- Demonstrates AND filter syntax for combining category + inStock conditions
- Uses comparison operators correctly ($gt/$lt for price range, $eq for category, $in for tags)
- Shows text search using the ?search=keyword query parameter
- Combines multiple filter types in a single query (AND filters + search)
- References the 8 available operators ($eq, $ne, $gt, $gte, $lt, $lte, $in, $nin)

### 4. Sorting and Pagination
- Implements sorting with ?sort=field:asc|desc syntax (price:asc, createdAt:desc)
- Configures pagination with ?page=1&limit=20 parameters
- Mentions default limit (20) and maximum limit (100) constraints
- Shows how to implement page navigation using total count from response
- Handles edge cases (empty results, last page with fewer items)

### 5. Index Management for Performance
- Uses backend_index_manage MCP tool to create indexes
- Creates indexes on frequently queried fields (category, price, inStock)
- Considers compound indexes for common query combinations (category + price)
- Explains why indexes improve query performance for the specified filters
- Mentions schema version tracking via backend_schema_version_list

### 6. Code Organization and API Patterns
- Generates a reusable data service module with typed functions for each operation
- Uses TypeScript interfaces for Product and Category data models
- Implements error handling for API responses (404, 409, validation errors)
- Separates query building logic from API call execution
- Provides examples that can be directly integrated into a frontend application
