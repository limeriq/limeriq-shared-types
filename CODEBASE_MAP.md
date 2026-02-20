# CODEBASE_MAP.md - limeriq-shared-types

## File-by-File Reference

### `package.json`
- Package name: `@darrenapfel/limeriq-shared-types`
- Version: `0.1.0`
- Entry point: `src/index.ts` (both `main` and `types`)
- Scripts: `typecheck` -> `tsc --noEmit`, `test` -> `vitest run`
- devDependencies: `typescript ^5.6.0`, `vitest ^3.0.0`
- `publishConfig.registry`: `https://npm.pkg.github.com`

### `tsconfig.json`
- Target: ES2020, Module: ESNext, moduleResolution: bundler
- `noEmit: true` -- type checking only, no JS output
- `strict: true`, `isolatedModules: true`
- Includes `src/**/*.ts` and `__tests__/**/*.ts`

### `src/index.ts` (lines 1-19)
Barrel export file. Re-exports everything from all 17 source modules:
- `export * from './constants'`
- `export * from './envelope'`
- `export * from './api-contracts'`
- `export * from './db-types'`
- `export * from './agent-types'`
- `export * from './runtime-state'`
- `export * from './agent-automation'`
- `export * from './run-contracts'`
- `export * from './reporter-contracts'`
- `export * from './control-plane-contracts'`
- `export * from './trust-autonomy-contracts'`
- `export * from './telemetry-intelligence-contracts'`
- `export * from './setup-onboarding-contracts'`
- `export * from './dashboard-contracts'`
- `export * from './deployment-profile-contracts'`
- `export * from './runner-provider-contracts'`
- `export * from './setup-wizard-contracts'`

### `src/constants.ts` (lines 1-143)
Protocol constants and enum-like type definitions.

**Constants (lines 1-20):**
- `PROTOCOL_VERSION = 1` (line 2)
- `MAX_ENVELOPE_BYTES = 65_536` (line 5)
- `MAX_BACKLOG_COUNT = 100` (line 8)
- `BACKLOG_TTL_SECONDS = 300` (line 11)
- `MAX_MSGS_PER_MINUTE = 60` (line 14)
- `PAIRING_SESSION_TTL_MINUTES = 10` (line 17)
- `HEARTBEAT_INTERVAL_SECONDS = 30` (line 20)

**Enum-like types (lines 24-118):**
- `EventType` (lines 24-33): Push notification event types (`approval_pending`, `message_received`, `run_completed`, `run_failed`, `node_status_changed`, `config_changed`)
- `ALLOWED_EVENT_TYPES` (line 36): Readonly array of all `EventType` values
- `NodeMode` (lines 40-45): `local` | `hosted`
- `NodeStatus` (lines 49-55): `active` | `disabled` | `pending`
- `DeviceStatus` (lines 57-62): `active` | `revoked`
- `DeviceType` (lines 64-69): `ios` | `android`
- `PairingSessionStatus` (lines 71-78): `pending` | `confirmed` | `expired` | `canceled`
- `PairingStatus` (lines 80-85): `active` | `revoked`
- `EncryptionScheme` (lines 89-93): `sodium-session-v1`
- `PeerKind` (lines 97-102): `device` | `node`
- `RelayControlType` (lines 106-113): `ping` | `pong` | `backlog_truncated` | `error`
- `BOSS_AGENT_ID = 'boss'` (line 118): Default agent ID

**Run/SDLC constants (lines 120-143):**
- `RunConclusionEnum` (lines 122-130): `pass` | `warn` | `fail` | `error` | `skipped`
- `SdlcTriggerEvent` (lines 134-143): `pull_request` | `issue_comment` | `push` | `schedule` | `workflow_dispatch` | `agent_completed`

### `src/envelope.ts` (lines 1-91)
Wire format types for relay communication.

