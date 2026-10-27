// SPIKE: every markdown page under src/docs, keyed by its URL path.
// `documentation/core-concepts/index.md` -> `documentation/core-concepts`
const modules = import.meta.glob('/src/docs/**/*.md');

export function pathOf(file: string): string {
	return file
		.replace(/^\/src\/docs\//, '')
		.replace(/\/index\.md$/, '')
		.replace(/\.md$/, '');
}

export const pages: Record<string, () => Promise<any>> = Object.fromEntries(
	Object.entries(modules).map(([file, load]) => [pathOf(file), load]),
);

// Titles and headings only (no page bodies), for the sidebar and the TOC.
const metas = import.meta.glob('/src/docs/**/*.md', {import: 'metadata', eager: true}) as Record<
	string,
	{title?: string; headings?: {depth: number; id: string; text: string}[]}
>;

export type NavItem = {path: string; title: string; children: NavItem[]};

/** The sidebar, generated from the folder tree: a page's children are the pages below it. */
export function navTree(section: string): NavItem[] {
	const items = Object.entries(metas)
		.map(([file, meta]) => ({path: pathOf(file), title: meta?.title ?? pathOf(file)}))
		.filter((p) => p.path === section || p.path.startsWith(section + '/'))
		.sort((a, b) => a.path.localeCompare(b.path));
	const byPath = new Map<string, NavItem>();
	const roots: NavItem[] = [];
	for (const p of items) {
		const node = {...p, children: []};
		byPath.set(p.path, node);
		const parent = p.path.split('/').slice(0, -1).join('/');
		(byPath.get(parent)?.children ?? roots).push(node);
	}
	return roots;
}
