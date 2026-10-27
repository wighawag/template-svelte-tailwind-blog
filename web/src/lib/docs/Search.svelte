<script lang="ts">
	// SPIKE: Pagefind's JS API over the static build (`pagefind --site build` after `vite build`).
	let query = $state('');
	let results: {url: string; title: string; excerpt: string}[] = $state([]);
	let pagefind: any;
	async function search() {
		const path = '/pagefind/pagefind.js';
		pagefind ??= await import(/* @vite-ignore */ path);
		const found = await pagefind.search(query);
		results = await Promise.all(
			found.results.slice(0, 8).map(async (r: any) => {
				const d = await r.data();
				return {url: d.url, title: d.meta.title, excerpt: d.excerpt};
			}),
		);
	}
</script>

<input type="search" placeholder="Search the docs" bind:value={query} oninput={search} />
{#if query && results.length}
	<ul class="results">
		{#each results as r}
			<li><a href={r.url}>{r.title}</a><p>{@html r.excerpt}</p></li>
		{/each}
	</ul>
{/if}
