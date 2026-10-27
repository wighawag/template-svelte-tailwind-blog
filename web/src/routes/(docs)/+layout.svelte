<script lang="ts">
	import {page} from '$app/state';
	import {navTree, type NavItem} from '$lib/docs/pages';
	import {onMount} from 'svelte';
	import Search from '$lib/docs/Search.svelte';
	// the same custom element VitePress hosts; a Svelte site could import the component directly
	onMount(() => {
		if (document.querySelector('rocketh-playground')) void import('@rocketh/playground/element');
	});
	let {children} = $props();
	const sections = [
		{label: 'rocketh', root: 'documentation'},
		{label: 'hardhat-deploy', root: 'hardhat-deploy'},
	];
	const current = $derived(page.params.path?.replace(/\/$/, '') ?? '');
	const headings = $derived((page.data as any)?.meta?.headings ?? []);
</script>

{#snippet tree(items: NavItem[])}
	<ul>
		{#each items as item}
			<li>
				<a href="/{item.path}/" class:active={item.path === current}>{item.title}</a>
				{#if item.children.length}{@render tree(item.children)}{/if}
			</li>
		{/each}
	</ul>
{/snippet}

<div class="docs">
	<nav class="sidebar">
		<Search />
		{#each sections as s}
			<h4>{s.label}</h4>
			{@render tree(navTree(s.root))}
		{/each}
	</nav>
	<main data-pagefind-body>{@render children()}</main>
	<aside class="toc">
		{#if headings.length}
			<h4>On this page</h4>
			<ul>
				{#each headings as h}
					<li class="d{h.depth}"><a href="#{h.id}">{h.text}</a></li>
				{/each}
			</ul>
		{/if}
	</aside>
</div>

<style>
	.docs {
		display: grid;
		grid-template-columns: 16rem minmax(0, 1fr) 14rem;
		gap: 2rem;
		max-width: 90rem;
		margin: 0 auto;
		padding: 1rem;
	}
	.sidebar,
	.toc {
		position: sticky;
		top: 1rem;
		align-self: start;
		max-height: calc(100vh - 2rem);
		overflow: auto;
		font-size: 0.875rem;
	}
	.sidebar :global(ul ul) {
		padding-left: 0.75rem;
	}
	.active {
		font-weight: 600;
	}
	.toc .d3 {
		padding-left: 0.75rem;
	}
	@media (max-width: 64rem) {
		.docs {
			grid-template-columns: minmax(0, 1fr);
		}
		.sidebar,
		.toc {
			display: none;
		}
	}
</style>
