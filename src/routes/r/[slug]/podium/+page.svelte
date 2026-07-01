<script lang="ts">
	import { resolve } from '$app/paths';
	import * as m from '$lib/paraglide/messages';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head><title>{m.podium_page_title({ title: data.room.title })}</title></svelte:head>

<main class="screen-shell">
	<section class="mx-auto flex min-h-svh w-full max-w-xl flex-col px-5 py-5">
		<header class="flex items-center justify-between py-2">
			<a href={resolve('/')} class="brand-lockup"
				><span class="brand-mark">tf</span><span>Spaces.tf</span></a
			>
			<a class="status-pill" href={resolve(`/r/${data.room.slug}`)}>{m.room()}</a>
		</header>

		<div class="grid flex-1 content-center gap-5 py-8">
			<section class="panel p-5 text-center">
				<p class="kicker">{m.end_signal()}</p>
				<h1 class="mt-2 text-5xl font-black">{m.survivor_podium()}</h1>
				<p class="mt-3 font-bold text-zinc-600 dark:text-zinc-300">{data.room.title}</p>
			</section>

			<section class="grid gap-3">
				{#each data.podium as player, index (player.id)}
					<div class="podium-row" class:first={index === 0}>
						<span>#{index + 1}</span>
						<strong>{player.nickname}</strong>
					<b>{player.score} {m.points_short()}</b>
					</div>
				{:else}
					<div class="panel p-5 text-center font-black">{m.no_survivors()}</div>
				{/each}
			</section>
		</div>

		<div class="safe-bottom muted-zone">{m.podium_footer()}</div>
	</section>
</main>
