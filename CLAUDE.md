# Livefy Images — CLAUDE.md

Project-level rules. Loaded alongside the global `~/.claude/CLAUDE.md` (which `@`-imports the org-wide `~/.claude/CLAUDE-FLI-SETTINGS.md`); all apply, this project file wins on conflicts.

## Project at a glance

- **What**: browser-only editor that animates still images without AI — color analysis (OKLab palette, similar-color %), color-selected masks, WebGL2 displacement effects stacked as layers, MP4/WebM/GIF export.
- **Stack**: Vite + React 19 + TypeScript + Tailwind 4 + shadcn/ui (radix-nova), zustand, Vitest. No Astro, no backend.
- **Dev**: `yarn dev` → `localhost:5173`. Tests: `yarn test`. Types + build: `yarn build`.
- **Package manager**: yarn 4 with `nodeLinker: node-modules` (deviation from the org PnP default, which targets Astro repos — Tailwind 4 native binaries and the shadcn CLI run without PnP workarounds).
- **Node**: 24 (`.nvmrc`).
- **Repo**: https://github.com/adam993/move-images (public). No hosting yet.
- **License**: GPL-3.0-only (`LICENSE`); vendored MIT shader code is credited in `THIRD_PARTY_NOTICES.md` — keep it current when vendoring more.

## Project-specific guidance

- Pure logic (color, palette, masks, uniforms, store) lives in `src/lib`, `src/effects`, `src/state`, `src/render/uniforms.ts` and is unit-tested with synthetic images. WebGL and DOM code is verified in a real browser (Playwright screenshots), not in Vitest.
- Sample images in `public/samples/` are bundled because 3 of the 4 source URLs send no CORS header — a canvas can't read their pixels cross-origin.
- New effect types: add a folder under `src/effects/<name>/` with a param schema (`ParamSpec[]`), defaults and presets; controls render from the schema.
- The render loop reads `useEditorStore.getState()` every frame; don't route per-frame data through React state.
- Effect distances (amplitude, scale, feather) are reference px — px at a 1000 px long side (`src/lib/units.ts`) — so presets look the same at any image or export size.
- Export (`src/export/`) renders offline on its own `OffscreenCanvas` renderer. mediabunny and gifenc are reached only through `await import()`; a static import pulls ~200 kB into the main bundle.
- Sample images in `public/samples/` are third-party art, not covered by the GPL.

## Don't put here

- Task history. Use `local-claude-files/` and commit messages.
- Secrets or credentials. Use `.env`.
- Generic rules already in `~/.claude/CLAUDE-FLI-SETTINGS.md`.
