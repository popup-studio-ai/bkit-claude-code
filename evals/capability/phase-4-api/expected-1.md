## Expected Output Verification

Following the expected structure and format patterns:

## OpenAPI Specification Quality
1. API spec follows OpenAPI 3.0+ format or equivalent structured documentation with base URL, versioning (v1), and content types
2. All endpoints use proper HTTP methods (GET for reads, POST for creation, PUT/PATCH for updates, DELETE for removals)
3. Request and response schemas are defined with field types, required fields, and example values for every endpoint
4. Authentication scheme is documented (Bearer token, OAuth2, or API key) with security applied to protected endpoints
5. API versioning strategy is stated (URL path /api/v1/ or header-based) with backward compatibility notes

## Endpoint Design Quality
6. Feed endpoint (GET /feed) implements cursor-based pagination with cursor, limit, and hasMore fields in the response
7. Post creation endpoint (POST /posts) accepts multipart or JSON body with text, media URLs, and hashtag array
8. Filter parameters on feed endpoint support query strings: hashtag, startDate, endDate, mediaType with proper validation
9. Social interaction endpoints follow sub-resource patterns (POST /posts/{id}/likes, POST /posts/{id}/comments, POST /posts/{id}/shares)
10. Follow/unfollow endpoints use proper resource modeling (POST /users/{id}/follow, DELETE /users/{id}/follow)

## Error Handling Quality
11. Error response format is consistent across all endpoints with fields: error code, message, details array, and request ID
12. HTTP 400 responses include field-level validation errors with specific messages per invalid field
13. HTTP 401 and 403 are distinguished (unauthenticated vs unauthorized) with clear descriptions
14. HTTP 404 is returned for non-existent resources with the resource type and ID in the error message
15. Rate limiting headers (X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset) are documented with 429 response format