- `EnvelopePeer` interface (lines 4-8): Peer identity with `kind` and optional `device_id`
- `EncryptionBlock` interface (lines 11-22): Encryption metadata (scheme, key_id, nonce, ciphertext, aad)
- `LimerClawEnvelope` interface (lines 31-50): Full message envelope
  - `agent_id?: string` (line 47): Target agent ID (omit for boss agent)
  - `message_type?: string` (line 49): Routing hint (e.g. `'chat'`, `'interactive_prompt'`)
- `RelayControlMessage` interface (lines 53-78): Control messages (ping/pong/error/backlog_truncated/connect_challenge/connect_auth/connect_ack) with optional fields for auth handshake (nonce, ts, proof, peer_kind, peer_id, node_id)
- `RelayMessage` type (line 81): Union of `LimerClawEnvelope | RelayControlMessage`
- `isRelayControlMessage()` function (lines 84-86): Type guard for control messages
- `isEnvelope()` function (lines 89-91): Type guard for envelopes

### `src/api-contracts.ts` (lines 1-184)
HTTP API request/response type definitions. Imports `AgentKind`, `AgentStatus`, `ExecutionMode` from `./agent-types`.

- `DeviceRegisterRequest/Response` (lines 6-17): Device registration
- `NodeRegisterRequest/Response` (lines 21-38): Node registration
- `NodeHeartbeatRequest/Response` (lines 42-49): Node heartbeat
- `PairingCreateRequest/Response` (lines 53-62): Pairing session creation
- `PairingResolveRequest/Response` (lines 66-75): Pairing code resolution
- `PairingConfirmRequest/Response` (lines 79-86): Pairing confirmation
- `NodeDirectoryEntry` (lines 90-102): Single node info
- `NodesListResponse` (lines 104-106): List of nodes
- `PushNotifyRequest/Response` (lines 110-119): Push notification trigger
- `NodeAgentEntry` (lines 123-132): Agent info entry for a node
- `NodeAgentsListResponse` (lines 134-136): List of agents for a node
- `AgentSyncRequest` (lines 140-142): Bulk agent sync
- `AgentSyncResponse` (lines 144-146): Sync result with `synced_count`
- `EventPublishRequest` (lines 150-157): Dashboard event publish (event_type, agent_id, space_id, payload, idempotency_key, prompt)
- `EventPublishResponse` (lines 159-165): Event publish result (run_id, agent_id, status, error, event_type)
- `TaskDispatchRunMetadata` (lines 169-177): Daemon task dispatch metadata (dispatcher, task_id, run_id, assignee_agent_id, space_id, status, blocked_reason)
- `ApiErrorResponse` (lines 181-184): Standard error shape

### `src/db-types.ts` (lines 1-77)
Supabase table row type definitions. Imports `AgentKind`, `ExecutionMode` from `./agent-types`.

- `LimerClawNodeRow` (lines 12-26): `limerclaw_nodes` table
- `LimerClawDeviceRow` (lines 29-41): `limerclaw_devices` table
- `LimerClawPairingSessionRow` (lines 44-52): `limerclaw_pairing_sessions` table
- `LimerClawPairingRow` (lines 55-62): `limerclaw_pairings` join table
- `LimerClawNodeAgentRow` (lines 65-76): `limerclaw_node_agents` table

### `src/agent-types.ts` (lines 1-153)
Agent system type definitions. Uses the const-object-plus-type pattern for all enums.

**Enums (lines 1-45):**
- `AgentKind` (lines 3-9): `boss` | `persistent` | `on-demand`
- `AgentStatus` (lines 13-19): `active` | `paused` | `stopped`
- `ExecutionMode` (lines 23-28): `run-to-completion` | `interactive`
- `AgentEventType` (lines 32-45): Agent lifecycle and run events (includes `run_progress`)

