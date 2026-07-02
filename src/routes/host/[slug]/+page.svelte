<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import BuyMeACoffeeLink from '$lib/BuyMeACoffeeLink.svelte';
	import * as m from '$lib/paraglide/messages';
	import { onMount, untrack } from 'svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData | null } = $props();
	const initialSnapshot = untrack(() => data.snapshot!);
	const initialJoinUrl = untrack(() => data.joinUrl);
	let snapshot = $state(initialSnapshot);
	let connected = $state(false);
	let playerUrl = $state(initialJoinUrl);
	let quizSource = $state<'quizzapi' | 'opentdb'>('quizzapi');
	let playerMode = $state(false);
	const selectedCategories = $derived(data.quizCategories[quizSource] ?? []);
	const firstBingoLine = $derived(
		snapshot.gameType === 'bingo' ? (snapshot.bingoClaimableLines[0] ?? null) : null
	);
	const currentPlayerHasPendingBingo = $derived(
		snapshot.gameType === 'bingo' && snapshot.currentPlayer
			? snapshot.pendingBingoClaims.some((claim) => claim.playerId === snapshot.currentPlayer?.id)
			: false
	);
	const hasDraftConsensusRound = $derived(
		snapshot.gameType === 'consensus'
			? snapshot.rounds.some((round) => round.status === 'draft')
			: false
	);

	onMount(() => {
		playerUrl = `${window.location.origin}${initialJoinUrl}`;
		playerMode =
			window.localStorage.getItem(`spaces_tf_player_mode_${snapshot.room.slug}`) === 'true';
		const source = new EventSource(`/host/${snapshot.room.slug}/events?token=${data.token}`);
		source.addEventListener('open', () => (connected = true));
		source.addEventListener('error', () => (connected = false));
		source.addEventListener('snapshot', (event) => {
			snapshot = JSON.parse((event as MessageEvent).data);
		});

		return () => source.close();
	});

	function togglePlayerMode() {
		playerMode = !playerMode;
		window.localStorage.setItem(`spaces_tf_player_mode_${snapshot.room.slug}`, String(playerMode));
	}

	function lineValue(line: number[]) {
		return JSON.stringify(line);
	}

	function claimStatusLabel(status: string) {
		if (status === 'approved') return m.bingo_claim_approved();
		if (status === 'rejected') return m.bingo_claim_rejected();
		return m.bingo_claim_pending();
	}

	function bingoStatusLabel(status: string) {
		if (status === 'live') return m.bingo_status_live();
		if (status === 'finished') return m.bingo_status_finished();
		return m.bingo_status_waiting();
	}

	function gameTypeLabel(gameType: string) {
		if (gameType === 'bingo') return m.game_type_bingo();
		if (gameType === 'consensus') return m.game_type_consensus();
		return m.game_type_quiz();
	}

	function consensusResultLabel() {
		if (snapshot.gameType !== 'consensus' || !snapshot.roundResult) {
			return m.consensus_result_pending();
		}
		if (snapshot.roundResult.status === 'tie') return m.consensus_perfect_tie();
		if (snapshot.roundResult.status === 'none') return m.consensus_no_votes();
		return m.consensus_majority_spoke();
	}
</script>

<svelte:head><title>{m.host_title({ title: snapshot.room.title })}</title></svelte:head>

