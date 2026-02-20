# BUILD.md - limeriq-shared-types

## Prerequisites

- Node.js (any recent LTS)
- npm

## Setup

```bash
npm install
```

This installs `typescript` and `vitest` (the devDependencies).

## Type Checking

```bash
npm run typecheck
# equivalent to: tsc --noEmit
```

There is no build/compile step. The `tsconfig.json` has `noEmit: true`. This package is consumed directly as TypeScript source via path aliases (git submodule consumers) or published to GitHub Packages for npm consumers.

## Testing

```bash
npm test
# equivalent to: vitest run
```

Tests live in `__tests__/` and cover:
- Enum uniqueness and string literal correctness
- Consistency between aliased enum pairs (`RunConclusion`/`RunConclusionEnum`, `TriggerEventType`/`SdlcTriggerEvent`)
- Type guard validation (positive and negative cases)
- JSON serialization round-trip integrity for `RunRequest` and `RunResult`
- GitHub conclusion mapping completeness
- Interface structural constraints (required fields, optional fields)
- Dashboard, telemetry, deployment profile, runner provider, setup wizard, and setup onboarding contract structures

Test files:
- `__tests__/contracts.test.ts` -- agent automation, run, reporter contracts
- `__tests__/telemetry-intelligence-contracts.test.ts` -- telemetry, dispatch, packs
- `__tests__/dashboard-contracts.test.ts` -- dashboard view-model contracts
- `__tests__/deployment-profile-contracts.test.ts` -- deployment profiles
- `__tests__/runner-provider-contracts.test.ts` -- runner provider config
- `__tests__/setup-wizard-contracts.test.ts` -- setup wizard flow
- `__tests__/setup-onboarding-contracts.test.ts` -- setup onboarding contracts

## tsconfig.json Configuration

| Option | Value | Purpose |
|--------|-------|---------|
| `target` | ES2020 | Baseline JS target |
| `module` | ESNext | ESM module format |
| `moduleResolution` | bundler | Modern resolution for bundled consumers |
| `strict` | true | Full strict mode |
| `noEmit` | true | No JS output -- type checking only |
| `isolatedModules` | true | Ensures compatibility with single-file transpilers |
| `declaration` | true | Allows declaration generation (though noEmit prevents it) |

The `include` array covers both `src/**/*.ts` and `__tests__/**/*.ts`.

## Publishing to GitHub Packages

The package is published to GitHub Packages (`npm.pkg.github.com`) as `@darrenapfel/limeriq-shared-types`. The `publishConfig` in `package.json` sets the registry:

```json
{
  "publishConfig": {
    "registry": "https://npm.pkg.github.com"
  }
}
```

Publishing happens on push to `main` (CI-driven). There is currently no `.github/workflows/` directory in the repo -- the CI workflow is configured at a higher level or in a parent repository.

## How to Add New Types

1. **New enum-like constant:** Add to `src/constants.ts` using the const-object-plus-type pattern:
   ```typescript
   export const MyStatus = {
     ACTIVE: 'active',
     INACTIVE: 'inactive',
   } as const;
   export type MyStatus = (typeof MyStatus)[keyof typeof MyStatus];
   ```

2. **New API contract:** Add request/response interfaces to `src/api-contracts.ts` with a comment indicating the endpoint.

3. **New DB row type:** Add to `src/db-types.ts`, importing any needed enum types from `./constants`.

4. **New agent-related type:** Add to `src/agent-types.ts`. Use the const-object-plus-type pattern for enums. If the type is a new decrypted payload shape, add it to the `DecryptedPayload` union and `DecryptedMessageType`.

5. **New agent automation type:** Add to `src/agent-automation.ts`. Configuration interfaces, runner targets, trigger types.

6. **New run contract type:** Add to `src/run-contracts.ts`. Include type guards for any new types that cross trust boundaries.

7. **New control plane type:** Add to `src/control-plane-contracts.ts`. Run lifecycle, agent definitions, runner contracts.

8. **New trust/autonomy type:** Add to `src/trust-autonomy-contracts.ts`. Trust scoring, action classification, approval flows.

9. **New telemetry type:** Add to `src/telemetry-intelligence-contracts.ts`. Telemetry records, rollups, dispatch rules, packs.

10. **New dashboard type:** Add to `src/dashboard-contracts.ts`. View-model contracts for the dashboard SPA.

11. **New deployment profile type:** Add to `src/deployment-profile-contracts.ts`. Deployment config, validation.

12. **New runner provider type:** Add to `src/runner-provider-contracts.ts`. Provider mappings, validation.

13. **New setup wizard type:** Add to `src/setup-wizard-contracts.ts`. Setup steps, status, tokens, diagnostics.

14. **New source file:** Create the file in `src/`, then add `export * from './your-file'` to `src/index.ts`.

15. **Validate:** Run `npm run typecheck && npm test` to ensure no errors.

## Consuming This Package

### Via Git Submodule (relay, service, mobile app)

Other repos reference this package via git submodule and tsconfig path alias:

```json
// tsconfig.json in consuming repo
{
  "compilerOptions": {
    "paths": {
      "@limerclaw/shared-types": ["./shared-types/src"]
    }
  }
}
```

If the consuming repo uses vitest, add a matching alias in `vitest.config.ts`:
```typescript
resolve: {
  alias: {
    '@limerclaw/shared-types': './shared-types/src',
  },
},
```

### Via npm Registry (limeriq-control)

`limeriq-control` consumes this package from GitHub Packages using an npm alias in its `package.json`:

```json
{
  "dependencies": {
    "@limerclaw/shared-types": "npm:@darrenapfel/limeriq-shared-types@^0.1.0"
  }
}
```

This allows `limeriq-control` to import from `@limerclaw/shared-types` the same way submodule consumers do, while fetching the package from the npm registry.