**Core interfaces (lines 47-109):**
- `AgentInfo` (lines 49-59): Full agent record
- `AgentCreateRequest` (lines 63-69): Fields for creating an agent
- `AgentCreateResponse` (lines 71-73): Wraps `AgentInfo`
- `AgentUpdateRequest` (lines 75-81): Partial update fields
- `InteractivePrompt` (lines 85-92): Interactive agent question
- `InteractiveResponse` (lines 94-99): User response to interactive prompt
- `AgentEvent` (lines 103-110): Structured event for event log

**Decrypted payload types (lines 112-153):**
- `DecryptedMessageType` (lines 114-120): String literal union of all payload type discriminators
- `ChatMessage` (lines 124-128): Simple text message
- `ApprovalRequest` (lines 130-137): Tool-use approval request
- `ApprovalResponse` (lines 139-143): Approval decision (`approved` | `denied` | `approved_session` | `approved_agent` | `approved_global`)
- `DecryptedPayload` (lines 147-153): Discriminated union of all decrypted message shapes

### `src/runtime-state.ts` (lines 1-85)
Runtime state machine types for node components.

**Enums (lines 1-60):**
- `RuntimeStateComponent` (lines 3-12): `space` | `agent` | `session` | `node_identity` | `relay_connection`
- `SpaceRuntimeState` (lines 16-23): `uninitialized` | `ready` | `running`
- `AgentRuntimeState` (lines 25-31): `none` | `bound`
- `SessionRuntimeState` (lines 33-39): `idle` | `active`
- `NodeIdentityRuntimeState` (lines 41-50): `unknown` | `loaded` | `registering` | `registered` | `stale_detected`
- `RelayConnectionRuntimeState` (lines 52-60): `disconnected` | `connecting` | `connected` | `degraded`

**Types and interfaces (lines 62-85):**
- `RuntimeTransitionStatus` (line 62): `applied` | `rejected`
- `RuntimeStateTransitionEvent` (lines 64-74): Transition event (space_id, agent_id, component, from/to state, status, reason, details, created_at)
- `RuntimeStateSnapshot` (lines 76-85): Full state snapshot (all component states, current_agent_id, updated_at)

### `src/agent-automation.ts` (lines 1-99)
Agent runner targets, SDLC triggers, autonomy levels, and agent configuration.

**Enums (lines 1-34):**
- `AgentRunnerTarget` (lines 3-9): `github_actions` | `self_hosted` | `local`
- `TriggerEventType` (lines 13-22): `pull_request` | `issue_comment` | `push` | `schedule` | `workflow_dispatch` | `agent_completed`
- `AutonomyLevel` (lines 26-34): `L0` | `L1` | `L2` | `L3` | `L4`

**Configuration interfaces (lines 36-85):**
- `TriggerConfig` (lines 38-45): Event trigger with actions, paths, paths_exclude, pattern, cron
- `AutonomyConfig` (lines 47-51): initial_level, max_level, trust_threshold
- `ConcurrencyConfig` (lines 53-56): group, cancel_in_progress
- `ReportingConfig` (lines 58-62): github_check, pr_comment, check_name
- `RunnerConfig` (lines 64-68): target, timeout_minutes, concurrency
- `AgentConfig` (lines 70-78): name, description, triggers, runner, autonomy, reporting, memory
- `ProviderManifest` (lines 80-85): provider_id, cli_command, required_secrets, auth_mode

**Type guards (lines 89-99):**
- `isAgentRunnerTarget()` (lines 89-91)
- `isTriggerEventType()` (lines 93-95)
- `isAutonomyLevel()` (lines 97-99)

### `src/run-contracts.ts` (lines 1-173)
Run request/result types for agent execution. Imports from `./agent-automation`.

**Enums (lines 7-27):**
- `RunConclusion` (lines 7-15): `pass` | `warn` | `fail` | `error` | `skipped`
- `FindingSeverity` (lines 19-27): `critical` | `high` | `medium` | `low` | `info`

