# ARCHITECTURE.md - limeriq-shared-types

## Overview

This package defines shared types organized by concern across 18 source files:

```
src/
  index.ts                            # Barrel re-export
  constants.ts                        # Protocol constants + enum-like const objects
  envelope.ts                         # Wire format types + type guards
  api-contracts.ts                    # HTTP API request/response shapes
  db-types.ts                         # Supabase database row types
  agent-types.ts                      # Agent system enums, interfaces, and decrypted payload types
  runtime-state.ts                    # Runtime state machine components and snapshots
  agent-automation.ts                 # Agent runner targets, triggers, autonomy, agent config
  run-contracts.ts                    # Run request/result, findings, artifacts, telemetry
  reporter-contracts.ts               # GitHub check/comment payloads, reporter output
  control-plane-contracts.ts          # Run request lifecycle, agent definitions, runner poll/claim
  trust-autonomy-contracts.ts         # Trust scores, action classification, autonomy gating, approvals
  telemetry-intelligence-contracts.ts # Telemetry records, rollups, digests, dispatch rules, automation packs
  setup-onboarding-contracts.ts       # GitHub App setup, onboarding steps, health checks
  dashboard-contracts.ts              # Dashboard view-model contracts for control plane SPA
  deployment-profile-contracts.ts     # Deployment profiles (Postgres/Supabase), compose config, validation
  runner-provider-contracts.ts        # LLM provider key mapping, validation, defaults
  setup-wizard-contracts.ts           # Setup wizard steps, status, bootstrap tokens, diagnostics
```

## Type Hierarchy

### Constants (`src/constants.ts`)

All enum-like values use the **const-object-plus-type** pattern for type safety with string literal inference:

```
PROTOCOL_VERSION (number)
MAX_ENVELOPE_BYTES (number)
MAX_BACKLOG_COUNT (number)
BACKLOG_TTL_SECONDS (number)
MAX_MSGS_PER_MINUTE (number)
PAIRING_SESSION_TTL_MINUTES (number)
HEARTBEAT_INTERVAL_SECONDS (number)

EventType: approval_pending | message_received | run_completed | run_failed
         | node_status_changed | config_changed
NodeMode: local | hosted
NodeStatus: active | disabled | pending
DeviceStatus: active | revoked
DeviceType: ios | android
PairingSessionStatus: pending | confirmed | expired | canceled
PairingStatus: active | revoked
EncryptionScheme: sodium-session-v1
PeerKind: device | node
RelayControlType: ping | pong | backlog_truncated | error

BOSS_AGENT_ID = 'boss' (string constant for default agent addressing)
RunConclusionEnum: pass | warn | fail | error | skipped
SdlcTriggerEvent: pull_request | issue_comment | push | schedule | workflow_dispatch | agent_completed
```

### Envelope Types (`src/envelope.ts`)

The envelope is the wire format for all messages between devices and nodes:

```
LimerClawEnvelope
  +-- protocol_version: number
  +-- message_id: string (ULID or UUID)
  +-- sent_at: string (ISO 8601)
  +-- node_id: string (UUID)
  +-- sender: EnvelopePeer
  |     +-- kind: PeerKind
  |     +-- device_id?: string
  +-- recipient: EnvelopePeer
  +-- encryption: EncryptionBlock
  |     +-- scheme: EncryptionScheme
  |     +-- key_id: string
  |     +-- nonce: string (base64)
  |     +-- ciphertext: string (base64)
  |     +-- aad: string (base64)
  +-- agent_id?: string (target agent, omit for boss)
  +-- message_type?: string (routing hint, e.g. 'chat', 'interactive_prompt')

RelayControlMessage
  +-- type: 'ping' | 'pong' | 'backlog_truncated' | 'error'
       | 'connect_challenge' | 'connect_auth' | 'connect_ack'
  +-- message?: string
  +-- dropped_count?: number
  +-- nonce?: string (connect_challenge/connect_auth)
  +-- ts?: number (connect_challenge/connect_ack/connect_auth)
  +-- proof?: string (connect_auth)
  +-- peer_kind?: PeerKind (connect_auth)
  +-- peer_id?: string (connect_auth)
  +-- node_id?: string (connect_auth)

RelayMessage = LimerClawEnvelope | RelayControlMessage
```

Type guards:
- `isRelayControlMessage(msg)` -- checks for `type` key without `protocol_version`
- `isEnvelope(msg)` -- checks for `protocol_version` and `encryption` keys

### API Contracts (`src/api-contracts.ts`)

HTTP API endpoint pairs:

