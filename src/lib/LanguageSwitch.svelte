<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { locales, setLocale, type Locale } from '$lib/paraglide/runtime';
	import * as m from '$lib/paraglide/messages';

	let {
		currentLocale,
		onLocaleChange
	}: {
		currentLocale: Locale;
		onLocaleChange: (locale: Locale) => void;
	} = $props();

	async function switchLocale(locale: Locale) {
		if (locale === currentLocale) return;
		setLocale(locale, { reload: false });
		onLocaleChange(locale);
		await invalidateAll();
	}
</script>

<div class="language-switch" aria-label={m.language_switch_label()}>
	<span
		class="language-switch-slider"
		style={`transform: translateX(${locales.indexOf(currentLocale) * 100}%);`}
	></span>
	{#each locales as locale (locale)}
		<button
			type="button"
			class:active={currentLocale === locale}
			aria-current={currentLocale === locale ? 'true' : undefined}
			onclick={() => switchLocale(locale)}
		>
			{locale.toUpperCase()}
		</button>
	{/each}
</div>
