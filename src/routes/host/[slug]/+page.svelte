<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
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
							{m.host_dashboard()}
						</p>
					</div>
					<span class:live-dot={connected} class="status-pill">
						{connected ? 'live' : 'offline'}
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
		</div>

		<aside class="space-y-5">
			<section class="panel p-4">
				<div class="flex items-center justify-between gap-3">
					<div>
						<p class="kicker">{m.queue()}</p>
						<h2 class="text-2xl font-black">
							{m.question_count({ count: snapshot.questions.length })}
						</h2>
					</div>
					<form method="POST" action="?/finishGame" use:enhance>
						<button class="small-button danger" type="submit">Podium</button>
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
			<div class="safe-bottom muted-zone">{m.twitter_safe_zone()}</div>
		</aside>
	</section>
</main>
