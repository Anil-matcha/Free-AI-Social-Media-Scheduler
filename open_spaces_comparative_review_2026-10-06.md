# OpenSpaces comparative code review and plan

**Reviewed:** 2026-10-06  
**Scope:** `SamurAIGPT/open-spaces` current `main`; `CopilotKit/OpenDots` current `main`; current public product/help documentation for Open Spaces and Notion. This is a source and documentation review, not a deployment audit or runtime verification.

## Executive summary

OpenSpaces has a useful foundation: a TipTap-based page editor, space/page/message persistence, autosave, and MuAPI text and image integrations. Several README claims currently describe intended behavior rather than implemented behavior. In particular, multi-user collaboration has no access control, the WebSocket is an unused unauthenticated relay, agent execution and meeting transcription are simulations, and page versions do not prevent stale writes.

OpenDots is a useful implementation reference for nested pages, optimistic concurrency, draft preservation, scoped agent access, page-specific conversations, and approval before saving agent-created pages. It is deliberately single-owner and does not provide team collaboration or file uploads.

Open Spaces is the closer product reference for shared pages, files, teammates, comments, and real-time editing. Notion is the broader workspace reference: teamspaces and granular permissions, docs and databases, connected-source search with citations, real meeting transcription, and scheduled or event-triggered agents.

Recommended sequence: **secure the baseline → make page editing safe → add real sharing/collaboration → make AI runs trustworthy → implement meetings/files → selectively expand integrations and structured workspace features.**

## Sources and review boundaries

### Repositories reviewed

