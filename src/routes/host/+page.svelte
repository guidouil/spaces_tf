<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import * as m from '$lib/paraglide/messages';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData | null } = $props();
	let roomToDelete = $state<PageData['rooms'][number] | null>(null);
</script>

<svelte:head><title>{m.my_games_page_title()}</title></svelte:head>

<main class="screen-shell">
	<section class="mx-auto flex min-h-svh w-full max-w-5xl flex-col px-5 py-6 sm:px-8">
		<header class="flex items-center justify-between gap-4 py-2">
			<a href={resolve('/')} class="brand-lockup" aria-label={m.home_aria()}>
				<span class="brand-mark">tf</span>
				<span>Spaces.tf</span>
			</a>
			<a class="small-button" href={resolve('/host/new')}>{m.create_room()}</a>
		</header>

		<section class="grid flex-1 content-center gap-5 py-10">
			<div>
				<p class="kicker">Dashboard host</p>
				<h1 class="mt-2 text-4xl font-black sm:text-6xl">{m.my_games_heading()}</h1>
				<p class="mt-3 max-w-2xl text-base font-semibold text-zinc-700 dark:text-zinc-200">
					{m.my_games_intro()}
				</p>
			</div>

			{#if form?.message}
				<p class="panel p-4 text-sm font-bold text-red-600 dark:text-red-300">{form.message}</p>
			{/if}

			<div class="grid gap-4">
				{#each data.rooms as room (room.id)}
					<article class="panel p-4">
						<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
							<div class="min-w-0">
								<p
									class="text-xs font-black uppercase tracking-[0.16em] text-zinc-600 dark:text-zinc-300"
								>
									{room.status} · {m.room()}
									{room.slug}
								</p>
								<h2 class="mt-1 truncate text-2xl font-black">{room.title}</h2>
								<p class="mt-1 text-sm font-bold text-zinc-600 dark:text-zinc-300">
									{m.last_activity({ date: new Date(room.updatedAt).toLocaleDateString() })}
								</p>
							</div>
							<div class="flex flex-wrap gap-3">
								<a class="small-button" href={resolve('/host/[slug]', { slug: room.slug })}>
									{m.host_dashboard()}
								</a>
								<a class="small-button" href={resolve('/r/[slug]', { slug: room.slug })}>
									{m.player_link()}
								</a>
								<button
									class="small-button danger"
									type="button"
									onclick={() => (roomToDelete = room)}
								>
									{m.delete()}
								</button>
							</div>
						</div>
					</article>
				{:else}
					<div class="panel p-5">
						<p class="kicker">{m.no_games()}</p>
						<h2 class="mt-2 text-2xl font-black">{m.no_games_found()}</h2>
						<a class="big-button mt-5 inline-flex items-center" href={resolve('/host/new')}>
							{m.create_space_game()}
						</a>
					</div>
				{/each}
			</div>
		</section>

		<div class="safe-bottom muted-zone">{m.twitter_safe_zone()}</div>
	</section>

	{#if roomToDelete}
		<button
			class="fixed inset-0 z-30 cursor-default bg-black/55 backdrop-blur-sm"
			type="button"
			aria-label={m.delete_dialog_cancel_label()}
			onclick={() => (roomToDelete = null)}
		></button>
		<div class="fixed inset-x-4 top-1/2 z-40 mx-auto max-w-lg -translate-y-1/2">
			<section
				class="panel overflow-hidden bg-[#fffbe9] p-0 text-[#18130c] dark:bg-[#151515] dark:text-[#fffbe9]"
			>
				<div class="border-b-2 border-current/20 bg-[#ff4f87] p-5 text-[#111111]">
					<p class="text-xs font-black uppercase tracking-[0.18em]">{m.delete_dialog_kicker()}</p>
					<h2 class="mt-2 text-3xl font-black">{m.delete_dialog_title()}</h2>
				</div>
				<div class="grid gap-5 p-5">
					<div>
						<p
							class="text-sm font-black uppercase tracking-[0.16em] text-zinc-600 dark:text-zinc-300"
						>
							{m.room()}
							{roomToDelete.slug}
						</p>
						<p class="mt-1 text-2xl font-black">{roomToDelete.title}</p>
					</div>
					<p class="font-semibold text-zinc-700 dark:text-zinc-200">
						{m.delete_dialog_body()}
					</p>
					<div class="grid gap-3 sm:grid-cols-2">
						<button
							class="small-button bg-transparent"
							type="button"
							onclick={() => (roomToDelete = null)}
						>
							{m.cancel()}
						</button>
						<form
							method="POST"
							action="?/delete"
							use:enhance={() => {
								roomToDelete = null;
							}}
						>
							<input type="hidden" name="slug" value={roomToDelete.slug} />
							<button class="small-button danger w-full" type="submit">{m.confirm_delete()}</button>
						</form>
					</div>
				</div>
			</section>
		</div>
	{/if}
</main>
