---
name: bkend-cookbook
description: |
  bkend.ai practical project tutorials and troubleshooting guide.
  Covers 10 single-project guides (todo to SaaS) and 4 full-guide projects
  (blog, recipe-app, shopping-mall, social-network) with step-by-step implementation.
  Also includes common error solutions and FAQ.

  Triggers: cookbook, tutorial, example project, todo app, blog app, shopping mall,
  쿡북, 튜토리얼, 예제, 블로그, 쇼핑몰, 투두, 프로젝트 만들기,
  クックブック, チュートリアル, 例題, ブログ, ショッピング,
  食谱, 教程, 示例, 博客, 商城,
  libro de cocina, tutorial, ejemplo, blog, tienda,
  livre de recettes, tutoriel, exemple, blog, boutique,
  Kochbuch, Tutorial, Beispiel, Blog, Shop,
  ricettario, tutorial, esempio, blog, negozio

  Do NOT use for: API reference details (use bkend-data/auth/storage),
  platform management (use bkend-quickstart).
user-invocable: false
agent: bkit:bkend-expert
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - mcp__bkend__*
imports:
  - ${PLUGIN_ROOT}/templates/shared/bkend-patterns.md
---

# bkend.ai Cookbook & Troubleshooting

## Single Project Guides

| Project | Level | Key Features |
|---------|-------|-------------|
| Todo App | Beginner | Basic CRUD, state management |
| Note App | Beginner | Rich text, categories |
| Blog | Intermediate | Posts, tags, file upload |
| Chat App | Intermediate | Real-time messaging |
| E-commerce | Intermediate | Products, orders, payments |
| Booking System | Intermediate | Reservations, calendar |
| Social Feed | Advanced | Posts, follows, feeds |
| Dashboard | Advanced | Charts, analytics, roles |
| Multi-tenant | Advanced | Organization-scoped data |
| SaaS Starter | Advanced | Subscriptions, billing, onboarding |

## Full Guide Projects (4, each with quick-start + 7 chapters)

| Project | Auth | Core CRUD | Files | Advanced | AI |
|---------|------|-----------|-------|----------|-----|
| Blog | Email/Social | Articles, Tags | Images | Bookmarks | AI summary |
| Recipe App | Email/Social | Recipes, Ingredients | Photos | Meal Plan, Shopping List | AI recommendations |
| Shopping Mall | Email/Social | Stores, Products, Orders | Product images | Reviews | AI search |
| Social Network | Email/Social | Profiles, Posts | Media | Follows, Feeds | AI recommendations |

## Common Implementation Pattern

```
1. Auth setup (email + social login)
2. Core CRUD (main data tables)
3. File upload (images/media)
4. Advanced features (search, filters, relationships)
5. AI integration (recommendations, summaries)
6. Troubleshooting & optimization
```

## Troubleshooting Quick Reference

| Error | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | Token expired | POST /v1/auth/refresh |
| 403 Forbidden | Insufficient permissions | Check RBAC settings |
| 404 Not Found | Wrong path/ID | Verify endpoint and environment |
| 409 Conflict | Unique field duplicate | Check duplicate data |
| 429 Rate Limit | Request limit exceeded (100/h) | Check Retry-After header |
| CORS Error | Domain not registered | Register in bkend console |
| MCP Connection Failed | OAuth incomplete | Complete browser auth |
| Schema Validation | BSON type mismatch | Check schema with backend_table_get |

## FAQ

| Question | Answer |
|----------|--------|
| Table not visible | Check environment (dev/staging/prod) |
| MCP tools not showing | Run `claude mcp list` to verify connection |
| Social login not working | Check Provider settings in console |
| File upload fails | Verify size limits (image 10MB, video 100MB) |
| Slow queries | Add indexes via backend_index_manage |
| Data not syncing | Check x-environment header matches |

## Official Documentation (Live Reference)

For the latest cookbook and troubleshooting, use WebFetch:
- Cookbooks: https://raw.githubusercontent.com/popup-studio-ai/bkend-docs/main/en/cookbooks/blog/01-quick-start.md
- Troubleshooting: https://raw.githubusercontent.com/popup-studio-ai/bkend-docs/main/en/troubleshooting/01-common-errors.md
- Full TOC: https://raw.githubusercontent.com/popup-studio-ai/bkend-docs/main/SUMMARY.md
