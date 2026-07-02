<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import BuyMeACoffeeLink from '$lib/BuyMeACoffeeLink.svelte';
	import * as m from '$lib/paraglide/messages';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData | null } = $props();
	let eventSnapshot = $state<PageData['snapshot'] | null>(null);
	const snapshot = $derived(eventSnapshot ?? data.snapshot!);
	let connected = $state(false);
	let source: EventSource | null = null;
	const firstBingoLine = $derived(
		snapshot?.gameType === 'bingo' ? (snapshot.bingoClaimableLines[0] ?? null) : null
	);
	const currentPlayerHasPendingBingo = $derived(
		snapshot?.gameType === 'bingo' && snapshot.currentPlayer
			? snapshot.pendingBingoClaims.some((claim) => claim.playerId === snapshot.currentPlayer?.id)
			: false
	);

	$effect(() => {
		const slug = data.snapshot?.room.slug;
		if (!data.roomExists || !data.player || !slug || source) return;

		source = new EventSource(`/r/${slug}/events`);
		source.addEventListener('open', () => (connected = true));
		source.addEventListener('error', () => (connected = false));
		source.addEventListener('snapshot', (event) => {
			eventSnapshot = JSON.parse((event as MessageEvent).data);
		});

		return () => {
			source?.close();
			source = null;
		};
	});

	function lineValue(line: number[]) {
		return JSON.stringify(line);
	}

	function gameTypeLabel(gameType: string) {
		if (gameType === 'bingo') return m.game_type_bingo();
		if (gameType === 'consensus') return m.game_type_consensus();
		return m.game_type_quiz();
	}

	function consensusFeedback() {
		if (snapshot?.gameType !== 'consensus' || !snapshot.roundResult) {
			return m.consensus_vote_locked();
		}
		if (snapshot.roundResult.status === 'tie') return m.consensus_perfect_tie();
		if (snapshot.roundResult.status === 'none') return m.consensus_no_votes();
		return snapshot.roundResult.playerScored
			? m.consensus_you_read_the_room()
			: m.consensus_crowd_betrayed_you();
	}
</script>

<svelte:head>
	<title>{snapshot?.room?.title ?? 'Room'} - Spaces.tf</title>
	<meta name="description" content={data.social.description} />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="Spaces.tf" />
	<meta property="og:title" content={data.social.title} />
	<meta property="og:description" content={data.social.description} />
	<meta property="og:url" content={data.social.url} />
	<meta property="og:image" content={data.social.image} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content={`${data.social.title} preview`} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={data.social.title} />
	<meta name="twitter:description" content={data.social.description} />
	<meta name="twitter:image" content={data.social.image} />
</svelte:head>

