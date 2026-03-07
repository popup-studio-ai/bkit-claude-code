Implement file upload and download with presigned URLs using bkend.ai storage.
I have a React application with bkend.ai backend and I need to add
image upload functionality for user profile pictures and post attachments.

Requirements:
1. Single file upload flow for profile pictures (max 10MB, images only)
2. Multiple file upload for post attachments (up to 5 files)
3. Presigned URL generation and direct upload to storage
4. File metadata registration after successful upload
5. Download URLs for both public (CDN) and private (presigned) files
6. Visibility control: profile pictures are public, post attachments are protected
7. A React hook or utility that handles the complete upload lifecycle
   including progress tracking and error handling