| Endpoint | Request Type | Response Type |
|----------|-------------|---------------|
| `POST /api/limerclaw/devices/register` | `DeviceRegisterRequest` | `DeviceRegisterResponse` |
| `POST /api/limerclaw/nodes/register` | `NodeRegisterRequest` | `NodeRegisterResponse` |
| `POST /api/limerclaw/nodes/:nodeId/heartbeat` | `NodeHeartbeatRequest` | `NodeHeartbeatResponse` |
| `POST /api/limerclaw/pairing/create` | `PairingCreateRequest` | `PairingCreateResponse` |
| `POST /api/limerclaw/pairing/resolve` | `PairingResolveRequest` | `PairingResolveResponse` |
| `POST /api/limerclaw/pairing/confirm` | `PairingConfirmRequest` | `PairingConfirmResponse` |
| `GET /api/limerclaw/nodes/me` | (none) | `NodesListResponse` |
| `POST /api/limerclaw/push/notify` | `PushNotifyRequest` | `PushNotifyResponse` |
| `GET /api/limerclaw/nodes/:nodeId/agents` | (none) | `NodeAgentsListResponse` |
| `POST /api/limerclaw/nodes/:nodeId/agents/sync` | `AgentSyncRequest` | `AgentSyncResponse` |
| `POST /api/limerclaw/events/publish` | `EventPublishRequest` | `EventPublishResponse` |

Additional types:
- `TaskDispatchRunMetadata` -- metadata for daemon task dispatch lifecycle
- `ApiErrorResponse { error: string; details?: string }` -- standard error shape

### Database Row Types (`src/db-types.ts`)

Maps 1:1 to Supabase table schemas:

| Type | Table |
|------|-------|
| `LimerClawNodeRow` | `limerclaw_nodes` |
| `LimerClawDeviceRow` | `limerclaw_devices` |
| `LimerClawPairingSessionRow` | `limerclaw_pairing_sessions` |
| `LimerClawPairingRow` | `limerclaw_pairings` |
| `LimerClawNodeAgentRow` | `limerclaw_node_agents` |

### Agent Types (`src/agent-types.ts`)

Defines the agent system's type surface. All enums use the const-object-plus-type pattern.

**Enums:**
```
AgentKind: boss | persistent | on-demand
AgentStatus: active | paused | stopped
ExecutionMode: run-to-completion | interactive
AgentEventType: agent_created | agent_started | agent_stopped | agent_paused
              | run_started | run_progress | run_completed | run_failed
              | interactive_waiting | interactive_responded
```

**Core interfaces:**
- `AgentInfo` -- full agent record (id, name, kind, status, description, default_workflow_path, execution_mode, timestamps)
- `AgentCreateRequest` / `AgentCreateResponse` -- create an agent
- `AgentUpdateRequest` -- partial update of agent fields
- `InteractivePrompt` / `InteractiveResponse` -- interactive agent Q&A messages
- `AgentEvent` -- structured event for the agent event log
- `ChatMessage` -- simple text message (optionally tagged with agent_id)
- `ApprovalRequest` / `ApprovalResponse` -- tool-use approval flow

**Decrypted payload types:**

The encrypted `ciphertext` inside `LimerClawEnvelope.encryption` decrypts to one of these payload shapes, discriminated by the `type` field:

```
DecryptedPayload = ChatMessage
                 | InteractivePrompt
                 | InteractiveResponse
                 | AgentEvent
                 | ApprovalRequest
                 | ApprovalResponse

DecryptedMessageType = 'chat' | 'interactive_prompt' | 'interactive_response'
                     | 'agent_event' | 'approval_request' | 'approval_response'
```

### Runtime State (`src/runtime-state.ts`)

Runtime state machine types for tracking node component states:

**Component enums:**
```
RuntimeStateComponent: space | agent | session | node_identity | relay_connection
SpaceRuntimeState: uninitialized | ready | running
AgentRuntimeState: none | bound
SessionRuntimeState: idle | active
NodeIdentityRuntimeState: unknown | loaded | registering | registered | stale_detected
RelayConnectionRuntimeState: disconnected | connecting | connected | degraded
```

**Interfaces:**
- `RuntimeStateTransitionEvent` -- records a state transition (component, from/to state, status, reason)
- `RuntimeStateSnapshot` -- captures all component states at a point in time

### Agent Automation (`src/agent-automation.ts`)

Defines agent runner configuration and SDLC automation types:

**Enums:**
```
AgentRunnerTarget: github_actions | self_hosted | local
TriggerEventType: pull_request | issue_comment | push | schedule | workflow_dispatch | agent_completed
AutonomyLevel: L0 | L1 | L2 | L3 | L4
```

**Configuration interfaces:**
- `TriggerConfig` -- event trigger with actions, paths, cron
- `AutonomyConfig` -- initial/max autonomy levels, trust threshold
- `ConcurrencyConfig` -- concurrency group, cancel-in-progress
- `ReportingConfig` -- GitHub check/PR comment flags
- `RunnerConfig` -- runner target, timeout, concurrency
- `AgentConfig` -- top-level agent configuration (name, triggers, runner, autonomy, reporting, memory)
- `ProviderManifest` -- CLI command runner provider manifest

