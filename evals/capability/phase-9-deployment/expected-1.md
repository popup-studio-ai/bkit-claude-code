## Expected Output Verification

Following the expected structure and format patterns:

## Deployment Configuration Quality
1. Vercel project configuration (vercel.json) defines build settings, output directory, rewrites, and headers
2. Next.js config (next.config.js) includes production optimizations: image domains, output standalone, compression settings
3. Build command and install command are explicitly configured with proper Node.js version specification
4. Framework preset is correctly set to Next.js with automatic static optimization and ISR configuration where applicable
5. Deployment regions are specified based on target audience geography for edge function placement

## Environment Variables Quality
6. Environment variables are organized by scope: production, preview, and development with clear naming conventions
7. Sensitive values (API keys, database URLs, secrets) are stored in Vercel environment settings, never committed to repository
8. Non-sensitive public variables use NEXT_PUBLIC_ prefix and are documented in .env.example with placeholder values
9. Staging environment mirrors production configuration with separate database and API endpoints clearly identified
10. Environment variable validation runs at build time to fail fast if required variables are missing

## Rollback and CI/CD Quality
11. GitHub Actions workflow defines jobs for lint, test, and deploy with proper dependency ordering and failure gates
12. Deployment workflow triggers on push to main for production and on pull request for preview deployments
13. Rollback strategy documents how to promote a previous deployment to production via Vercel dashboard or CLI (vercel rollback)
14. Health check endpoint (/api/health) validates application startup, database connectivity, and critical service availability
15. Post-deployment smoke tests verify key user flows (homepage load, API response, authentication) before traffic is fully shifted