**Data interfaces (lines 31-92):**
- `Finding` (lines 31-38): severity, message, file, line, rule, category
- `Artifact` (lines 40-44): name, type (markdown/json/log), content
- `RunTelemetry` (lines 46-52): duration_ms, token_count, steps_executed, steps_skipped, llm_calls
- `RunContext` (lines 54-59): repo, pr_number, sha, ref
- `RunRequest` (lines 61-68): workflow_path, trigger, context, secrets_names, runner_target, agent_config
- `RunResult` (lines 70-78): conclusion, findings, artifacts, telemetry, started_at, completed_at, error
- `RunHeartbeat` (lines 80-85): run_id, status, progress_pct, current_step
- `RunDispatch` (lines 87-92): run_id, request, runner_id, dispatched_at

**Type guards (lines 96-173):**
- `isRunConclusion()` (lines 96-98)
- `isFindingSeverity()` (lines 100-102)
- `isTelemetry()` (private, lines 104-114)
- `isFinding()` (private, lines 116-120)
- `isArtifact()` (private, lines 122-131)
- `isRunContext()` (private, lines 133-137)
- `isRunResult()` (lines 139-160): Deep validation of conclusion, findings, artifacts, telemetry, timestamps
- `isRunRequest()` (lines 162-173): Validates workflow_path, trigger, context, secrets, runner_target

### `src/reporter-contracts.ts` (lines 1-51)
GitHub check/comment payloads and reporter output. Imports from `./run-contracts`.

- `GitHubCheckConclusionMap` (lines 6-12): Maps RunConclusion values to GitHub check conclusion strings
- `mapRunConclusionToGitHub()` (lines 14-16): Mapping function
- `GitHubCheckAnnotation` (lines 20-26): path, start_line, end_line, annotation_level, message
- `GitHubCheckPayload` (lines 28-35): name, head_sha, conclusion, summary, text, annotations
- `GitHubCommentPayload` (lines 39-43): marker_id, body, pr_number
- `ReporterOutput` (lines 47-51): check (optional), comment (optional), artifacts

### `src/control-plane-contracts.ts` (lines 1-187)
Run lifecycle management for the control plane. Imports from `./agent-automation` and `./run-contracts`.

**Enums (lines 6-15):**
- `RunRequestStatus` (lines 6-15): `queued` | `claimed` | `running` | `completed` | `failed` | `dead_letter`

**Core interfaces (lines 19-117):**
- `GitHubAppInstallation` (lines 19-30): Installation metadata
- `AgentDefinition` (lines 34-48): Agent definition record
- `AgentTrigger` (lines 52-62): Trigger binding for agent definition
- `ControlPlaneRunRequest` (lines 66-87): Full run request with lifecycle tracking (includes `source_run_request_id` and `inherited_variables` for chaining)
- `RunExecution` (lines 91-102): Execution record
- `OrgPolicy` (lines 106-116): Organization AI policy

**Runner contracts (lines 120-147):**
- `RunnerPollRequest` (lines 120-123)
- `RunnerPollResponse` (lines 125-128)
- `RunClaimResponse` (lines 130-134)
- `RunCompleteRequest` (lines 136-140)
- `RunFailRequest` (lines 142-147)

**Event/dispatch types (lines 151-187):**
- `NormalizedEvent` (lines 151-164): Normalized webhook event
- `DispatchOutcome` type (line 168): `dispatched` | `blocked` | `deduped` | `error`
- `DispatchResult` (lines 170-176): Dispatch outcome
- `PolicyDecision` (lines 180-186): Policy evaluation result

### `src/trust-autonomy-contracts.ts` (lines 1-98)
Trust scoring and autonomy gating. Imports `AutonomyLevel` from `./agent-automation`.

**Trust score (lines 5-21):**
- `TrustComponent` (lines 5-11): accuracy, reliability, safety, usefulness, consistency (all 0-1)
- `TrustScore` (lines 13-21): agent_definition_id, installation_id, score, components, effective_level, run_count_30d, last_calculated_at