**Type guards:**
- `isAgentRunnerTarget()`, `isTriggerEventType()`, `isAutonomyLevel()`

### Run Contracts (`src/run-contracts.ts`)

Run request/result types for agent execution:

**Enums:**
```
RunConclusion: pass | warn | fail | error | skipped
FindingSeverity: critical | high | medium | low | info
```

**Data interfaces:**
- `Finding` -- single finding (severity, message, file, line, rule, category)
- `Artifact` -- run artifact (name, type: markdown/json/log, content)
- `RunTelemetry` -- execution metrics (duration, tokens, steps, LLM calls)
- `RunContext` -- repo, PR number, SHA, ref
- `RunRequest` -- full run request (workflow, trigger, context, secrets, runner target)
- `RunResult` -- full run result (conclusion, findings, artifacts, telemetry, timestamps)
- `RunHeartbeat` -- in-flight run heartbeat
- `RunDispatch` -- dispatched run metadata

**Type guards:**
- `isRunConclusion()`, `isFindingSeverity()`, `isRunResult()`, `isRunRequest()`

### Reporter Contracts (`src/reporter-contracts.ts`)

GitHub reporting types:

- `GitHubCheckConclusionMap` -- maps `RunConclusion` to GitHub check conclusion strings
- `mapRunConclusionToGitHub()` -- mapping function
- `GitHubCheckAnnotation` -- single annotation (path, lines, level, message)
- `GitHubCheckPayload` -- check run payload (name, sha, conclusion, summary, annotations)
- `GitHubCommentPayload` -- PR comment payload (marker_id, body, pr_number)
- `ReporterOutput` -- combined output (optional check, optional comment, artifacts)

### Control Plane Contracts (`src/control-plane-contracts.ts`)

Run lifecycle management for the control plane:

**Enums:**
```
RunRequestStatus: queued | claimed | running | completed | failed | dead_letter
```

**Core interfaces:**
- `GitHubAppInstallation` -- GitHub App installation metadata
- `AgentDefinition` -- agent definition record (workflow, runner target, autonomy, reporting)
- `AgentTrigger` -- trigger binding for an agent definition
- `ControlPlaneRunRequest` -- full run request with lifecycle tracking (status, lease, retries, chaining)
- `RunExecution` -- execution record (status, result, duration)
- `OrgPolicy` -- organization-level AI policy (allowed, conditions, sensitive paths, max autonomy)
- `RunnerPollRequest/Response` -- runner polling
- `RunClaimResponse` -- lease-based claim result
- `RunCompleteRequest` / `RunFailRequest` -- run completion/failure reporting
- `NormalizedEvent` -- webhook event normalized for trigger matching
- `DispatchResult` -- outcome of dispatching (dispatched/blocked/deduped/error)
- `PolicyDecision` -- result of policy evaluation

### Trust & Autonomy Contracts (`src/trust-autonomy-contracts.ts`)

Trust scoring and autonomy gating:

**Enums/Constants:**
```
ActionCategory: observe | comment | suggest | commit | approve
ACTION_REQUIRED_LEVEL: Record<ActionCategory, AutonomyLevel>
```

**Types:**
- `ApprovalStatus`: pending | approved | denied | timed_out
- `ApprovalTimeoutDefault`: deny | approve_l0
- `ApprovalChannel`: github | mobile | timeout

**Interfaces:**
- `TrustComponent` -- five trust dimensions (accuracy, reliability, safety, usefulness, consistency)
- `TrustScore` -- composite trust score with effective autonomy level
- `ActionClassification` -- maps actions to categories and required levels
- `AutonomyGateResult` -- gating decision (allowed, requires approval, reason)
- `AgentApprovalRequest` -- approval request with context and timeout
- `AgentMemoryEntry` -- agent learning/memory storage

### Telemetry & Intelligence Contracts (`src/telemetry-intelligence-contracts.ts`)

Per-run telemetry, aggregation, dispatch chains, and automation packs:

**Interfaces (telemetry):**
- `SeverityBreakdown` -- per-severity finding counts
- `AgentTelemetryRecord` -- per-run telemetry (conclusion, findings, duration, tokens, autonomy, trust)
- `TelemetryDailyRollup` -- daily aggregation with hotspots
- `TelemetryWeeklyRollup` -- weekly aggregation with estimated hours saved, accuracy delta, recommendations

**Interfaces (digest):**
- `WeeklyDigest` -- installation-wide weekly summary
- `DigestSummary` -- runs, issues caught, hours saved, accuracy change
- `AgentDigestDetail` -- per-agent breakdown in digest
- `HotspotEntry` -- file path with finding count and risk trend

