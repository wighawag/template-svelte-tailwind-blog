# SPIKE: the rocketh docs on a SvelteKit docs site derived from this blog template

Throwaway. It answers one question: what does it cost to serve the real rocketh docs (38 Markdown pages, VitePress today) from a SvelteKit site derived from template-svelte-tailwind-blog? Not for merging.

Run: `pnpm install`, then `cd web && pnpm build && python3 -m http.server -d build 4173`.

What was added (about 300 lines): `web/src/lib/markdown/docsPlugins.js` (VitePress `{#id}` anchors, `::: code-group` tabs, compact `:::` containers, Shiki highlighting, headings for the TOC), `web/src/lib/docs/` (pages from a glob, sidebar from the folder tree, Pagefind search), `web/src/routes/(docs)/` (catch-all route and docs layout). Content is a copy of rocketh's `documentation/` and `hardhat-deploy/` in `web/src/docs/`.
