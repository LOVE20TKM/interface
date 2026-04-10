# Shared AI Guide

This document is the single shared source of repository guidance for AI coding assistants working in this project.

Use this file for repository-wide instructions. Keep `AGENTS.md` and `CLAUDE.md` as thin entrypoints that point here instead of duplicating the same content.

## Project Overview

This repository is a Next.js frontend for the LOVE20 Protocol.

Primary stack:

- Next.js 14 with the Pages Router
- React 18
- wagmi 2 + viem 2 for wallet and contract interactions
- TanStack Query for cached reads
- React Hook Form + Zod for forms and validation
- Tailwind CSS, DaisyUI, and Radix UI components

## Development Commands

```bash
# Local development server
yarn dev

# Production build
yarn build

# Build validation using NODE_ENV=test
yarn test

# Public test build
yarn public-test

# Start the production server
yarn start

# Regenerate frontend contract ABIs
yarn generate:abi

# Regenerate env config
yarn generate:env

# Regenerate selectors / error selectors
yarn generate:selectors
yarn generate:errors
```

## Repository Map

Primary application code lives under `src/`.

- `src/pages/`: route entry points using the Pages Router
- `src/components/`: reusable UI grouped by feature
- `src/hooks/`: contract hooks, composite hooks, and context helpers
- `src/lib/`: shared utilities and wrappers
- `src/contexts/`: React contexts including `TokenContext`
- `src/abis/`: generated contract ABI modules
- `src/errors/`: contract error parsing and message mapping
- `src/config/`: token, security, and extension config
- `scripts/`: generation and build helper scripts

## Build And Runtime Notes

- The app uses the Pages Router, not the App Router.
- `next.config.js` enables `output: 'export'` outside development, so production-style builds are static exports.
- `src/wagmi.ts` sets `ssr: false` to match the static-export client-side wallet setup.
- Sentry is configured in the Next.js app and build config.
- `yarn test` is a build validation step, not a dedicated unit-test suite.

## Environment And Networks

- `NEXT_PUBLIC_CHAIN` selects the active chain configuration in `src/wagmi.ts`.
- Current chain configs include `mainnet`, `sepolia`, `bscTestnet`, `anvil`, `thinkium801`, and `thinkium70001`.
- Contract addresses and enabled features are environment-dependent.
- Common env files in this repo include `.env.development`, `.env.test`, `.env.production`, `.env.public_test`, and `.env.local`.

## Working Rules

### Token Data

- Token base metadata such as `name`, `symbol`, `decimals`, and related addresses should come from `TokenContext`.
- Use either `useTokenContext()` or `useContext(TokenContext)` to access that shared token state.
- Do not add ad-hoc RPC reads for token base metadata when `TokenContext` already provides it.

### Routing Conventions

- Use `symbol=${token.symbol}` as the token identifier in URLs.
- Avoid putting `tokenAddress` into user-facing route query strings unless there is no existing symbol-based route pattern.
- Action-related pages should use `id=${actionId}` instead of `actionId=${actionId}`.

### Contract Surface Changes

- After contract interface changes, regenerate frontend ABIs with `yarn generate:abi`.
- If selector or error lookup behavior depends on the changed ABI surface, also regenerate selectors or error selectors.

## Maintenance

- Update this file when shared repository guidance changes.
- Keep `AGENTS.md` and `CLAUDE.md` minimal and tool-specific.
- Prefer stable guidance over exact dependency patch versions unless the exact version is operationally important.
