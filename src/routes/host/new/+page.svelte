<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import * as m from '$lib/paraglide/messages';

	let { form }: { form: { message?: string } | null } = $props();
</script>

<svelte:head><title>{m.create_room_title()}</title></svelte:head>

<main class="screen-shell">
	<section class="mx-auto flex min-h-svh w-full max-w-xl flex-col justify-center px-5 py-8">
		<a href={resolve('/')} class="brand-lockup mb-8"
			><span class="brand-mark">tf</span><span>Spaces.tf</span></a
		>
		<div class="panel p-5">
			<p class="kicker">{m.new_signal()}</p>
			<h1 class="mt-2 text-4xl font-black">{m.create_space_game()}</h1>
			<form method="POST" action="?/create" use:enhance class="mt-6 grid gap-4">
				<label class="grid gap-2">
					<span class="text-sm font-black uppercase tracking-[0.16em]">{m.title()}</span>
					<input
						class="field"
						name="title"
						placeholder={m.title_placeholder()}
						maxlength="80"
						autocomplete="off"
					/>
				</label>
				{#if form?.message}
					<p class="text-sm font-bold text-red-600 dark:text-red-300">{form.message}</p>
				{/if}
				<button class="big-button" type="submit">{m.create_room()}</button>
			</form>
		</div>
		<div class="safe-bottom muted-zone">{m.player_link_appears()}</div>
	</section>
</main>
