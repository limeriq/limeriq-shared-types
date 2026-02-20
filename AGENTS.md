# AGENTS.md - limeriq-shared-types

## What This Repo Is

`@darrenapfel/limeriq-shared-types` is a pure TypeScript types package that defines the wire formats, API contracts, database row types, agent automation contracts, run/reporter contracts, control plane contracts, trust/autonomy contracts, telemetry/intelligence contracts, setup/onboarding contracts, dashboard contracts, deployment profile contracts, runner provider contracts, setup wizard contracts, runtime state types, and constants shared across all limerIQ repositories. It has minimal devDependencies (`typescript` and `vitest`). It is published to GitHub Packages (`npm.pkg.github.com`) and consumed by downstream repos via the npm registry or git submodules.

## For Agents Working in This Repo

### Key Constraints

- **No runtime code except type guards and mapping functions.** The functions in this package are type guards (`isRelayControlMessage()`, `isEnvelope()`, `isAgentRunnerTarget()`, `isTriggerEventType()`, `isAutonomyLevel()`, `isRunConclusion()`, `isFindingSeverity()`, `isRunResult()`, `isRunRequest()`, `isSeverityBreakdown()`, `isDispatchCondition()`, `isPackCategory()`, `isHotspotEntry()`, `isDeploymentProfile()`, `isProviderKeyMapping()`, `isSetupStepId()`) and one mapping function (`mapRunConclusionToGitHub()`). Everything else is `interface`, `type`, or `const` declarations.
- **Agent types live in `src/agent-types.ts`.** This file defines all agent-system enums, interfaces, and the `DecryptedPayload` union.
- **Agent automation types live in `src/agent-automation.ts`.** This file defines runner targets, trigger events, autonomy levels, and full agent configuration interfaces.
- **Run contracts live in `src/run-contracts.ts`.** Run request/result types, findings, artifacts, telemetry, and related type guards.
- **Control plane contracts live in `src/control-plane-contracts.ts`.** Run request lifecycle, agent definitions, triggers, runner poll/claim, org policies, and dispatch.
- **Trust/autonomy contracts live in `src/trust-autonomy-contracts.ts`.** Trust scores, action classification, autonomy gating, approval routing, and agent memory.
- **Telemetry/intelligence contracts live in `src/telemetry-intelligence-contracts.ts`.** Per-run telemetry records, daily/weekly rollups, weekly digests, agent-to-agent dispatch rules, and automation packs.
- **No build step.** `tsconfig.json` sets `noEmit: true`. The `typecheck` script (`tsc --noEmit`) validates types only.
- **Tests use vitest.** Run `npm test` (or `vitest run`). Tests are in `__tests__/` and validate enum uniqueness, type guard correctness, JSON round-trip integrity, and interface structural constraints.
- **Barrel export pattern.** All types must be re-exported through `src/index.ts`. If you add a new file, add `export * from './your-file'` to `src/index.ts`.
- **Const-object-plus-type pattern for enums.** All enum-like values use a `const` object with an extracted `type` (e.g., `NodeMode` is both a `const` object and a `type`). Follow this pattern when adding new enums.

### Adding a New Type

1. Create or edit the appropriate file in `src/`.
2. Add the export to `src/index.ts` if it is a new file.
3. Run `npm run typecheck` to validate.
4. Run `npm test` to ensure no regressions.

### Adding a New Constant

Add to `src/constants.ts` following the existing pattern:
```typescript
export const MyEnum = {
  VALUE_A: 'value_a',
  VALUE_B: 'value_b',
} as const;
export type MyEnum = (typeof MyEnum)[keyof typeof MyEnum];
```

### Adding a New Type Guard

Add type guards to the same file as the types they validate, following the existing pattern:
```typescript
export function isMyType(value: unknown): value is MyType {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.field === 'string' && ...;
}
```
Add corresponding tests in `__tests__/`.

### Adding a New Contract Module

For new domain-specific contract files (e.g., a new subsystem):
1. Create `src/my-contracts.ts` with types, interfaces, and any type guards.
2. Add `export * from './my-contracts'` to `src/index.ts`.
3. Create `__tests__/my-contracts.test.ts` with structural and type guard tests.
4. Run `npm run typecheck && npm test`.

## For Agents in Other Repos (Integration Guide)

### How Each Repo Consumes This Package

| Repo | Mechanism | Path Alias |
|------|-----------|------------|
| `limeriq-relay` | Git submodule at `./shared-types/` | `@limerclaw/shared-types` -> `./shared-types/src` (tsconfig paths + vitest alias) |
| `limeriq-service` | Git submodule at `./shared-types/` | `@limerclaw/shared-types` -> `./shared-types/src` (tsconfig paths) |
| `limeriq-mobile-app` | Git submodule at `./shared-types/` | `@limerclaw/shared-types` -> `./shared-types/src` |
| `limeriq-control` | npm registry (GitHub Packages) | `@limerclaw/shared-types` -> `npm:@darrenapfel/limeriq-shared-types@^0.1.0` (npm alias in package.json) |

