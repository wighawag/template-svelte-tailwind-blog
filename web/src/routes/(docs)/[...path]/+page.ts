import {error} from '@sveltejs/kit';
import {pages} from '$lib/docs/pages';
import type {EntryGenerator, PageLoad} from './$types';

export const prerender = true;

export const entries: EntryGenerator = () => Object.keys(pages).map((path) => ({path}));

export const load: PageLoad = async ({params}) => {
	const load = pages[params.path.replace(/\/$/, '')];
	if (!load) error(404, `no page ${params.path}`);
	const mod = await load();
	return {content: mod.default, meta: mod.metadata ?? {}, path: params.path};
};
