# PDCA Eval Prompt - Trigger Accuracy and Phase Detection

User request: /pdca plan user-auth

Test trigger accuracy for PDCA phase detection and intent routing.
The user invokes the pdca skill with the "plan" action and "user-auth"
as the feature name. The skill must correctly parse the action argument,
detect the target PDCA phase, and execute the Plan phase workflow.

Context: No existing Plan document for user-auth. A PRD file exists
at docs/00-pm/user-auth.prd.md from a previous /pdca pm run.
The project .bkit-memory.json currently shows phase "pm" for user-auth.
