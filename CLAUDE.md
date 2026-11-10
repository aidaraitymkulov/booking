# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Frontend take-home assignment: a mini app for booking a single meeting room for one working day. The spec is in `public/docs/ТЗ Frontend Engineer.pdf` (in Russian). It is a purely client-side SPA (Vite) with no real backend — the API is mocked with MSW.

Stack: Vite + React 19 + TypeScript, TanStack Query, axios, React Hook Form + Zod, Tailwind v4, shadcn/ui (`base-nova` style, built on Base UI), MSW, Vitest + Testing Library.

## Commands

```bash
npm run dev            # dev server
npm run build          # tsc -b && vite build
npm run typecheck      # tsc -b
npm run lint           # eslint .   (lint:fix to auto-fix)
npm run format         # prettier --write .   (format:check to only verify)
npm test               # vitest run
npx vitest run src/path/to/file.test.ts   # single file
npx vitest run -t "test name"             # single test by name
```

## Architecture

Feature-based layout. Layers inside `src/features/bookings/`:

- `model/` — pure logic with no React and no network: types, constants, `time.ts`, `rules.ts` (`validateBooking`, `hasOverlap`), the zod schema. This is the **single source of truth for the rules**: both the form and the MSW handlers use it, so the UI and the mock cannot drift apart. Unit tests go here.
- `api/` — network layer (axios instance; an interceptor maps HTTP status to `ApiError` / `ConflictError` (409) / `ValidationError` (400)). The UI knows nothing about axios; swapping the mock for a real API must not touch components.
- `hooks/` — TanStack Query wrappers (`useBookings`, mutations, `queryKeys`).
- `ui/` — feature components.
- `src/mocks/` — the whole "server" (MSW `handlers`, in-memory `db`, `seed`). Kept outside `features/` on purpose: delete the folder and the `enableMocking()` call in `main.tsx` and the app works against a real API. The worker must also start in production (deploy to Vercel/Netlify).
- `src/components/ui/` — generated shadcn components. Add them with `npx shadcn@latest add <name>`; edit by hand only when necessary. `cn` is imported from the `cn` package (this is how shadcn generates it); `src/lib/utils.ts` re-exports it.
- `src/shared/` — shared utilities and UI not tied to a feature.

### Domain rules (do not break)

- Inside the logic, time is minutes since midnight (`"10:30"` → `630`); the `HH:mm` format exists only at the UI/API boundary.
- Working window 09:00–18:00, `start < end`, duration 30 min – 2 h.
- Overlap: `a.start < b.end && b.start < a.end` (touching boundaries is allowed). When editing, exclude the booking by its own `id`.
- Compute "today" from the **local** date, never via `toISOString()` (timezone bug).
- Past dates: creation is blocked; for today, elapsed slots are unavailable.
- The mock server validates everything itself: 400 for invalid input, 409 for a conflict. On 409 the UI shows a clear message, refetches, keeps the form open and does not reset the entered values.

## Code conventions

These rules are mandatory for new code.

**Components and functions**

- React components are `const` + arrow function only, **not** `function` declarations:
  ```tsx
  export const BookingItem = ({ booking }: BookingItemProps) => { ... }
  ```
- Everything else (hooks, utilities, helpers) is also a `const` arrow function. Exception: generated shadcn files in `components/ui` — do not rewrite their style.
- Named exports only, no `export default` (exception: tool config files).
- Type props with a separate `type XxxProps`, not inline.
- Prefer `type` over `interface` unless `extends`/declaration merging is needed. The tsconfig enables `erasableSyntaxOnly`, so no `enum` and no parameter properties — use union literals or `as const` instead of `enum`.
- Type-only imports use `import type` / inline `type` (ESLint rule `consistent-type-imports`).

**Naming**

- Components, types, classes — `PascalCase`; variables, functions, hooks — `camelCase`; hooks start with `use`.
- Constant values (limits, settings) — `UPPER_SNAKE_CASE` (`WORK_START`, `MAX_DURATION`).
- Booleans use an `is`/`has`/`can` prefix (`hasOverlap`, `isPast`).
- Handlers: `handleXxx` inside a component, `onXxx` in props.
- Query keys go through a factory (`bookingKeys.byDate(date)`), not inline string literals.

**File names**

- Component: `PascalCase.tsx`, one main component per file, file name = component name (`BookingForm.tsx`).
- Hook: `useXxx.ts`, file name = hook name.
- Other modules (logic, api, constants): `camelCase.ts` (`rules.ts`, `bookingsApi.ts`).
- Tests live next to the code: `rules.test.ts`.
- Exception: `src/components/ui/*` stays `kebab-case.tsx`, as shadcn generates it.

**Imports and structure**

- Alias `@/` → `src/`. Relative imports are fine within one feature; across features and in shared code use `@/` only.
- Feature layers import only "downward": `ui` → `hooks` → `api` → `model`. `model` knows nothing about React or the network.
- Do not put business rules in components or MSW handlers — they live in `model/rules.ts`.

**Formatting**

Prettier (no semicolons, single quotes, trailing commas, Tailwind class sorting that also works inside `cn()`/`cva()`) and ESLint are already configured; run `npm run lint` and `npm run format:check` after changes.