**Constants:**
- `MANUAL_REVIEW_BENCHMARKS_MS` -- estimated manual review time per agent type

**Interfaces (dispatch):**
- `DispatchCondition` -- condition for agent-to-agent dispatch
- `ResultMapping` -- variable mapping between source and target runs
- `AgentDispatchRule` -- rule linking source and target agents
- `AgentDispatchResult` -- outcome of a dispatch

**Interfaces (packs):**
- `AutomationPackManifest` -- pack definition (workflow, agent config, default trust, dispatch rules)
- `PackInstallRequest` / `PackInstallResult` -- pack installation

**Type guards:**
- `isSeverityBreakdown()`, `isDispatchCondition()`, `isPackCategory()`, `isHotspotEntry()`

### Setup & Onboarding Contracts (`src/setup-onboarding-contracts.ts`)

GitHub App setup and onboarding:

- `GitHubAppSetupRequest` -- app ID, webhook secret, private key path, non-interactive flag
- `GitHubAppSetupResult` -- validation result (permissions, webhook, errors)
- `SetupValidationResult` -- per-step validation
- `OnboardingStep` -- step tracking (status: pending/in_progress/completed/failed/skipped)
- `HealthCheckResult` -- deep health check (status, uptime, components)
- `HealthCheckComponent` -- per-component health (status, latency, message)
- `REQUIRED_GITHUB_APP_PERMISSIONS` -- required permission map
- `DEFAULT_WEBHOOK_EVENTS` -- default webhook subscriptions

### Dashboard Contracts (`src/dashboard-contracts.ts`)

View-model contracts for the control plane dashboard SPA:

- `DashboardRunSummary` -- run summary card (agent, repo, status, duration, autonomy, trust, PR)
- `DashboardAgentStatus` -- agent status card (triggers, trust level/score, run stats, active flag)
- `DashboardTelemetrySummary` -- period telemetry overview (runs, time saved, top agents)
- `DashboardDigestView` -- digest view (summary text, highlights, metrics, hotspots)
- `DashboardDispatchChain` -- dispatch chain visualization (source/target agents, condition, count)
- `DashboardHealthStatus` -- system health (control plane, database, GitHub App, queue, runners)

### Deployment Profile Contracts (`src/deployment-profile-contracts.ts`)

Self-hosted deployment configuration:

**Enums:**
```
DeploymentProfile: postgres | supabase
```

**Interfaces:**
- `DatabaseConfig` -- Postgres connection config (host, port, database, user, SSL)
- `PostgRESTConfig` -- PostgREST sidecar config (URL, schemas, anon role, JWT)
- `ComposeConfig` -- docker-compose config (profile, database, PostgREST or Supabase, ports)
- `SelfHostedValidationCheck` -- single validation check (pass/fail/skip/warn, remediation)
- `SelfHostedValidationResult` -- overall validation (profile, passed, checks)

**Type guards:**
- `isDeploymentProfile()`

### Runner Provider Contracts (`src/runner-provider-contracts.ts`)

LLM provider key mapping and validation:

- `ProviderKeyMapping` -- provider ID, env var name, required flag, display name
- `RunnerProviderConfig` -- map of providers, skip_validation flag
- `ProviderValidationCheck` -- per-provider check result
- `ProviderValidationResult` -- overall validation (missing required/optional)
- `DEFAULT_PROVIDER_MAPPINGS` -- built-in mappings for Anthropic and OpenAI

**Type guards:**
- `isProviderKeyMapping()`

### Setup Wizard Contracts (`src/setup-wizard-contracts.ts`)

Self-hosted setup wizard flow:

**Enums:**
```
SetupStepId: env-check | db-migration | github-app | runner-registration | first-agent | verification-run
```

**Interfaces:**
- `SetupStepResult` -- step result (status: pass/fail/skip/pending, remediation)
- `SetupStatus` -- overall setup status (complete flag, steps, current step)
- `RunnerBootstrapToken` -- bootstrap token for runner registration (token, URL, command, expiry)
- `SetupDiagnostic` -- diagnostic entry (category, severity, message, remediation)

**Type guards:**
- `isSetupStepId()`

## Versioning Strategy

- The package is published to GitHub Packages as `@darrenapfel/limeriq-shared-types` at version `0.1.0`.
- It is consumed via the npm registry by `limeriq-control` (using an npm alias `@limerclaw/shared-types` -> `npm:@darrenapfel/limeriq-shared-types@^0.1.0`) and via git submodule by `limeriq-relay`, `limeriq-service`, and `limeriq-mobile-app`.
- Breaking changes to envelope format require bumping `PROTOCOL_VERSION` in `src/constants.ts`.
- All consumers must be updated simultaneously when envelope format changes.
