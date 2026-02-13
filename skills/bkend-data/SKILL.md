---
name: bkend-data
description: |
  bkend.ai database expert skill.
  Covers table creation, CRUD operations, 7 column types, constraints,
  filtering (AND/OR, 8 operators), sorting, pagination, relations, joins,
  indexing, and schema management via MCP and REST API.

  Triggers: table, column, CRUD, schema, index, filter, query, data model,
  테이블, 컬럼, 스키마, 인덱스, 필터, 쿼리, 데이터 모델,
  テーブル, カラム, スキーマ, インデックス, フィルター,
  数据表, 列, 模式, 索引, 过滤, 查询,
  tabla, columna, esquema, indice, filtro, consulta,
  tableau, colonne, schema, index, filtre, requete,
  Tabelle, Spalte, Schema, Index, Filter, Abfrage,
  tabella, colonna, schema, indice, filtro, query

  Do NOT use for: authentication (use bkend-auth), file storage (use bkend-storage),
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

# bkend.ai Database Guide

## Column Types (7)

| Type | Description | Example |
|------|-------------|---------|
| String | Text | name, email |
| Number | Numeric | age, price |
| Boolean | True/false | isActive |
| Date | Date/time | birthDate |
| Array | Array | tags: ["a","b"] |
| Object | Nested object | address: {city, zip} |
| Mixed | Any type | metadata |

## Constraints

- `required`: Field must have a value
- `unique`: No duplicate values allowed
- `default`: Default value when not provided

## Auto System Fields

| Field | Type | Description |
|-------|------|-------------|
| id | String | Auto-generated unique ID |
| createdBy | String | Creator user ID |
| createdAt | Date | Creation timestamp |
| updatedAt | Date | Last update timestamp |

**Important**: bkend uses `id` (NOT `_id`) in all API responses.

## MCP Table Management Tools

| Tool | Purpose | Scope |
|------|---------|-------|
| `backend_table_create` | Create table | table:create |
| `backend_table_list` | List tables | table:read |
| `backend_table_get` | Get table detail + schema | table:read |
| `backend_table_delete` | Delete table | table:delete |
| `backend_field_manage` | Add/modify/delete fields | table:update |
| `backend_index_manage` | Manage indexes | table:update |
| `backend_schema_version_list` | Schema version history | table:read |
| `backend_schema_version_get` | Schema version detail | table:read |
| `backend_schema_version_apply` | Apply schema version (rollback) | table:update |
| `backend_index_version_list` | Index version history | table:read |
| `backend_index_version_get` | Index version detail | table:read |

## MCP Data CRUD Tools

| Tool | Purpose | Key Parameters |
|------|---------|----------------|
| `backend_data_list` | List records (filter, sort, paginate) | tableId, page?, limit?, sortBy?, sortDirection?, andFilters?, orFilters? |
| `backend_data_get` | Get single record | tableId, recordId |
| `backend_data_create` | Create record | tableId, data: { field: value } |
| `backend_data_update` | Partial update record | tableId, recordId, data: { field: value } |
| `backend_data_delete` | Delete record | tableId, recordId |

All Data CRUD tools require: organizationId, projectId, environmentId (from `get_context`).

### Filter Operators

| Operator | Meaning | Example |
|----------|---------|---------|
| `$eq` | Equal | `{ "status": { "$eq": "active" } }` |
| `$ne` | Not equal | `{ "role": { "$ne": "admin" } }` |
| `$gt` / `$gte` | Greater than / >= | `{ "age": { "$gt": 18 } }` |
| `$lt` / `$lte` | Less than / <= | `{ "price": { "$lt": 100 } }` |
| `$in` / `$nin` | In / Not in array | `{ "tag": { "$in": ["a","b"] } }` |

## MCP Guide Docs (via search_docs)

Use `search_docs` tool to access these guides:

| Doc ID | Content |
|--------|---------|
| `4_howto_implement_data_crud` | CRUD implementation patterns |
| `7_code_examples_data` | CRUD + file upload code examples |

Use `get_operation_schema` to get any tool's input/output schema.

## REST Data API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /v1/data/{table} | List (filter, sort, page, limit) |
| POST | /v1/data/{table} | Create |
| GET | /v1/data/{table}/{id} | Get single |
| PATCH | /v1/data/{table}/{id} | Partial update |
| DELETE | /v1/data/{table}/{id} | Delete |

## Filtering

- Text search: `?search=keyword`
- AND filter: `?filter[field1]=value1&filter[field2]=value2`
- Comparison operators: `$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`, `$in`, `$nin`
- Sort: `?sort=field:asc` (or desc)
- Pagination: `?page=1&limit=20` (default 20, max 100)

## Relations & Joins

- Configure table relationships
- Join queries for related data retrieval

## Index Management

- Single/compound index creation
- Manage via MCP `backend_index_manage`
- Essential for query performance optimization

## Official Documentation (Live Reference)

For the latest database documentation, use WebFetch:
- MCP Data Tools: https://raw.githubusercontent.com/popup-studio-ai/bkend-docs/main/en/mcp/05-data-tools.md
- MCP Table Tools: https://raw.githubusercontent.com/popup-studio-ai/bkend-docs/main/en/mcp/04-table-tools.md
- Database Guide: https://raw.githubusercontent.com/popup-studio-ai/bkend-docs/main/en/database/01-overview.md
- Full TOC: https://raw.githubusercontent.com/popup-studio-ai/bkend-docs/main/SUMMARY.md
