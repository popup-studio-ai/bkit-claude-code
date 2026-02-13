---
name: bkend-storage
description: |
  bkend.ai file storage expert skill.
  Covers single/multiple/multipart file upload via Presigned URL,
  file download (CDN vs Presigned), 4 visibility levels (public/private/protected/shared),
  bucket management, and file metadata.

  Triggers: file upload, download, presigned, bucket, storage, CDN, image,
  파일 업로드, 다운로드, 버킷, 스토리지, 이미지,
  ファイルアップロード, ダウンロード, バケット, ストレージ,
  文件上传, 下载, 存储桶, 存储,
  carga de archivos, descarga, almacenamiento, cubo,
  telechargement, televersement, stockage, seau,
  Datei-Upload, Download, Speicher, Bucket,
  caricamento file, scaricamento, archiviazione, bucket

  Do NOT use for: database operations (use bkend-data), authentication (use bkend-auth).
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

# bkend.ai Storage Guide

## Upload Methods

| Method | Use Case | Process |
|--------|----------|---------|
| Single | Normal files | Presigned URL -> PUT upload -> Register metadata |
| Multiple | Multiple files | Repeat single upload |
| Multipart | Large files | Initialize -> Part URLs -> Complete |

## Presigned URL

- Validity: 15 minutes
- PUT method with file binary
- Content-Type header required

## File Visibility (4 levels)

| Level | Access | URL Type |
|-------|--------|----------|
| public | Anyone | CDN URL (no expiry) |
| private | Owner only | Presigned URL (1 hour) |
| protected | Authenticated users | Presigned URL (1 hour) |
| shared | Specified targets | Presigned URL (1 hour) |

## Size Limits

| Category | Max Size |
|----------|----------|
| Images | 10 MB |
| Videos | 100 MB |
| Documents | 20 MB |

## Storage Categories

images, documents, media, attachments

## MCP Storage Workflow

bkend MCP does NOT have dedicated storage tools. Use this workflow:

1. **Search docs**: `search_docs` with query "file upload presigned url"
2. **Get examples**: `search_docs` with query "file upload code examples"
3. **Generate code**: AI generates REST API code for file operations

### Searchable Storage Docs
| Doc ID | Content |
|--------|---------|
| `7_code_examples_data` | CRUD + file upload code examples |

## REST Storage API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /v1/files/presigned-url | Generate presigned URL |
| POST | /v1/files | Register metadata (complete upload) |
| GET | /v1/files | File list |
| GET | /v1/files/:fileId | File detail |
| PATCH | /v1/files/:fileId | Update metadata |
| DELETE | /v1/files/:fileId | Delete file |
| POST | /v1/files/:fileId/download-url | Generate download URL |

## Multipart Upload (Large Files)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /v1/files/multipart/init | Initialize multipart upload |
| POST | /v1/files/multipart/presigned-url | Get part upload URL |
| POST | /v1/files/multipart/complete | Complete multipart upload |
| POST | /v1/files/multipart/abort | Abort multipart upload |

## Upload Flow (Single File)

```
1. POST /v1/files/presigned-url -> { url, fileId }
2. PUT {url} with file binary + Content-Type header
3. POST /v1/files with { fileId, filename, contentType, size, visibility }
```

## Multipart Upload Flow (Large File)

```
1. POST /v1/files/multipart/init -> { uploadId }
2. POST /v1/files/multipart/presigned-url -> [{ partNumber, url }]
3. PUT each part URL with file chunk
4. POST /v1/files/multipart/complete -> { file }
```

## Official Documentation (Live Reference)

For the latest storage documentation, use WebFetch:
- Storage Overview: https://raw.githubusercontent.com/popup-studio-ai/bkend-docs/main/en/storage/01-overview.md
- MCP Storage Guide: https://raw.githubusercontent.com/popup-studio-ai/bkend-docs/main/en/mcp/07-storage-tools.md
- Full TOC: https://raw.githubusercontent.com/popup-studio-ai/bkend-docs/main/SUMMARY.md
