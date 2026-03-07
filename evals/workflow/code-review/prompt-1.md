# Code Review Eval Prompt - Trigger for Intent Detection

User request: Review this PR for security issues and potential bugs.
The PR modifies authentication logic in src/lib/auth.ts and adds
a new API endpoint at src/api/users/route.ts.

Test trigger for code review intent detection when the user mentions
"review", "PR", and "security issues" as keywords. The skill should
activate a comprehensive code review covering security, bug detection,
code quality, and performance analysis using the code-analyzer agent.

Context: The PR contains changes to 4 files. CONVENTIONS.md exists
at project root. The project uses TypeScript with strict mode enabled.
