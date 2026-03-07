# Zero Script QA Eval Prompt - Trigger Keyword Matching

User request to verify the notification API feature by analyzing
Docker logs instead of writing test scripts. The project uses
Docker Compose with a FastAPI backend and Next.js frontend.

Test trigger keyword matching for the zero-script-qa skill. The
skill should detect the intent from keywords like "Docker logs"
and "verify" without explicit test script references. It should
activate log-based QA methodology with real-time monitoring.

Context: docker-compose.yml exists with api and web services.
JSON logging middleware is already implemented in the backend.
Request ID propagation is configured via X-Request-ID headers.