<main class="screen-shell">
	<section class="mx-auto flex min-h-svh w-full max-w-xl flex-col px-2 py-3 sm:px-5 sm:py-5">
		<header class="flex items-center justify-between gap-3 py-2">
			<a href={resolve('/')} class="brand-lockup"
				><span class="brand-mark">tf</span><span>Spaces.tf</span></a
			>
			<span class:live-dot={connected} class="status-pill">
				{connected ? m.live_signal() : m.signal_status()}
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
					<p class="mt-2 text-sm font-bold text-zinc-600 dark:text-zinc-300">
						{gameTypeLabel(snapshot.room.gameType)}
					</p>
					<form method="POST" action="?/join" use:enhance class="mt-6 grid gap-4">
						<label class="grid gap-2">
							<span class="text-sm font-black uppercase tracking-[0.16em]"
								>{m.nickname_label()}</span
							>
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
		{:else if snapshot.gameType === 'quiz'}
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
		{:else if snapshot.gameType === 'bingo'}
			<div class="grid flex-1 content-center gap-5 py-5">
				<section class="panel bingo-board-panel p-5">
					<div class="flex items-start justify-between gap-3">
						<div>
							<p class="kicker">{snapshot.room.title}</p>
							<h1 class="mt-2 text-3xl font-black">{m.bingo_player_board()}</h1>
						</div>
						<div class="score-badge">
							<span>{snapshot.currentPlayer?.score ?? 0}</span>
							<small>{m.points_short()}</small>
						</div>
					</div>

					{#if snapshot.bingoCard}
						<form method="POST" action="?/toggleBingoTile" use:enhance class="bingo-grid mt-6">
							{#each snapshot.bingoCard.cells as cell (cell.tileId)}
								<button
									class="bingo-cell"
									class:checked={cell.checked}
									type="submit"
									name="tileId"
									value={cell.tileId}
									disabled={snapshot.room.status !== 'live'}
								>
									{cell.text}
								</button>
							{/each}
						</form>

						{#if firstBingoLine}
							<form method="POST" action="?/claimBingo" use:enhance class="mt-4">
								<input type="hidden" name="line" value={lineValue(firstBingoLine)} />
								<button
									class="big-button w-full"
									type="submit"
									disabled={currentPlayerHasPendingBingo || snapshot.room.status !== 'live'}
								>
									{currentPlayerHasPendingBingo ? m.bingo_claim_pending() : m.call_bingo()}
								</button>
							</form>
						{:else if currentPlayerHasPendingBingo}
							<p class="feedback">{m.bingo_claim_pending()}</p>
						{:else if snapshot.room.status === 'waiting'}
							<p class="feedback">{m.bingo_waiting_for_host()}</p>
						{:else if snapshot.room.status === 'finished'}
							<a
								class="big-button mt-4 block text-center"
								href={resolve('/r/[slug]/podium', { slug: snapshot.room.slug })}
							>
								{m.view_podium()}
							</a>
						{:else if form?.message}
							<p class="feedback">{form.message}</p>
						{:else}
							<p class="feedback">{m.bingo_keep_listening()}</p>
						{/if}
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
		{:else if snapshot.gameType === 'consensus'}
			<div class="grid flex-1 content-center gap-5 py-5">
				<section class="panel p-5">
					<div class="flex items-start justify-between gap-3">
						<div>
							<p class="kicker">{m.consensus_tagline()}</p>
							<h1 class="mt-2 text-3xl font-black">
								{snapshot.currentRound
									? snapshot.currentRound.text
									: snapshot.room.status === 'finished'
										? m.consensus_social_flair_podium()
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
					{:else if snapshot.currentRound}
						<form method="POST" action="?/voteConsensus" use:enhance class="mt-6 grid gap-3">
							{#each snapshot.currentRound.choices as choice, index (`${index}-${choice}`)}
								<button
									class="answer-button"
									class:answered={snapshot.currentPlayerVote?.choiceIndex === index ||
										snapshot.roundResult?.majorityChoiceIndex === index}
									type="submit"
									name="choiceIndex"
									value={index}
									disabled={Boolean(snapshot.currentPlayerVote) ||
										snapshot.currentRound.status !== 'active'}
								>
									<span>{index === 0 ? 'A' : 'B'}</span>
									<strong>{choice}</strong>
								</button>
							{/each}
						</form>

						{#if snapshot.currentRound.status === 'closed'}
							<p class:good={Boolean(snapshot.roundResult?.playerScored)} class="feedback">
								{consensusFeedback()}
							</p>
						{:else if snapshot.currentPlayerVote}
							<p class="feedback">{m.consensus_vote_locked()}</p>
						{:else if form?.message}
							<p class="feedback">{form.message}</p>
						{:else}
							<p class="mt-4 text-center text-sm font-black uppercase tracking-[0.16em]">
								{m.consensus_instruction()}
							</p>
						{/if}
					{:else}
						<div class="mt-6 rounded-3xl bg-black/5 p-5 text-center dark:bg-white/10">
							<p class="text-2xl font-black">{m.host_preparing()}</p>
							<p class="mt-2 font-bold text-zinc-600 dark:text-zinc-300">
								{m.consensus_waiting_for_host()}
							</p>
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

		<div class="safe-bottom muted-zone"><BuyMeACoffeeLink /></div>
	</section>
</main>
