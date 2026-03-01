# BUILD.md - limeriq-shared-types

## Purpose

`@darrenapfel/limeriq-shared-types` is the shared contract package for limeriq repos.
It ships compiled `dist/` artifacts and is consumed by `limeriq-client` via a pinned git commit.

## Toolchain

- Node.js (CI currently runs Node 20 for this repo)
- npm

## Local Build + Test

From repo root:

```bash
npm ci
npm run typecheck
npm run build
npm test
```

## Packaging Behavior

Current scripts are intentionally set so git/source installs produce usable artifacts:

- `prepare` -> `npm run build`
- `prepack` -> `npm run build`

Published/packed files are controlled by `package.json` `files`:

- `dist/`
- `README.md`

## When to Trigger Consumer Pin Updates

Update downstream pins (especially in `limeriq-client`) when:

- exported types/interfaces/constants change
- new files are exported from `src/index.ts`
- contract shape changes are merged to `main`

## Shared-Types Pin Update Workflow (to limeriq-client)

1. Merge shared-types PR to `main`.
2. Copy the merged commit SHA.
3. In `limeriq-client`, update dependency pin in `package.json`.
4. Regenerate lockfile in `limeriq-client`:

```bash
npx -y npm@10.9.0 install --package-lock-only --ignore-scripts
```

5. Run client validation checks before PR:

```bash
npm run check:shared-types-dep
npx tsc --noEmit
npx jest --no-coverage --testPathIgnorePatterns='integration|e2e'
npm run compile
```

## CI Tasks to Watch

### This repo (`limeriq-shared-types`)

Expected CI checks in `.github/workflows/ci.yml`:

- `typecheck`
- `test`
- `publish` (push events only)

### Consumer repo (`limeriq-client`)

Pin-update PR should pass:

- `dependency-guard`
- `typecheck`
- `test`
- `compile`

## Notes for Agents

- Keep exports centralized in `src/index.ts`.
- Do not introduce runtime-heavy logic here; keep this package contract-focused.
- Treat shared-types changes as cross-repo changes that require explicit consumer pin updates.