<main class="screen-shell">
	<section
		class="mx-auto grid min-h-svh w-full max-w-6xl gap-5 px-4 py-5 lg:grid-cols-[1.05fr_0.95fr]"
	>
		<div class="space-y-5">
			<header class="panel p-4">
				<div class="flex items-start justify-between gap-4">
					<div>
						<a href={resolve('/')} class="brand-lockup"
							><span class="brand-mark">tf</span><span>Spaces.tf</span></a
						>
						<h1 class="mt-4 text-3xl font-black">{snapshot.room.title}</h1>
						<p class="mt-2 text-sm font-bold text-zinc-600 dark:text-zinc-300">
							{gameTypeLabel(snapshot.room.gameType)} · {m.host_dashboard()}
						</p>
					</div>
					<span class:live-dot={connected} class="status-pill">
						{connected ? m.live_signal() : m.offline_signal()}
					</span>
				</div>
				<div class="mt-4 flex flex-wrap gap-2">
					<button
						class="small-button"
						type="button"
						class:danger={playerMode}
						onclick={togglePlayerMode}
					>
						{playerMode ? m.host_controls_mode() : m.creator_player_mode()}
					</button>
					<a class="small-button" href={resolve('/r/[slug]', { slug: snapshot.room.slug })}>
						{m.open_player_view()}
					</a>
				</div>
				<div class="mt-4 rounded-2xl border border-dashed border-current/25 p-3">
					<p class="text-xs font-black uppercase tracking-[0.16em]">{m.player_link()}</p>
					<a
						class="mt-1 block break-all text-lg font-black underline"
						href={resolve('/r/[slug]', { slug: snapshot.room.slug })}>{playerUrl}</a
					>
				</div>
			</header>

			{#if snapshot.gameType === 'quiz'}
				<section class="panel p-4">
					<div class="flex items-center justify-between gap-3">
						<div>
							<p class="kicker">{m.current_signal()}</p>
							<h2 class="text-2xl font-black">
								{snapshot.activeQuestion ? snapshot.activeQuestion.text : m.question_incoming()}
							</h2>
						</div>
						<form method="POST" action="?/closeQuestion" use:enhance>
							<button class="small-button" type="submit" disabled={!snapshot.activeQuestion}
								>{m.close()}</button
							>
						</form>
					</div>

					{#if snapshot.activeQuestion}
						{#if playerMode}
							{#if snapshot.currentPlayer}
								<form method="POST" action="?/answerAsPlayer" use:enhance class="mt-4 grid gap-3">
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
									<p class="feedback">{m.answer_recorded()}</p>
								{:else}
									<p class="mt-4 text-center text-sm font-black uppercase tracking-[0.16em]">
										{m.your_turn()}
									</p>
								{/if}
							{:else}
								<form method="POST" action="?/joinAsPlayer" use:enhance class="mt-4 grid gap-3">
									<input
										class="field"
										name="nickname"
										placeholder={m.nickname_placeholder()}
										minlength="2"
										maxlength="24"
										autocomplete="nickname"
										required
									/>
									<button class="big-button" type="submit">{m.enter_player_mode()}</button>
								</form>
							{/if}
						{:else}
							<div class="mt-4 grid gap-2">
								{#each snapshot.activeQuestion.choices as choice, index (`${index}-${choice}`)}
									<div
										class:correct-choice={index === snapshot.activeQuestion.correctChoiceIndex}
										class="choice-row"
									>
										<span>{String.fromCharCode(65 + index)}</span>
										<strong>{choice}</strong>
									</div>
								{/each}
							</div>
						{/if}
					{:else if playerMode && !snapshot.currentPlayer}
						<form method="POST" action="?/joinAsPlayer" use:enhance class="mt-4 grid gap-3">
							<input
								class="field"
								name="nickname"
								placeholder={m.nickname_placeholder()}
								minlength="2"
								maxlength="24"
								autocomplete="nickname"
								required
							/>
							<button class="big-button" type="submit">{m.enter_player_mode()}</button>
						</form>
					{:else}
						<p class="mt-4 rounded-2xl bg-black/5 p-4 font-bold dark:bg-white/10">
							{m.host_preparing_sentence()}
						</p>
					{/if}
				</section>

				<section class="panel p-4">
					<p class="kicker">{m.api_quiz_import()}</p>
					<form method="POST" action="?/importQuestions" use:enhance class="mt-3 grid gap-3">
						<div class="grid gap-2 sm:grid-cols-3">
							<label class="grid gap-1">
								<span class="field-label">{m.quiz_source()}</span>
								<select class="field" name="source" bind:value={quizSource}>
									<option value="quizzapi">{m.french_quiz_api()}</option>
									<option value="opentdb">OpenTDB</option>
								</select>
							</label>
							<label class="grid gap-1">
								<span class="field-label">{m.category()}</span>
								<select class="field" name="category">
									<option value="">{m.any_category()}</option>
									{#each selectedCategories as category (category.id)}
										<option value={category.id}>{category.name}</option>
									{/each}
								</select>
							</label>
							<label class="grid gap-1">
								<span class="field-label">{m.difficulty()}</span>
								<select class="field" name="difficulty">
									<option value="">{m.any_difficulty()}</option>
									{#if quizSource === 'quizzapi'}
										<option value="facile">{m.easy()}</option>
										<option value="normal">{m.medium()}</option>
										<option value="difficile">{m.hard()}</option>
									{:else}
										<option value="easy">{m.easy()}</option>
										<option value="medium">{m.medium()}</option>
										<option value="hard">{m.hard()}</option>
									{/if}
								</select>
							</label>
						</div>
						<button class="big-button" type="submit">{m.import_10_questions()}</button>
					</form>
				</section>

				<section class="panel p-4">
					<p class="kicker">{m.new_ammo()}</p>
					<form method="POST" action="?/createQuestion" use:enhance class="mt-3 grid gap-3">
						<input
							class="field"
							name="text"
							placeholder={m.question_placeholder()}
							maxlength="220"
							required
						/>
						<div class="grid gap-2">
							{#each [0, 1, 2, 3] as index (index)}
								<div class="grid grid-cols-[1fr_auto] gap-2">
									<input
										class="field"
										name="choice"
										placeholder={index > 1
											? m.optional_answer_placeholder({ letter: String.fromCharCode(65 + index) })
											: m.answer_placeholder({ letter: String.fromCharCode(65 + index) })}
										maxlength="120"
										required={index < 2}
									/>
									<label class="radio-chip">
										<input
											type="radio"
											name="correctChoiceIndex"
											value={index}
											required={index === 0}
										/>
										<span>{m.correct_choice_chip()}</span>
									</label>
								</div>
							{/each}
						</div>
						{#if form?.message}
							<p class="text-sm font-bold text-red-600 dark:text-red-300">{form.message}</p>
						{/if}
						<button class="big-button" type="submit">{m.add_question()}</button>
					</form>
				</section>
			{:else if snapshot.gameType === 'bingo'}
				<section class="panel p-4">
					<div class="flex items-start justify-between gap-3">
						<div>
							<p class="kicker">{m.bingo_live_board()}</p>
							<h2 class="text-2xl font-black">
								{snapshot.pendingBingoClaims.length > 0
									? m.bingo_claims_waiting({ count: snapshot.pendingBingoClaims.length })
									: m.bingo_waiting_for_claims()}
							</h2>
							<p class="mt-2 text-sm font-black uppercase tracking-[0.14em]">
								{bingoStatusLabel(snapshot.room.status)}
							</p>
						</div>
						<div class="flex flex-wrap justify-end gap-2">
							<form method="POST" action="?/startBingo" use:enhance>
								<button
									class="small-button"
									type="submit"
									disabled={snapshot.room.status === 'live'}
								>
									{m.start_bingo()}
								</button>
							</form>
							<form method="POST" action="?/stopBingo" use:enhance>
								<button
									class="small-button"
									type="submit"
									disabled={snapshot.room.status !== 'live'}
								>
									{m.stop_bingo()}
								</button>
							</form>
							<form method="POST" action="?/redealBingoCards" use:enhance>
								<button class="small-button danger" type="submit">{m.redeal_bingo_cards()}</button>
							</form>
							<form method="POST" action="?/finishGame" use:enhance>
								<button class="small-button danger" type="submit">{m.view_podium()}</button>
							</form>
						</div>
					</div>

					{#if playerMode}
						{#if snapshot.currentPlayer && snapshot.bingoCard}
							<form
								method="POST"
								action="?/toggleBingoTileAsPlayer"
								use:enhance
								class="bingo-grid mt-5"
							>
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
								<form method="POST" action="?/claimBingoAsPlayer" use:enhance class="mt-4">
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
							{:else}
								<p class="feedback">{m.bingo_keep_listening()}</p>
							{/if}
						{:else}
							<form method="POST" action="?/joinAsPlayer" use:enhance class="mt-4 grid gap-3">
								<input
									class="field"
									name="nickname"
									placeholder={m.nickname_placeholder()}
									minlength="2"
									maxlength="24"
									autocomplete="nickname"
									required
								/>
								<button class="big-button" type="submit">{m.enter_player_mode()}</button>
							</form>
						{/if}
					{:else}
						<div class="mt-4 grid gap-3">
							{#each snapshot.pendingBingoClaims as claim (claim.id)}
								<div class="claim-row pending">
									<div>
										<p class="text-xs font-black uppercase tracking-[0.16em]">
											{m.bingo_claim_pending()}
										</p>
										<p class="text-2xl font-black">{claim.nickname}</p>
									</div>
									{#if claim.card}
										<div class="bingo-grid claim-bingo-grid">
											{#each claim.card.cells as cell, index (cell.tileId)}
												<div
													class="bingo-cell"
													class:checked={cell.checked}
													class:claimed={claim.line.includes(index)}
												>
													{cell.text}
												</div>
											{/each}
										</div>
									{/if}
									<div class="grid gap-2 sm:grid-cols-2">
										<form method="POST" action="?/resolveBingoClaim">
											<input type="hidden" name="claimId" value={claim.id} />
											<input type="hidden" name="decision" value="approved" />
											<button class="small-button w-full" type="submit">{m.approve()}</button>
										</form>
										<form method="POST" action="?/resolveBingoClaim">
											<input type="hidden" name="claimId" value={claim.id} />
											<input type="hidden" name="decision" value="rejected" />
											<button class="small-button danger w-full" type="submit">{m.reject()}</button>
										</form>
									</div>
								</div>
							{:else}
								<p class="rounded-2xl bg-black/5 p-4 font-bold dark:bg-white/10">
									{m.bingo_no_pending_claims()}
								</p>
							{/each}
						</div>
					{/if}
				</section>

				<section class="panel p-4">
					<p class="kicker">{m.bingo_tile_bank()}</p>
					<form method="POST" action="?/addBingoTile" use:enhance class="mt-3 grid gap-3">
						<input
							class="field"
							name="text"
							placeholder={m.bingo_tile_placeholder()}
							maxlength="80"
							required
						/>
						{#if form?.message}
							<p class="text-sm font-bold text-red-600 dark:text-red-300">{form.message}</p>
						{/if}
						<button class="big-button" type="submit">{m.add_bingo_tile()}</button>
					</form>
				</section>
			{:else if snapshot.gameType === 'consensus'}
				<section class="panel p-4">
					<div class="flex items-start justify-between gap-3">
						<div>
							<p class="kicker">{m.consensus_tagline()}</p>
							<h2 class="text-2xl font-black">
								{snapshot.currentRound ? snapshot.currentRound.text : m.question_incoming()}
							</h2>
							<p class="mt-2 text-sm font-black uppercase tracking-[0.14em]">
								{consensusResultLabel()}
							</p>
						</div>
						<div class="flex flex-wrap justify-end gap-2">
							<form method="POST" action="?/closeConsensusRound" use:enhance>
								<button
									class="small-button"
									type="submit"
									disabled={!snapshot.currentRound || snapshot.currentRound.status !== 'active'}
								>
									{m.consensus_reveal()}
								</button>
							</form>
							<form method="POST" action="?/launchNextConsensusRound" use:enhance>
								<button
									class="small-button"
									type="submit"
									disabled={!hasDraftConsensusRound ||
										(snapshot.currentRound?.status === 'active' && snapshot.room.status === 'live')}
								>
									{m.consensus_next_question()}
								</button>
							</form>
							<form method="POST" action="?/finishGame" use:enhance>
								<button class="small-button danger" type="submit">{m.view_podium()}</button>
							</form>
						</div>
					</div>

					{#if snapshot.currentRound}
						{#if playerMode}
							{#if snapshot.currentPlayer}
								<form
									method="POST"
									action="?/voteConsensusAsPlayer"
									use:enhance
									class="mt-4 grid gap-3"
								>
									{#each snapshot.currentRound.choices as choice, index (`${index}-${choice}`)}
										<button
											class="answer-button"
											class:answered={snapshot.currentPlayerVote?.choiceIndex === index}
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
								{#if snapshot.currentPlayerVote}
									<p class="feedback">{m.consensus_vote_locked()}</p>
								{:else}
									<p class="mt-4 text-center text-sm font-black uppercase tracking-[0.16em]">
										{m.consensus_instruction()}
									</p>
								{/if}
							{:else}
								<form method="POST" action="?/joinAsPlayer" use:enhance class="mt-4 grid gap-3">
									<input
										class="field"
										name="nickname"
										placeholder={m.nickname_placeholder()}
										minlength="2"
										maxlength="24"
										autocomplete="nickname"
										required
									/>
									<button class="big-button" type="submit">{m.enter_player_mode()}</button>
								</form>
							{/if}
						{:else}
							<div class="mt-4 grid gap-2">
								{#each snapshot.currentRound.choices as choice, index (`${index}-${choice}`)}
									<div
										class:correct-choice={snapshot.roundResult?.majorityChoiceIndex === index}
										class="choice-row"
									>
										<span>{index === 0 ? 'A' : 'B'}</span>
										<strong>{choice}</strong>
										<small class="font-black">
											{m.consensus_votes({
												count: snapshot.roundResult?.voteCounts[index]?.count ?? 0
											})}
										</small>
									</div>
								{/each}
							</div>
						{/if}
					{:else if playerMode && !snapshot.currentPlayer}
						<form method="POST" action="?/joinAsPlayer" use:enhance class="mt-4 grid gap-3">
							<input
								class="field"
								name="nickname"
								placeholder={m.nickname_placeholder()}
								minlength="2"
								maxlength="24"
								autocomplete="nickname"
								required
							/>
							<button class="big-button" type="submit">{m.enter_player_mode()}</button>
						</form>
					{:else}
						<p class="mt-4 rounded-2xl bg-black/5 p-4 font-bold dark:bg-white/10">
							{m.consensus_waiting_for_host()}
						</p>
					{/if}
				</section>
			{/if}
		</div>

		<aside class="space-y-5">
			{#if snapshot.gameType === 'quiz'}
				<section class="panel p-4">
					<div class="flex items-center justify-between gap-3">
						<div>
							<p class="kicker">{m.queue()}</p>
							<h2 class="text-2xl font-black">
								{m.question_count({ count: snapshot.questions.length })}
							</h2>
						</div>
						<form method="POST" action="?/finishGame" use:enhance>
							<button class="small-button danger" type="submit">{m.view_podium()}</button>
						</form>
					</div>

					<div class="mt-4 grid gap-3">
						{#each snapshot.questions as question (question.id)}
							<div class="question-card">
								<div>
									<p class="font-black">{question.text}</p>
									<p
										class="text-xs font-bold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400"
									>
										{question.status} · {m.answer_count({
											count: data.questionAnswerCounts[question.id] ?? 0
										})}
									</p>
								</div>
								<div class="question-actions">
									<form method="POST" action="?/launchQuestion" use:enhance>
										<input type="hidden" name="questionId" value={question.id} />
										<button class="small-button" type="submit">{m.launch()}</button>
									</form>
									<form method="POST" action="?/deleteQuestion" use:enhance>
										<input type="hidden" name="questionId" value={question.id} />
										<button class="small-button danger" type="submit">{m.delete()}</button>
									</form>
								</div>
							</div>
						{:else}
							<p class="rounded-2xl bg-black/5 p-4 font-bold dark:bg-white/10">
								{m.no_questions()}
							</p>
						{/each}
					</div>
				</section>
			{:else if snapshot.gameType === 'bingo'}
				<section class="panel p-4">
					<div class="flex items-start justify-between gap-3">
						<div>
							<p class="kicker">{m.bingo_tile_bank()}</p>
							<h2 class="text-2xl font-black">
								{m.bingo_tile_count({ count: snapshot.bingoTiles.length })}
							</h2>
						</div>
						<form method="POST" action="?/regenerateBingoTiles" use:enhance>
							<button
								class="small-button"
								type="submit"
								disabled={snapshot.room.status !== 'waiting'}
							>
								{m.regenerate_bingo_tiles()}
							</button>
						</form>
					</div>
					<div class="mt-4 grid gap-2">
						{#each snapshot.bingoTiles as tile (tile.id)}
							<div class="question-card">
								<form method="POST" action="?/updateBingoTile" use:enhance class="grid gap-2">
									<input type="hidden" name="tileId" value={tile.id} />
									<input class="field" name="text" value={tile.text} maxlength="80" required />
									<button class="small-button" type="submit">{m.update_bingo_tile()}</button>
								</form>
								<form method="POST" action="?/deleteBingoTile" use:enhance>
									<input type="hidden" name="tileId" value={tile.id} />
									<button
										class="small-button danger"
										type="submit"
										disabled={snapshot.bingoTiles.length <= 16}
									>
										{m.delete()}
									</button>
								</form>
							</div>
						{/each}
					</div>
				</section>

				<section class="panel p-4">
					<p class="kicker">{m.bingo_claim_history()}</p>
					<div class="mt-4 grid gap-2">
						{#each snapshot.bingoClaims as claim (claim.id)}
							<div class="score-row">
								<span>{claimStatusLabel(claim.status)}</span>
								<strong>{claim.nickname}</strong>
								<b>{new Date(claim.createdAt).toLocaleTimeString()}</b>
							</div>
						{:else}
							<p class="rounded-2xl bg-black/5 p-4 font-bold dark:bg-white/10">
								{m.bingo_no_claims()}
							</p>
						{/each}
					</div>
				</section>
			{:else if snapshot.gameType === 'consensus'}
				<section class="panel p-4">
					<div class="flex items-center justify-between gap-3">
						<div>
							<p class="kicker">{m.queue()}</p>
							<h2 class="text-2xl font-black">
								{m.question_count({ count: snapshot.rounds.length })}
							</h2>
						</div>
						<form method="POST" action="?/finishGame" use:enhance>
							<button class="small-button danger" type="submit">{m.view_podium()}</button>
						</form>
					</div>

					<div class="mt-4 grid gap-3">
						{#each snapshot.rounds as question (question.id)}
							<div class="question-card">
								<div>
									<p class="font-black">{question.text}</p>
									<p
										class="text-xs font-bold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400"
									>
										{question.status} · {m.consensus_votes({
											count: data.questionAnswerCounts[question.id] ?? 0
										})}
									</p>
								</div>
								<div class="question-actions">
									<form method="POST" action="?/launchConsensusRound" use:enhance>
										<input type="hidden" name="questionId" value={question.id} />
										<button
											class="small-button"
											type="submit"
											disabled={question.status !== 'draft'}
										>
											{m.launch()}
										</button>
									</form>
								</div>
							</div>
						{:else}
							<p class="rounded-2xl bg-black/5 p-4 font-bold dark:bg-white/10">
								{m.no_questions()}
							</p>
						{/each}
					</div>
				</section>
			{/if}

			<section class="panel p-4">
				<p class="kicker">{m.live_score()}</p>
				<h2 class="text-2xl font-black">{m.player_count({ count: snapshot.players.length })}</h2>
				<div class="mt-4 grid gap-2">
					{#each snapshot.leaderboard as player, index (player.id)}
						<div class="score-row">
							<span>#{index + 1}</span>
							<strong>{player.nickname}</strong>
							<b>{player.score}</b>
						</div>
					{:else}
						<p class="rounded-2xl bg-black/5 p-4 font-bold dark:bg-white/10">
							{m.nobody_tuned()}
						</p>
					{/each}
				</div>
			</section>
			<div class="safe-bottom muted-zone"><BuyMeACoffeeLink /></div>
		</aside>
	</section>
</main>