**Action classification (lines 25-58):**
- `ActionCategory` (lines 25-33): `observe` | `comment` | `suggest` | `commit` | `approve`
- `ACTION_REQUIRED_LEVEL` (lines 35-41): Maps each action category to its required autonomy level
- `ActionClassification` (lines 43-48): action, category, required_level, description
- `AutonomyGateResult` (lines 50-58): allowed, action, agent_level, trust_score, requires_approval, approval_id, reason

**Approval routing (lines 62-84):**
- `ApprovalStatus` type (line 62): `pending` | `approved` | `denied` | `timed_out`
- `ApprovalTimeoutDefault` type (line 63): `deny` | `approve_l0`
- `ApprovalChannel` type (line 64): `github` | `mobile` | `timeout`
- `AgentApprovalRequest` (lines 66-84): Full approval request with context, timeout, resolution

**Agent memory (lines 88-98):**
- `AgentMemoryEntry` (lines 88-98): agent_definition_id, installation_id, repo, key, value, timestamps, expires_at

### `src/telemetry-intelligence-contracts.ts` (lines 1-232)
Telemetry records, aggregation rollups, digest, dispatch chains, and automation packs.

**Telemetry interfaces (lines 5-68):**
- `SeverityBreakdown` (lines 5-11): critical, high, medium, low, info
- `AgentTelemetryRecord` (lines 15-32): Per-run telemetry record
- `TelemetryDailyRollup` (lines 36-50): Daily aggregation
- `TelemetryWeeklyRollup` (lines 52-69): Weekly aggregation with estimated hours saved and recommendations

**Digest interfaces (lines 73-104):**
- `WeeklyDigest` (lines 73-80): Installation-wide weekly summary
- `DigestSummary` (lines 82-87): total_runs, issues_caught, estimated_hours_saved, accuracy_change_pct
- `AgentDigestDetail` (lines 89-98): Per-agent breakdown
- `HotspotEntry` (lines 100-104): path, finding_count, risk_trend

**Constants (lines 108-115):**
- `MANUAL_REVIEW_BENCHMARKS_MS` (lines 108-115): Estimated manual review time per agent type (in ms)

**Dispatch interfaces (lines 119-150):**
- `DispatchCondition` (lines 119-124): type (conclusion/finding_severity/risk_score/custom), operator, value, field
- `ResultMapping` (lines 126-129): variable_mappings, inherit_context
- `AgentDispatchRule` (lines 131-141): source/target agents, condition, result_mapping, enabled
- `AgentDispatchResult` (lines 143-150): rule_id, source/target run request IDs, dispatched, reason

**Automation pack interfaces (lines 154-188):**
- `PackCategory` type (line 154): `code-review` | `security` | `ci-triage` | `infrastructure` | `release` | `custom`
- `AutomationPackManifest` (lines 156-174): pack_id, name, version, description, category, workflow_slug, agent_config, default_trust_level, dispatch_rules
- `PackInstallRequest` (lines 176-181): pack_id, installation_id, repo_full_name, runner_target
- `PackInstallResult` (lines 183-188): agent_definition_id, trigger_ids, github_actions_file, dispatch_rule_ids

**Type guards (lines 192-231):**
- `isSeverityBreakdown()` (lines 192-202)
- `isDispatchCondition()` (lines 204-214)
- `isPackCategory()` (lines 216-220)
- `isHotspotEntry()` (lines 222-231)

### `src/setup-onboarding-contracts.ts` (lines 1-78)
GitHub App setup and onboarding contracts.

- `GitHubAppSetupRequest` (lines 7-13): app_id, webhook_secret, private_key_path, non_interactive
- `GitHubAppSetupResult` (lines 16-25): valid, app_id, app_name, installation_id, permissions_ok, missing_permissions, webhook_configured, errors
- `SetupValidationResult` (lines 28-33): step, valid, message, details
- `OnboardingStep` (lines 36-44): id, name, description, status, required, error, completed_at
- `HealthCheckResult` (lines 47-53): status, service, timestamp, uptime_seconds, components
- `HealthCheckComponent` (lines 56-62): name, status, latency_ms, message, last_checked
- `REQUIRED_GITHUB_APP_PERMISSIONS` (lines 65-71): const object (checks:write, contents:read, issues:write, metadata:read, pull_requests:write)
- `DEFAULT_WEBHOOK_EVENTS` (lines 74-78): readonly array (check_run, pull_request, push)

