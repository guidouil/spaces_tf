<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import * as m from '$lib/paraglide/messages';
	import { onMount, untrack } from 'svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData | null } = $props();
	const initialSnapshot = untrack(() => data.snapshot!);
	let snapshot = $state(initialSnapshot);
	let connected = $state(false);

	onMount(() => {
		if (!data.roomExists || !data.player) return;

		const source = new EventSource(`/r/${snapshot.room.slug}/events`);
		source.addEventListener('open', () => (connected = true));
		source.addEventListener('error', () => (connected = false));
		source.addEventListener('snapshot', (event) => {
			snapshot = JSON.parse((event as MessageEvent).data);
		});

		return () => source.close();
	});
</script>

<svelte:head>
	<title>{snapshot?.room?.title ?? 'Room'} - Spaces.tf</title>
</svelte:head>

<main class="screen-shell">
	<section class="mx-auto flex min-h-svh w-full max-w-xl flex-col px-5 py-5">
		<header class="flex items-center justify-between gap-3 py-2">
			<a href={resolve('/')} class="brand-lockup"
				><span class="brand-mark">tf</span><span>Spaces.tf</span></a
			>
			<span class:live-dot={connected} class="status-pill">
				{connected ? 'live' : 'signal'}
			</span>
		</header>

		{#if !data.roomExists}
			<div class="grid flex-1 place-items-center">
				<div class="panel p-5 text-center">
					<p class="kicker">{m.signal_lost()}</p>
					<h1 class="mt-2 text-4xl font-black">{m.room_not_found()}</h1>
					<a class="big-button mt-6 block" href={resolve('/')}>{m.back_home()}</a>
				</div>
			</div>
		{:else if !data.player}
			<div class="grid flex-1 place-items-center">
				<div class="panel w-full p-5">
					<p class="kicker">{m.join_room()}</p>
					<h1 class="mt-2 text-4xl font-black">{snapshot.room.title}</h1>
					<form method="POST" action="?/join" use:enhance class="mt-6 grid gap-4">
						<label class="grid gap-2">
							<span class="text-sm font-black uppercase tracking-[0.16em]">{m.nickname_label()}</span>
							<input
								class="field text-xl"
								name="nickname"
								placeholder={m.nickname_placeholder()}
								minlength="2"
								maxlength="24"
								autocomplete="nickname"
								required
							/>
						</label>
						{#if form?.message}
							<p class="text-sm font-bold text-red-600 dark:text-red-300">{form.message}</p>
						{/if}
						<button class="big-button" type="submit">{m.enter_room()}</button>
					</form>
				</div>
			</div>
		{:else}
			<div class="grid flex-1 content-center gap-5 py-5">
				<section class="panel p-5">
					<div class="flex items-start justify-between gap-3">
						<div>
							<p class="kicker">{snapshot.room.title}</p>
							<h1 class="mt-2 text-3xl font-black">
								{snapshot.activeQuestion
									? snapshot.activeQuestion.text
									: snapshot.room.status === 'finished'
										? m.survivor_podium()
										: m.question_incoming()}
							</h1>
						</div>
						<div class="score-badge">
							<span>{snapshot.currentPlayer?.score ?? 0}</span>
							<small>{m.points_short()}</small>
						</div>
					</div>

					{#if snapshot.room.status === 'finished'}
						<a
							class="big-button mt-6 block text-center"
							href={resolve('/r/[slug]/podium', { slug: snapshot.room.slug })}
						>
							{m.view_podium()}
						</a>
					{:else if snapshot.activeQuestion}
						<form method="POST" action="?/answer" use:enhance class="mt-6 grid gap-3">
							{#each snapshot.activeQuestion.choices as choice, index (`${index}-${choice}`)}
								<button
									class="answer-button"
									class:answered={snapshot.currentPlayerAnswer?.choiceIndex === index}
									type="submit"
									name="choiceIndex"
									value={index}
									disabled={Boolean(snapshot.currentPlayerAnswer)}
								>
									<span>{String.fromCharCode(65 + index)}</span>
									<strong>{choice}</strong>
								</button>
							{/each}
						</form>

						{#if snapshot.currentPlayerAnswer}
							<p class:good={snapshot.currentPlayerAnswer.isCorrect} class="feedback">
								{snapshot.currentPlayerAnswer.isCorrect ? m.correct_answer() : m.wrong_answer()}
							</p>
						{:else if form?.message}
							<p class="feedback">{form.message}</p>
						{:else}
							<p class="mt-4 text-center text-sm font-black uppercase tracking-[0.16em]">
								{m.your_turn()}
							</p>
						{/if}
					{:else}
						<div class="mt-6 rounded-3xl bg-black/5 p-5 text-center dark:bg-white/10">
							<p class="text-2xl font-black">{m.host_preparing()}</p>
							<p class="mt-2 font-bold text-zinc-600 dark:text-zinc-300">{m.stay_tuned()}</p>
						</div>
					{/if}
				</section>

				<section class="panel p-4">
					<p class="kicker">{m.live_score()}</p>
					<div class="mt-3 grid gap-2">
						{#each snapshot.leaderboard as player, index (player.id)}
							<div class="score-row" class:me={player.id === snapshot.currentPlayer?.id}>
								<span>#{index + 1}</span>
								<strong>{player.nickname}</strong>
								<b>{player.score}</b>
							</div>
						{/each}
					</div>
				</section>
			</div>
		{/if}

		<div class="safe-bottom muted-zone">{m.non_critical_low_zone()}</div>
	</section>
</main>