### Import Pattern

```typescript
import type { LimerClawEnvelope, PeerKind } from '@limerclaw/shared-types';
import { PROTOCOL_VERSION, isEnvelope } from '@limerclaw/shared-types';
```

### Key Types for Each Consumer

**Relay (`limeriq-relay`):**
- `LimerClawEnvelope`, `RelayControlMessage`, `RelayMessage` -- wire format
- `isRelayControlMessage()`, `isEnvelope()` -- type guards for message routing
- `PROTOCOL_VERSION`, `MAX_ENVELOPE_BYTES`, `MAX_BACKLOG_COUNT`, `BACKLOG_TTL_SECONDS`, `MAX_MSGS_PER_MINUTE` -- protocol constants
- `agent_id`, `message_type` on `LimerClawEnvelope` -- relay passes through but does not inspect

**Service (`limeriq-service`):**
- `DeviceRegisterRequest/Response`, `PairingCreateRequest/Response`, etc. -- API contract types
- `NodeAgentEntry`, `NodeAgentsListResponse`, `AgentSyncRequest/Response` -- agent sync API contracts
- `LimerClawNodeRow`, `LimerClawDeviceRow`, `LimerClawPairingSessionRow`, `LimerClawPairingRow`, `LimerClawNodeAgentRow` -- DB row types
- `NodeMode`, `NodeStatus`, `DeviceStatus`, `PairingSessionStatus`, `PairingStatus` -- status enums
- `AgentKind`, `AgentStatus`, `ExecutionMode` -- agent enums (imported from `agent-types`)
- `EventType`, `ALLOWED_EVENT_TYPES` -- push notification event types

**Mobile App (`limeriq-mobile-app`):**
- `LimerClawEnvelope`, `EncryptionBlock`, `EnvelopePeer` -- building envelopes to send
- `RelayControlMessage`, `isRelayControlMessage()` -- handling relay control messages
- `DeviceRegisterRequest/Response`, `PairingCreateRequest/Response`, `PairingResolveRequest/Response`, `PairingConfirmRequest/Response` -- API calls
- `PROTOCOL_VERSION`, `HEARTBEAT_INTERVAL_SECONDS`, `EncryptionScheme`, `PeerKind`, `BOSS_AGENT_ID` -- constants
- `AgentKind`, `AgentStatus`, `ExecutionMode`, `AgentEventType` -- agent enums
- `AgentInfo`, `AgentEvent`, `InteractivePrompt/Response`, `ChatMessage`, `ApprovalRequest/Response` -- agent interfaces
- `DecryptedPayload`, `DecryptedMessageType` -- decrypted envelope payload types
- `NodeAgentEntry`, `NodeAgentsListResponse` -- agent listing from service

**Control Plane (`limeriq-control`):**
- `AgentRunnerTarget`, `TriggerEventType`, `AutonomyLevel` -- agent automation enums
- `AgentConfig`, `TriggerConfig`, `RunnerConfig`, `AutonomyConfig`, `ReportingConfig` -- agent configuration
- `RunRequest`, `RunResult`, `RunConclusion`, `Finding`, `FindingSeverity`, `Artifact`, `RunTelemetry` -- run contracts
- `GitHubCheckPayload`, `GitHubCommentPayload`, `ReporterOutput`, `mapRunConclusionToGitHub()` -- reporter contracts
- `ControlPlaneRunRequest`, `RunRequestStatus`, `AgentDefinition`, `AgentTrigger` -- control plane lifecycle
- `RunnerPollRequest/Response`, `RunClaimResponse`, `RunCompleteRequest`, `RunFailRequest` -- runner poll/claim
- `NormalizedEvent`, `DispatchResult`, `PolicyDecision`, `OrgPolicy` -- event processing and policy
- `TrustScore`, `TrustComponent`, `ActionCategory`, `AutonomyGateResult`, `AgentApprovalRequest` -- trust and autonomy
- `AgentTelemetryRecord`, `TelemetryDailyRollup`, `TelemetryWeeklyRollup`, `WeeklyDigest` -- telemetry
- `AgentDispatchRule`, `DispatchCondition`, `AutomationPackManifest`, `PackInstallRequest/Result` -- dispatch and packs
- `DashboardRunSummary`, `DashboardAgentStatus`, `DashboardTelemetrySummary`, `DashboardHealthStatus` -- dashboard views
- `GitHubAppSetupRequest/Result`, `HealthCheckResult`, `OnboardingStep` -- setup/onboarding
- `DeploymentProfile`, `ComposeConfig`, `SelfHostedValidationResult` -- deployment profiles
- `RunnerProviderConfig`, `ProviderValidationResult`, `DEFAULT_PROVIDER_MAPPINGS` -- runner providers
- `SetupStepId`, `SetupStatus`, `RunnerBootstrapToken`, `SetupDiagnostic` -- setup wizard
- `RuntimeStateSnapshot`, `RuntimeStateTransitionEvent` -- runtime state tracking