### `src/dashboard-contracts.ts` (lines 1-94)
Dashboard view-model contracts for the control plane SPA.

- `DashboardRunSummary` (lines 7-21): Run summary card (run_id, agent_id/name, repository, trigger_event, status, timestamps, duration, autonomy_level, trust_score, PR info)
- `DashboardAgentStatus` (lines 24-36): Agent card (agent_id, name, description, trigger_events, trust_level/score, last_run info, total_runs, success_rate, active)
- `DashboardTelemetrySummary` (lines 39-50): Telemetry overview (period, dates, runs, time saved, avg duration, agents active, top agents)
- `DashboardDigestView` (lines 53-71): Digest view (digest_id, installation_id, period, generated_at, summary_text, highlights, metrics, hotspots)
- `DashboardDispatchChain` (lines 74-84): Dispatch chain (rule_id, source/target agents, trigger_event, condition, trigger_count)
- `DashboardHealthStatus` (lines 87-94): System health (control_plane, database, github_app, queue_depth, active_runners, last_webhook_at)

### `src/deployment-profile-contracts.ts` (lines 1-78)
Deployment profile contracts for self-hosted Command Center.

**Enums (lines 8-13):**
- `DeploymentProfile` (lines 8-13): `postgres` | `supabase`

**Type guards (lines 15-17):**
- `isDeploymentProfile()` (lines 15-17)

**Interfaces (lines 21-78):**
- `DatabaseConfig` (lines 21-31): host, port, database, user, password_env, ssl_mode
- `PostgRESTConfig` (lines 35-44): url, db_schemas, db_anon_role, jwt_secret_env
- `ComposeConfig` (lines 48-62): profile, compose_file, database, postgrest, supabase_url, supabase_service_role_key_env, control_port, runner_name
- `SelfHostedValidationCheck` (lines 66-71): name, status (pass/fail/skip/warn), message, remediation
- `SelfHostedValidationResult` (lines 73-78): profile, passed, checks, timestamp

### `src/runner-provider-contracts.ts` (lines 1-72)
Runner provider configuration contracts.

- `ProviderKeyMapping` (lines 8-17): provider_id, api_key_env, required, display_name
- `RunnerProviderConfig` (lines 21-26): providers map, skip_validation flag
- `ProviderValidationCheck` (lines 30-36): provider_id, api_key_env, present, required, message
- `ProviderValidationResult` (lines 38-43): valid, checks, missing_required, missing_optional
- `DEFAULT_PROVIDER_MAPPINGS` (lines 47-60): Built-in mappings for Anthropic (required) and OpenAI (optional)
- `isProviderKeyMapping()` (lines 64-72): Type guard

### `src/setup-wizard-contracts.ts` (lines 1-64)
Setup wizard contracts for self-hosted onboarding flow.

**Enums (lines 8-17):**
- `SetupStepId` (lines 8-17): `env-check` | `db-migration` | `github-app` | `runner-registration` | `first-agent` | `verification-run`

**Type guards (lines 19-21):**
- `isSetupStepId()` (lines 19-21)

**Interfaces (lines 25-64):**
- `SetupStepResult` (lines 25-32): step_id, name, status (pass/fail/skip/pending), message, remediation, details
- `SetupStatus` (lines 36-41): complete, steps, current_step, timestamp
- `RunnerBootstrapToken` (lines 45-54): token, control_api_url, start_command, expires_at, used
- `SetupDiagnostic` (lines 58-64): category (env/database/github/runner/agent/network), severity (info/warning/error), message, remediation, timestamp

## Test Files

