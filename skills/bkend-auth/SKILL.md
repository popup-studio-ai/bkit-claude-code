---
name: bkend-auth
description: |
  bkend.ai authentication and security expert skill.
  Covers email signup/login, social login (Google, GitHub), magic link,
  JWT tokens (Access 1h, Refresh 7d), session management, RBAC (admin/user/self/guest),
  RLS policies, password management, and account lifecycle.

  Triggers: signup, login, JWT, session, social login, RBAC, RLS, password, token,
  회원가입, 로그인, 토큰, 세션, 권한, 보안정책, 비밀번호,
  ログイン, 認証, セッション, 権限, パスワード,
  登录, 认证, 会话, 权限, 密码,
  registro, inicio de sesion, permisos, contrasena,
  inscription, connexion, permissions, mot de passe,
  Registrierung, Anmeldung, Berechtigungen, Passwort,
  registrazione, accesso, permessi, password

  Do NOT use for: database CRUD (use bkend-data), file storage (use bkend-storage),
  enterprise-level security architecture (use security-architect).
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

# bkend.ai Authentication & Security Guide

## Auth Methods

| Method | Description |
|--------|-------------|
| Email + Password | Email/password signup and login |
| Social (Google) | OAuth 2.0 social login |
| Social (GitHub) | OAuth 2.0 social login |
| Magic Link | Email link login (no password) |

## JWT Token Structure

- **Access Token**: 1 hour validity
- **Refresh Token**: 7 days validity
- Auto-refresh: `POST /v1/auth/refresh`

## Password Policy

8+ characters, uppercase + lowercase + numbers + special characters

## MCP Auth Tools

| Tool | Purpose |
|------|---------|
| 3_howto_implement_auth | Authentication implementation patterns |
| 6_code_examples_auth | Authentication code examples |

## REST Auth API (18 endpoints)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /v1/auth/email/signup | Sign up |
| POST | /v1/auth/email/signin | Sign in |
| GET | /v1/auth/me | Current user |
| POST | /v1/auth/refresh | Refresh token |
| POST | /v1/auth/signout | Sign out |
| GET | /v1/auth/{provider}/authorize | Social login URL |
| POST | /v1/auth/{provider}/callback | Social callback |
| POST | /v1/auth/password/reset/request | Password reset request |
| POST | /v1/auth/password/reset/confirm | Password reset confirm |
| POST | /v1/auth/password/change | Change password |
| POST | /v1/auth/email/verify/send | Send email verification |
| POST | /v1/auth/email/verify/confirm | Confirm email verification |
| GET | /v1/auth/sessions | List sessions |
| DELETE | /v1/auth/sessions/{id} | Delete session |
| POST | /v1/auth/social/link | Link social account |
| POST | /v1/auth/social/unlink | Unlink social account |
| GET | /v1/auth/exists | Check account existence |
| DELETE | /v1/auth/account | Delete account |

## RBAC (Role-Based Access Control)

| Group | Description | Scope |
|-------|-------------|-------|
| admin | Full CRUD | All data |
| user | Authenticated user | Full read, own write |
| self | Owner only | createdBy-based |
| guest | Unauthenticated | Read only (usually) |

## RLS (Row Level Security)

- Per-table row-level access control
- 4-level policies: admin/user/self/guest
- Auto-filtering based on createdBy field

## Session Management

- Per-device session tracking
- `GET /v1/auth/sessions` - List sessions
- `DELETE /v1/auth/sessions/{id}` - Remove session

## Account Lifecycle

- Social account link/unlink
- Account existence check
- Account deletion (GDPR compliance)
