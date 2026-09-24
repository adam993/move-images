# Livefy Images — CLAUDE.md

Project-level rules. Loaded alongside the global `~/.claude/CLAUDE.md` (which `@`-imports the org-wide `~/.claude/CLAUDE-FLI-SETTINGS.md`); all apply, this project file wins on conflicts.

## Project at a glance

- **What**: browser-only editor that animates still images without AI — color analysis (OKLab palette, similar-color %), color-selected masks, WebGL2 displacement effects stacked as layers.
- **Stack**: Vite + React 19 + TypeScript + Tailwind 4 + shadcn/ui (radix-nova), zustand, Vitest. No Astro, no backend.
- **Dev**: `yarn dev` → `localhost:5173`. Tests: `yarn test`. Types + build: `yarn build`.
- **Package manager**: yarn 4 with `nodeLinker: node-modules` (deviation from the org PnP default, which targets Astro repos — Tailwind 4 native binaries and the shadcn CLI run without PnP workarounds).
- **Node**: 24 (`.nvmrc`).
- **Hosting**: none yet (editor-only POC).

## Project-specific guidance

- Pure logic (color, palette, masks, uniforms, store) lives in `src/lib`, `src/effects`, `src/state`, `src/render/uniforms.ts` and is unit-tested with synthetic images. WebGL and DOM code is verified in a real browser (Playwright screenshots), not in Vitest.
- Sample images in `public/samples/` are bundled because 3 of the 4 source URLs send no CORS header — a canvas can't read their pixels cross-origin.
- New effect types: add a folder under `src/effects/<name>/` with a param schema (`ParamSpec[]`), defaults and presets; controls render from the schema.
- The render loop reads `useEditorStore.getState()` every frame; don't route per-frame data through React state.

## Don't put here

- Task history. Use `local-claude-files/` and commit messages.
- Secrets or credentials. Use `.env`.
- Generic rules already in `~/.claude/CLAUDE-FLI-SETTINGS.md`.
