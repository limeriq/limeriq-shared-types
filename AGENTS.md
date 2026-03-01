# AGENTS.md - limeriq-shared-types

## What This Repo Is

`@limerclaw/shared-types` is a pure TypeScript types package that defines the wire formats, API contracts, database row types, and constants shared across all LimerClaw repositories. It has zero runtime dependencies -- only `typescript` as a devDependency. It is never compiled or published to npm; consumers reference the source directly via path aliases or git submodules.

## For Agents Working in This Repo

### Key Constraints

- **No runtime code except type guards.** The only functions in this package are `isRelayControlMessage()` and `isEnvelope()` in `src/envelope.ts`. Everything else is `interface`, `type`, or `const` declarations.
- **Agent types live in `src/agent-types.ts`.** This file defines all agent-system enums, interfaces, and the `DecryptedPayload` union. It follows the same const-object-plus-type pattern used elsewhere.
- **No build step.** `tsconfig.json` sets `noEmit: true`. The `typecheck` script (`tsc --noEmit`) validates types only.
- **Barrel export pattern.** All types must be re-exported through `src/index.ts`. If you add a new file, add `export * from './your-file'` to `src/index.ts`.
- **Const-object-plus-type pattern for enums.** All enum-like values use a `const` object with an extracted `type` (e.g., `NodeMode` is both a `const` object and a `type`). Follow this pattern when adding new enums.

### Adding a New Type

1. Create or edit the appropriate file in `src/`.
2. Add the export to `src/index.ts` if it is a new file.
3. Run `npm run typecheck` to validate.

### Adding a New Constant

Add to `src/constants.ts` following the existing pattern:
```typescript
export const MyEnum = {
  VALUE_A: 'value_a',
  VALUE_B: 'value_b',
} as const;
export type MyEnum = (typeof MyEnum)[keyof typeof MyEnum];
```

## For Agents in Other Repos (Integration Guide)

### How Each Repo Consumes This Package

| Repo | Mechanism | Path Alias |
|------|-----------|------------|
| `limeriq-relay` | Git submodule at `./shared-types/` | `@limerclaw/shared-types` -> `./shared-types/src` (tsconfig paths + vitest alias) |
| `limeriq-service` | Git submodule at `./shared-types/` | `@limerclaw/shared-types` -> `./shared-types/src` (tsconfig paths) |
| `limeriq-mobile-app` | Git submodule at `./shared-types/` | `@limerclaw/shared-types` -> `./shared-types/src` |

### Import Pattern

```typescript
import type { LimerClawEnvelope, PeerKind } from '@limerclaw/shared-types';
import { PROTOCOL_VERSION, isEnvelope } from '@limerclaw/shared-types';
```

## Pin-Update PR Rules (Downstream Consumers)

Changes in this repo often require a consumer pin bump PR in `limeriq-client`.

When contract exports change:

1. Merge shared-types PR to `main`.
2. Open follow-up PR in `limeriq-client` to update pinned commit SHA in `package.json` and `package-lock.json`.
3. Regenerate lockfile with pinned toolchain:
   - `npx -y npm@10.9.0 install --package-lock-only --ignore-scripts`
4. Validate in `limeriq-client` before merge:
   - `npm run check:shared-types-dep`
   - `npx tsc --noEmit`
   - `npx jest --no-coverage --testPathIgnorePatterns='integration|e2e'`
   - `npm run compile`

Do not assume downstream consumers track `latest`; they are intentionally pinned for deterministic CI.

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
