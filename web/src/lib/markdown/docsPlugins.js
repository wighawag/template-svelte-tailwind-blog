// SPIKE: what a docs site needs on top of the blog's markdown pipeline.
import {createHighlighter} from 'shiki';
import {escapeSvelte} from 'mdsvex';

/** @param {any} node */
function textOf(node) {
	if (!node) return '';
	if (typeof node.value === 'string') return node.value;
	return (node.children ?? []).map(textOf).join('');
}

function slugify(text) {
	return text
		.toLowerCase()
		.trim()
		.replace(/[`'"]/g, '')
		.replace(/[^a-z0-9\s-]/g, '')
		.replace(/\s+/g, '-');
}

/**
 * VitePress `## Title {#custom-id}` anchors: strip the suffix and use it as the id. Every other
 * heading gets a slug id. Also records h2/h3 into the frontmatter (`metadata.headings`) for the
 * on-this-page TOC, and the first h1 as `metadata.title` when the page has no frontmatter title.
 */
export function headings() {
	return (tree, file) => {
		const fm = (file.data.fm ??= {});
		const list = [];
		const visit = (node) => {
			if (node.type === 'heading') {
				const last = node.children[node.children.length - 1];
				let id;
				if (last?.type === 'text') {
					const m = last.value.match(/\s*\{#([\w-]+)\}\s*$/);
					if (m) {
						id = m[1];
						last.value = last.value.slice(0, m.index);
					}
				}
				const text = textOf(node);
				id ??= slugify(text);
				node.data = {...node.data, hProperties: {...node.data?.hProperties, id}};
				if (node.depth === 1 && !fm.title) fm.title = text;
				if (node.depth === 2 || node.depth === 3) list.push({depth: node.depth, id, text});
			}
			(node.children ?? []).forEach(visit);
		};
		visit(tree);
		fm.headings = list;
	};
}

/**
 * VitePress `::: code-group`: consecutive fences labelled ```lang [label]``` become one tabbed
 * block. CSS-only tabs (radio inputs), so no script is needed.
 */
let groupCounter = 0;
export function codeGroups() {
	return (tree) => {
		const walk = (parent) => {
			const kids = parent.children ?? [];
			for (let i = 0; i < kids.length; i++) {
				const k = kids[i];
				if (k.type === 'paragraph' && textOf(k).trim() === '::: code-group') {
					let j = i + 1;
					const fences = [];
					while (j < kids.length && kids[j].type === 'code') fences.push(kids[j++]);
					if (j < kids.length && textOf(kids[j]).trim() === ':::' && fences.length) {
						const g = `cg${groupCounter++}`;
						const html = [`<div class="code-group">`];
						fences.forEach((f, n) => {
							const label = (f.meta ?? '').match(/\[(.+?)\]/)?.[1] ?? f.lang ?? `tab ${n + 1}`;
							html.push(
								`<input type="radio" name="${g}" id="${g}-${n}" ${n === 0 ? 'checked' : ''}><label for="${g}-${n}">${label}</label>`,
							);
						});
						const node = {type: 'html', value: html.join('') + '<div class="code-group-panels">'};
						const panels = fences.map((f) => ({
							...f,
							meta: (f.meta ?? '').replace(/\[.+?\]/, '').trim() || null,
						}));
						kids.splice(i, j - i + 1, node, ...panels, {type: 'html', value: '</div></div>'});
						i += panels.length + 1;
					}
				} else walk(k);
			}
		};
		walk(tree);
	};
}

const highlighterPromise = createHighlighter({
	themes: ['github-light', 'github-dark'],
	langs: ['typescript', 'javascript', 'bash', 'shell', 'json', 'solidity', 'markdown', 'diff', 'yaml', 'text'],
});

/** mdsvex highlighter: Shiki, dual theme, escaped so Svelte does not read `{` in code. */
export async function highlight(code, lang) {
	const h = await highlighterPromise;
	const language = h.getLoadedLanguages().includes(lang ?? '') ? lang : 'text';
	const html = h.codeToHtml(code, {
		lang: language,
		themes: {light: 'github-light', dark: 'github-dark'},
	});
	return `{@html \`${escapeSvelte(html)}\`}`;
}

/**
 * VitePress allows `::: tip` / body / `:::` with no blank lines between them, which leaves all
 * three in ONE paragraph and out of reach of the container transform. Put each `:::` line in a
 * paragraph of its own, outside code fences, before mdsvex parses the file.
 */
export function separateContainerLines() {
	return {
		name: 'separate-container-lines',
		markup({content, filename}) {
			if (!filename?.endsWith('.md')) return;
			let inFence = false;
			const out = [];
			for (const line of content.split('\n')) {
				if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
				if (!inFence && /^:::/.test(line)) out.push('', line, '');
				else out.push(line);
			}
			return {code: out.join('\n')};
		},
	};
}