- [SamurAIGPT/open-spaces](https://github.com/SamurAIGPT/open-spaces)
- [CopilotKit/OpenDots](https://github.com/CopilotKit/OpenDots)
- OpenDots [setup and page behavior](https://github.com/CopilotKit/OpenDots/blob/main/docs/SETUP.md)
- OpenDots [security boundary](https://github.com/CopilotKit/OpenDots/blob/main/SECURITY.md)

### Product documentation reviewed

- Open Spaces product specifications
- Notion [product features](https://www.notion.com/product/features)
- Notion [teamspaces](https://www.notion.com/help/guides/teamspaces-give-teams-home)
- Notion [sharing and permissions](https://www.notion.com/help/sharing-and-permissions)
- Notion [Enterprise Search](https://www.notion.com/help/enterprise-search)
- Notion [Custom Agents](https://www.notion.com/help/custom-agents)
- Notion [AI Meeting Notes](https://www.notion.com/help/ai-meeting-notes)

Open Spaces specifications describe real-time collaboration, comments, team sharing, files, shared context and page instructions; collaborative slides and spreadsheets as roadmap items. Notion capabilities and plan availability can vary, so recheck product docs before making dated parity claims.

## OpenSpaces code review

### Implemented foundation

- Next.js client and FastAPI API, with SQLAlchemy persistence configured for PostgreSQL/Supabase.
- CRUD and persistence for spaces, pages, messages and meeting-note records.
- TipTap editor with Markdown source mode, slash commands, inline text/image generation, and debounced autosave.
- Page version integer incremented on every page update.
- MuAPI-backed chat and image routes.

### Gaps between claims and implementation

| Area | Current implementation | Consequence |
|---|---|---|
| Identity and authorization | Reviewed routes do not authenticate users or check space membership. Membership is stored as JSON/static seed data; creating a Space assigns a fixed `usr-1` owner. | Any reachable API client can attempt reads and mutations. This is a release blocker for multi-user or public deployment. |
| WebSocket collaboration | `/ws/spaces/{space_id}` accepts based on the URL identifier and relays arbitrary received JSON to connections. It does not authenticate, authorize, validate event schemas, persist changes, or implement document operations. No client use was found in the frontend source. | It is not collaborative editing and can expose a room to unauthorized clients. |
| Page concurrency | The API increments `version` but does not require a client expected-version value. There is no revision-history table or restore endpoint. | Concurrent saves can silently overwrite one another; a version number alone does not prevent it. |
| Nested pages | Page schema/model has no parent-page relationship. | No document hierarchy or safe move behavior. |
| Dot agents | The run endpoint waits and appends placeholder text, then posts a completion message. Agent identities/capabilities are seeded, with no full configure/manage workflow. | “Autonomous” work is not actually executed; completion status is misleading. |
| Meetings | The recording UI runs a timer and then submits hard-coded transcript, summary and action items. | No real audio capture, upload or transcription. |
| Chat errors | A failed MuAPI request can return fabricated fallback text as a normal response. | Users cannot distinguish generated answers from provider failures. |
| Image generation | Request handler polls in an unbounded loop until completion. | Long-running generation occupies the request and has no durable job state the user can revisit. |
| Files and connected context | No Space file persistence or integration-backed context workflow was found. | Space agents cannot use a managed, access-controlled collection of attached sources. |
| Collaboration features | No invite/member-management routes, page comments, granular access, or access-aware search were found. | UI language around shared team work exceeds the backend capability. |
| Configuration | `server/app/core/config.py` includes a database URL with embedded credentials as a default fallback. | Verify whether the credential is live; rotate it if so, remove it from source, and require deployment configuration. Do not copy the secret into issues or documentation. |

Relevant OpenSpaces files include `server/app/main.py`, `server/app/core/config.py`, `server/app/api/routers/{spaces,pages,agents,meetings,chat,images}.py`, `server/app/db/models.py`, `server/app/models/schemas.py`, `server/app/services/space_store.py`, and `client/src/components/{OpenSpacesApp,CanvasPage,SpaceChat,MeetingIntelligence}.js`.

### Additional implementation observations

- The WebSocket broadcasts back to all room connections, including the sender, despite the comment saying “other collaborators.” It also has no `finally` cleanup for non-disconnect failures.
- `members` are serialized from a JSON column rather than relational membership records, making constraints and authorization difficult to enforce.
- Message records are persisted, but there is no distinct conversation/thread model that establishes ownership, membership, or context boundaries.
- Image generation is synchronous from the caller's perspective and has no server-side job lifecycle, cancellation, or timeout policy.
- UI state and endpoint behavior should be kept in parity: seeded examples and fallback responses need clear demo-vs-production boundaries.

## OpenDots code review

OpenDots is an early, self-hosted, single-owner template. It should not be mistaken for a drop-in team collaboration implementation. Its strongest reusable patterns are in document integrity and agent scoping.

### Useful patterns to adopt

- Pages have `parentId`; server checks parent existence in the same Space and prevents cycles when moving pages.
- Page updates require `expectedRevision`; conflicts return a conflict response rather than silently overwriting newer content.
- Client autosave has explicit `saved`, `dirty`, `saving`, `error`, and `conflict` states. Failed writes preserve the draft; retries are explicit after errors.
- Page-specific conversations are bound to both page and specialist Dot. The current saved page is passed as context.
- Each Dot has explicit Space grants and separate research/memory permissions; server-side tools check those grants.
- Agent-created page content can require human review before saving. A persisted review receipt makes repeat saves idempotent.
- Scheduled work tracks tasks, runs, events, leases, pause/retry state, and result/error status in persistent storage.
- The repository includes focused tests for page services, autosave conflicts, scopes, scheduling, controls and security boundaries.

### OpenDots limitations to preserve in the comparison

- Its local app uses a single-owner identity model. Its own security guide says multi-user membership, Slack identity mapping, and voice delegation need more enforcement before connected multi-user deployment.
- No shared page editing, team invitations, file uploads or arbitrary interactive embeds are included.
- Page data lives locally in SQLite while conversation history lives in the configured Intelligence project; backups must cover both.
- Computer, Slack, calls, schedules, and learning depend on configured external services. The repo distinguishes local checks from live-service verification.

## Product comparison

| Capability | OpenSpaces | OpenDots | Reference Spaces | Notion |
|---|---|---|---|---|
| Workspace organization | Spaces and flat page lists | Spaces with nested pages | Shared Spaces for team work | Teamspaces, pages, databases, docs and projects |
| Page editing | TipTap rich editor, Markdown and autosave | Rich editor, Markdown/source handling, nested pages, autosave | Editable pages, with AI assistance | Block-based docs and databases |
| Concurrent collaboration | WebSocket relay only; not wired into client | Not included | Product page describes real-time co-editing and comments | Product page describes real-time editing and comments |
| Permissions | Static member field; no enforced auth in reviewed routes | Single-owner boundary; per-Dot Space grants | Teammate/team sharing and page access levels | Open/closed/private teamspaces; page-level view/comment/edit/full access and inherited permissions |
| AI context | Chat endpoint and inline editor actions; no Space file corpus | Page-specific Dot conversation; scoped page tools | Open Spaces/Codex/dot use shared context; page instructions and connected sources | Workspace and connector search with citations; AI can work with pages/databases |
| Agent automation | Agent run is simulated | Specialist Dots, schedules, pause/retry, optional computer, review flow | Dots can work across Space and connected channels per product description | Custom Agents can use granted sources, schedules/events, and actions; access/activity controls are documented |
| Meetings | Static simulated transcript and summary | Calls and speech workflows, with some live-connected checks noted as incomplete | Not the core of the Space product page | Actual AI Meeting Notes transcription, summaries and action items; team sharing controls |
| Files/integrations | No Space file system/integrations found | File uploads are future work; Slack/calls/computers require setup | Shared files and connected context are part of product description | AI Connectors include services such as Slack, Drive, Jira, GitHub, email and calendars, subject to plans/setup |

Notion is a broader long-term benchmark than a Space clone: it combines documents with databases, projects, connectors, meeting capture and event-driven agents. Avoid taking on all of that before OpenSpaces has authorization and data-integrity fundamentals.

## Recommended implementation plan

### Phase 0 — Secure the baseline

1. Remove the source-coded database credential fallback. Require `DATABASE_URL`/`DIRECT_URL` from the environment and fail startup clearly when missing. Check credential validity privately and rotate if active.
2. Add verified user identity and server-side authorization to every Space, page, message, meeting, chat and agent route.
3. Replace JSON/static members and fixed `usr-1` with normalized users, memberships, roles and ownership.
4. Restrict CORS to configured origins. Authenticate and authorize WebSocket connections, or disable the unused endpoint until a real protocol is implemented.
5. Define owner/editor/commenter/viewer permissions and test enforcement at the API boundary.

**Exit criteria:** anonymous access fails; cross-Space reads/writes fail; membership revocation takes effect; WebSocket cannot join by guessing an ID; absent production secrets prevent startup.

### Phase 1 — Make pages safe to edit

1. Add page `parent_id`, ordering and safe move/cycle checks.
2. Require `expected_revision` for updates and return conflict status with the current revision on stale writes.
3. Adopt explicit autosave states and preserve local drafts on failure/conflict; provide “use latest” and recovery paths.
4. Add revision snapshots/history and restore with author and timestamp.
5. Define page content limits and safe Markdown/rich-text conversions.

**Exit criteria:** two clients cannot silently overwrite; stale changes are detectable; failed drafts remain recoverable; users can restore an earlier version.

### Phase 2 — Build real sharing and collaboration

1. Add invitations and membership lifecycle, with role changes and revocation.
2. Add page-level sharing only if Space-level permissions are insufficient for the target use case.
3. Add comments, mentions and activity history.
4. Pick an explicit collaboration model: CRDT/OT for simultaneous edits, or presence plus revision-checked saves as a smaller first step. Replace arbitrary WebSocket payload relay with typed, authenticated events.
5. Scope search results and page references by the caller's access.

**Exit criteria:** invited users see only authorized content; roles are enforced; concurrent edits have defined behavior; comments and activity identify real users.

### Phase 3 — Make AI actions trustworthy

1. Replace simulated agent execution with durable run/job records: queued, running, completed, failed, cancelled, progress, timestamps and retry state.
2. Configure each Dot with instructions, model and explicit Space/page/tool grants; verify grants on every server tool call.
3. Send only authorized page/file context and retain source links/citations for research.
4. Add review/approve/reject for page modifications and external write actions; make accepted operations idempotent.
5. Return structured provider errors instead of fabricated success text. Use bounded timeouts and appropriate retries.
6. Convert image generation to an asynchronous durable task with status polling or server events, cancellation and clear failure states.

**Exit criteria:** “completed” means real execution completed; users can inspect failures and sources; tool grants are server-enforced; consequential edits can be reviewed and recovered.

### Phase 4 — Implement real meeting and file workflows

1. Implement actual microphone capture and/or audio/video upload, transcription, summary and action extraction.
2. Keep capture, transcription and synthesis as separate observable job states; retain/edit transcripts and outputs under clear retention rules.
3. Let users review action items before converting them into pages/tasks.
4. Add Space file storage, metadata, upload limits, supported formats and access checks.
5. Make AI context selection explicit and cite the files/pages used.

**Exit criteria:** meeting notes are derived from real audio; generated content is reviewable; uploads follow access/retention rules; AI answers identify source material.

### Phase 5 — Selectively expand toward Notion

1. Add connected-source search with citations, beginning with one high-value integration.
2. Add event-triggered and scheduled agents only with pause/disable controls, run logs, permissions and reversible actions.
3. Evaluate structured databases/collections if page-only organization is insufficient.
4. Add admin controls, export, retention, audit trails and mobile workflows based on deployment needs.

**Exit criteria:** each connector or trigger has explicit scopes, access-aware retrieval, observable runs and a recovery path.

## Priority and sequencing

**P0:** credential remediation and server-enforced authorization. Do not expose the current backend as a multi-user service before these are addressed.  
**P1:** revision-checked page editing and real membership/invitations. These unlock safe collaboration.  
**P2:** replace simulated agents and meeting UI; add durable job state and honest errors.  
**P3:** comments, files and connected-source context.  
**P4:** connectors, event-driven agents, database-like collections and enterprise controls.

OpenDots is the implementation reference for page conflict handling, scoped agent tools, page-specific conversations and reviewable agent writes. Open Spaces is the nearer product reference for shared pages, files, teams and comments. Notion is the broader benchmark for granular permissions, source-connected search, real meeting capture and automation.

## Suggested first milestone

Ship a secure single-organization MVP with verified users, Spaces and memberships, revision-checked pages, nested page organization, honest AI failure states, and a genuine page-scoped agent draft/review flow. Defer real-time co-editing, external connectors, meeting capture and database features until the MVP's authorization and data integrity are dependable.

