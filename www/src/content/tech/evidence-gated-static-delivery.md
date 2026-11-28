---
title: "Evidence-gated static delivery and zero-inference-cost MCP"
description: "How Jamula structures public-site delivery, secretless pull-request artifact verification, and machine-readable discovery without server-side CMS state."
publishedDate: "2026-11-26"
summary: "Architectural overview of the repository's static Astro publishing pipeline, .NET 11 archive and governance verification, and caller-brings-model discovery endpoints."
---

## Why build-time publishing replaces bespoke CMS state

Public technical notes on `jamula.net` are authored as version-controlled Markdown in Astro Content Collections rather than stored in a mutable runtime database. Drafts and reviews follow the same pull-request, governance, and exact-revision approval workflow as application source code, and approved entries compile into static HTML at build time.

Eliminating an administrative database and authenticated runtime editor from the public website removes credential-stuffing, session-fixation, and server-side injection paths from the public origin while keeping hosting within static-site boundaries.

## Secretless pull-request build and trusted preview verification

Pull-request builds compile the static artifact without access to deployment environments or secrets. A separate default-branch `workflow_run` pipeline downloads the SHA-bound build archive, verifies its SHA-256 digest against GitHub metadata, and validates every ZIP central-directory entry, CRC32 checksum, path boundary, and `staticwebapp.config.json` parity through a zero-dependency `.NET 11` validator before uploading to an isolated numbered preview environment.

Production releases never promote a preview environment. Instead, an authorized `workflow_dispatch` run on `main` builds a single immutable artifact, stamps `/release.json`, deploys to the approved `.net` and `.com` Static Web Apps, and verifies live Content Security Policy headers and release metadata before publishing the immutable GitHub Release tag.

## Machine-readable discovery without hosted inference spend

Rather than operating an unauthenticated public chat model on the website origin, Jamula publishes static `/llms.txt` and `/llms-full.txt` indexes alongside a read-only `.NET 11` Model Context Protocol (`MCP`) server built on the official C# MCP SDK and `Microsoft.Extensions.AI` abstractions.

In this caller-brings-model pattern, external MCP clients supply their own language model tokens while the Jamula MCP server performs deterministic, path-confined search and citation lookup over approved repository Markdown with content-suppressed OpenTelemetry metrics.