### `__tests__/contracts.test.ts`
Tests for agent-automation, run-contracts, and reporter-contracts:
- Enum uniqueness checks for `AgentRunnerTarget`, `TriggerEventType`, `AutonomyLevel`, `RunConclusion`, `FindingSeverity`, `RunConclusionEnum`, `SdlcTriggerEvent`
- Consistency between `RunConclusion`/`RunConclusionEnum` and `TriggerEventType`/`SdlcTriggerEvent` pairs
- Type guard tests: `isAgentRunnerTarget`, `isTriggerEventType`, `isAutonomyLevel`, `isRunConclusion`, `isFindingSeverity`
- JSON round-trip tests for `RunRequest` and `RunResult`
- `isRunResult` and `isRunRequest` negative cases (invalid telemetry, findings, artifacts, error, trigger, runner_target, secrets, context)
- GitHub conclusion mapping completeness
- No name collision checks between modules
- Interface structural tests for `AgentConfig`, `RunResult`, `ReporterOutput`

### `__tests__/telemetry-intelligence-contracts.test.ts`
Tests for telemetry, dispatch, and pack contracts:
- `isSeverityBreakdown` type guard (valid, zero values, null, missing fields, string values)
- `isDispatchCondition` type guard (all condition types/operators, invalid type/operator, null, missing value)
- `isPackCategory` type guard (all valid categories, invalid strings, non-strings)
- `isHotspotEntry` type guard (valid, all trends, invalid trend, non-numeric, null)
- `MANUAL_REVIEW_BENCHMARKS_MS` completeness and positivity
- `AGENT_COMPLETED` trigger event validity
- Interface structural tests for `AgentTelemetryRecord`, `WeeklyDigest`, `AgentDispatchRule`, `AutomationPackManifest`, `PackInstallResult`

### `__tests__/dashboard-contracts.test.ts`
Tests for dashboard view-model contracts:
- `DashboardRunSummary` required fields and all status values
- `DashboardAgentStatus` trust information
- `DashboardTelemetrySummary` period metrics
- `DashboardDigestView` metrics and hotspots
- `DashboardDispatchChain` agent-to-agent dispatch
- `DashboardHealthStatus` system health

### `__tests__/deployment-profile-contracts.test.ts`
Tests for deployment profile contracts:
- `DeploymentProfile` enum values
- `isDeploymentProfile` type guard
- `DatabaseConfig` required fields and SSL mode
- `PostgRESTConfig` required fields
- `ComposeConfig` for both postgres and supabase profiles
- `SelfHostedValidationCheck` all statuses and remediation
- `SelfHostedValidationResult` passing and failing scenarios

### `__tests__/runner-provider-contracts.test.ts`
Tests for runner provider contracts:
- `ProviderKeyMapping` required and optional fields
- `RunnerProviderConfig` with providers and skip_validation
- `ProviderValidationCheck` presence tracking
- `ProviderValidationResult` valid and invalid states
- `DEFAULT_PROVIDER_MAPPINGS` Anthropic and OpenAI entries
- `isProviderKeyMapping` type guard

### `__tests__/setup-wizard-contracts.test.ts`
Tests for setup wizard contracts:
- `SetupStepId` enum values
- `isSetupStepId` type guard
- `SetupStepResult` all statuses and remediation
- `SetupStatus` complete and incomplete scenarios
- `RunnerBootstrapToken` required fields and used state
- `SetupDiagnostic` all categories, severities, and remediation

### `__tests__/setup-onboarding-contracts.test.ts`
Tests for setup onboarding contracts:
- `GitHubAppSetupRequest` required and optional fields
- `GitHubAppSetupResult` valid and invalid setups
- `SetupValidationResult` step validation
- `OnboardingStep` all statuses
- `HealthCheckResult` healthy and degraded systems
- `REQUIRED_GITHUB_APP_PERMISSIONS` expected permissions
- `DEFAULT_WEBHOOK_EVENTS` essential events
