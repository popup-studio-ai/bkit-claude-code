# Zero Script QA Expected Output - Process Steps

## Step 1: Trigger Detection and Environment Validation
1. Detect trigger keywords: "Docker logs", "verify", absence of "test scripts"
2. Activate zero-script-qa skill for log-based testing methodology
3. Invoke qa-monitor agent for real-time log analysis
4. Fork context to isolate QA session from main development context
5. Validate Docker Compose configuration exists with api and web services

## Step 2: Logging Infrastructure Verification
6. Verify JSON log format is applied in backend logging middleware
7. Verify required log fields are present: timestamp, level, service, request_id, message, data
8. Verify Request ID generation at API entry point (X-Request-ID header)
9. Verify Request ID propagation across service boundaries
10. Check log level policy: DEBUG for local/staging, INFO for production

## Step 3: Start Real-Time Monitoring
11. Guide user to start Docker environment: docker compose up -d
12. Start log streaming: docker compose logs -f
13. Filter for notification API service logs specifically
14. Set up issue detection thresholds:
    - Critical: level ERROR or status 5xx or duration > 3000ms
    - Warning: status 401/403 or duration > 1000ms
    - Info: missing log fields or missing request_id propagation

## Step 4: Manual UX Testing and Log Analysis
15. Request user to perform manual UX testing of notification feature in browser
16. Monitor log stream in real-time during user testing
17. Track each request flow end-to-end using Request ID correlation
18. Detect error patterns: consecutive failures, abnormal status codes
19. Detect performance issues: slow responses exceeding 1000ms threshold

## Step 5: Issue Documentation and Iterative Cycle
20. Document each discovered issue with Request ID, severity, reproduction path, and log excerpt
21. Generate QA Issue Report following the documentation template
22. Provide fix suggestions for each identified issue
23. Track pass rate across iterative test cycles (target: >85%)
24. Record cycle results: Cycle N -> Bug Found -> Fix Applied -> New Pass Rate
