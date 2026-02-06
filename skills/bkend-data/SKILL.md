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
| _id | ObjectId | Auto-generated unique ID |
| createdBy | String | Creator user ID |
| createdAt | Date | Creation timestamp |
| updatedAt | Date | Last update timestamp |

## MCP Database Tools

| Tool | Purpose | Scope |
|------|---------|-------|
| backend_table_create | Create table | table:create |
| backend_table_list | List tables | table:read |
| backend_table_get | Get table detail + schema | table:read |
| backend_table_update | Update table settings | table:update |
| backend_table_delete | Delete table | table:delete |
| backend_field_manage | Add/modify/delete fields | table:update |
| backend_schema_version_list | Schema version history | table:read |
| backend_schema_rollback | Rollback schema | table:update |
| backend_index_manage | Manage indexes | table:update |
| backend_index_version_list | Index version history | table:read |
| backend_index_rollback | Rollback index | table:update |

## MCP Guide Tools

| Tool | Purpose |
|------|---------|
| 4_howto_implement_data_crud | CRUD implementation patterns |
| 5_get_operation_schema | API operation schema reference |
| 7_code_examples_data | CRUD + file upload code examples |

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
- Comparison operators: eq, ne, gt, gte, lt, lte, in, nin
- Sort: `?sort=field:asc` (or desc)
- Pagination: `?page=1&limit=20` (default 20, max 100)

## Relations & Joins

- Configure table relationships
- Join queries for related data retrieval

## Index Management

- Single/compound index creation
- Manage via MCP `backend_index_manage`
- Essential for query performance optimization
