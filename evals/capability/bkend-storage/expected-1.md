## Output Quality Criteria for bkend Storage Skill

### 1. Presigned URL Upload Flow
- Implements the correct 3-step single file upload flow (presigned URL -> PUT upload -> register metadata)
- Uses POST /v1/files/presigned-url to generate the upload URL with fileId
- Performs PUT request to the presigned URL with file binary and Content-Type header
- Completes upload with POST /v1/files including fileId, filename, contentType, size, and visibility
- Mentions the 15-minute validity window for presigned URLs

### 2. Multiple File Upload Pattern
- Implements sequential or parallel upload for multiple files (up to 5 attachments)
- Generates individual presigned URLs for each file
- Tracks upload status per file (pending, uploading, completed, failed)
- Registers metadata for each file after successful PUT upload
- Handles partial failure gracefully (some files succeed, others fail)

### 3. Visibility Control Implementation
- Correctly differentiates between 4 visibility levels (public, private, protected, shared)
- Sets profile pictures to "public" visibility for CDN URL access without expiry
- Sets post attachments to "protected" visibility requiring authentication
- Explains that private files generate presigned download URLs with 1-hour expiry
- Uses POST /v1/files/:fileId/download-url for generating download URLs

### 4. Size and Type Validation
- Enforces 10MB limit for image uploads matching bkend's image category limit
- Validates file MIME type is an image type before uploading profile pictures
- References bkend size limits (images 10MB, videos 100MB, documents 20MB)
- Implements client-side validation before requesting presigned URL
- Provides clear error messages for size and type violations

### 5. React Integration and Developer Experience
- Creates a reusable upload hook or utility function with TypeScript types
- Exposes upload progress, loading state, error state, and result
- Handles the complete lifecycle (select -> validate -> upload -> register -> return URL)
- Uses proper async/await patterns with error handling at each step
- Returns the final file URL (CDN for public, presigned for protected) after completion

### 6. Download URL Handling
- Generates CDN URLs for public files (no expiry, direct access)
- Generates presigned download URLs for protected/private files via POST /v1/files/:fileId/download-url
- Explains when to use each URL type based on the file's visibility setting
- Includes the download URL in the component that displays the uploaded file
- Handles expired presigned URLs by regenerating them when needed
