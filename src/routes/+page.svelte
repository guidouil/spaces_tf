<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import BuyMeACoffeeLink from '$lib/BuyMeACoffeeLink.svelte';
	import * as m from '$lib/paraglide/messages';
	import type { PageData } from './$types';

	let { data, form }: { data: PageData; form: { message?: string } | null } = $props();

	const ogTitle = 'Spaces.tf - Live Space Games';
	const ogDescription =
		'Host a live quiz or Spaces Bingo for your Twitter/X Space. Share one link and play in real time.';
</script>

<svelte:head>
	<title>{m.site_title()}</title>
	<meta name="description" content={m.site_description()} />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="Spaces.tf" />
	<meta property="og:title" content={ogTitle} />
	<meta property="og:description" content={ogDescription} />
	<meta property="og:url" content={data.social.url} />
	<meta property="og:image" content={data.social.image} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content="Spaces.tf live mini-games preview" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={ogTitle} />
	<meta name="twitter:description" content={ogDescription} />
	<meta name="twitter:image" content={data.social.image} />
</svelte:head>

<main class="screen-shell">
	<section class="mx-auto flex min-h-svh w-full max-w-4xl flex-col px-5 py-6 sm:px-8">
		<header class="flex items-center justify-between py-2">
			<a href={resolve('/')} class="brand-lockup" aria-label={m.home_aria()}>
				<span class="brand-mark">tf</span>
				<span>Spaces.tf</span>
			</a>
			<div class="flex items-center gap-3">
				<a class="text-xs font-black uppercase tracking-[0.18em] underline" href={resolve('/host')}>
					{m.my_games()}
				</a>
				<span
					class="rounded-full border border-current/20 px-3 py-1 text-xs font-black uppercase tracking-[0.2em]"
				>
					{m.live_quiz()}
				</span>
			</div>
		</header>

		<div
			class="grid flex-1 content-center gap-8 py-10 md:grid-cols-[1.05fr_0.95fr] md:items-center"
		>
			<div class="space-y-6">
				<p class="kicker">{m.home_kicker()}</p>
				<h1 class="max-w-3xl text-5xl font-black leading-[0.92] sm:text-7xl">
					{m.home_title()}
				</h1>
				<p class="max-w-xl text-lg font-semibold text-zinc-700 dark:text-zinc-200">
					{m.home_intro()}
				</p>

				<form
					method="POST"
					action="/host/new?/create"
					use:enhance
					class="panel max-w-xl space-y-4 p-4"
				>
					<label class="grid gap-2">
						<span class="text-sm font-black uppercase tracking-[0.16em]">{m.signal_name()}</span>
						<input
							name="title"
							class="field"
							placeholder={m.signal_name_placeholder()}
							maxlength="80"
							autocomplete="off"
						/>
					</label>
					<div class="game-type-grid">
						<label class="radio-chip game-type-chip">
							<input type="radio" name="gameType" value="quiz" checked />
							<span>{m.game_type_quiz()}</span>
						</label>
						<label class="radio-chip game-type-chip">
							<input type="radio" name="gameType" value="bingo" />
							<span>{m.game_type_bingo()}</span>
						</label>
					</div>
					{#if form?.message}
						<p class="text-sm font-bold text-red-600 dark:text-red-300">{form.message}</p>
					{/if}
					<button class="big-button w-full" type="submit">{m.create_space_game()}</button>
				</form>
			</div>

			<div class="panel tilt-card p-5">
				<div class="broadcast-card">
					<p class="kicker">{m.question_incoming()}</p>
					<h2 class="text-3xl font-black">{m.demo_question()}</h2>
					<div class="mt-6 grid gap-3">
						<div class="answer-demo">A. {m.demo_answer_a()}</div>
						<div class="answer-demo is-hot">B. {m.demo_answer_b()}</div>
						<div class="answer-demo">C. {m.demo_answer_c()}</div>
					</div>
					<div
						class="mt-6 flex items-center justify-between border-t border-current/15 pt-4 text-sm font-black"
					>
						<span>{m.survivor_podium()}</span>
						<span>+100</span>
					</div>
				</div>
			</div>
		</div>

		<footer class="safe-bottom muted-zone">
			<BuyMeACoffeeLink />
		</footer>
	</section>
</main>
