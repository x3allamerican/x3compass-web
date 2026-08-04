# Audit PDF Exports Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stream branded, tenant-isolated DQ-file, D&A-summary, and accident-register PDFs and expose them on the existing audit-export page.

**Architecture:** A pure `pdf-lib` renderer creates paginated documents. One authenticated endpoint owns explicit evidence reads and minimal audit logging; the existing page owns session-authenticated downloads.

**Tech Stack:** Cloudflare Pages Functions, TypeScript, `pdf-lib`, Next.js 16, React 19, Playwright.

## Global Constraints

- Branch and PR only; no merge, deploy, R2 write, migration application, vendor call, live test email, or secret output.
- `requireTenant` is the only carrier authority.
- Real evidence or explicit missing labels; no demo PDF data.
- Audit logs exclude document contents and sensitive field values.

---

### Task 1: PDF renderer

**Files:**
- Create: `functions/_shared/audit-pdf.ts`
- Test: `tests/audit-pdf-renderer.spec.ts`

- [ ] Write a failing test that loads produced bytes with `PDFDocument`, verifies title text input does not crash wrapping, and confirms multi-page output.
- [ ] Implement `renderAuditPdf(input): Promise<Uint8Array>` with X3 header, wrapped lines, pagination, page numbers, citations, and guardrail.
- [ ] Re-run the focused renderer test and commit.

### Task 2: Tenant-scoped endpoint

**Files:**
- Create: `functions/api/audit/pdf.ts`
- Modify: `functions/_shared/api-route-classification.ts`
- Modify: `tests/api-route-classification.spec.ts`
- Test: `tests/audit-pdf-api.spec.ts`

- [ ] Write failing tests for unauthenticated rejection, invalid type/driver ID, cross-tenant driver rejection, explicit carrier-scoped reads, valid PDF headers/bytes, and minimal audit logging.
- [ ] Implement the three bounded evidence loaders, PDF section mapping, renderer call, and append-only `audit_log` event.
- [ ] Classify the endpoint and add it to the shared-guard regression list.
- [ ] Re-run endpoint, renderer, and classification tests; commit.

### Task 3: Native download controls

**Files:**
- Modify: `src/app/app/audit-export/page.tsx`
- Test: `tests/audit-pdf-page.test.mjs`

- [ ] Write a failing source contract for three document types, real driver selection, bearer authentication, PDF blob download, and no demo fallback.
- [ ] Add the Audit-ready PDFs panel, driver selector, download state, error messaging, and safe browser download helper.
- [ ] Re-run the page contract and TypeScript; commit.

### Task 4: Verification and PR

- [ ] Run all Node tests, focused PDF/API/security Playwright tests, TypeScript, production build, and diff check.
- [ ] Push `codex-b6-audit-pdfs`, open a PR against `codex-b6-accident-register`, and update issue #79 with test and deployment boundaries.
