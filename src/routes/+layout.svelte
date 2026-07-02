<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import LanguageSwitch from '$lib/LanguageSwitch.svelte';
	import { getLocale, type Locale } from '$lib/paraglide/runtime';

	let { children } = $props();
	let currentLocale = $state(getLocale());

	function handleLocaleChange(locale: Locale) {
		currentLocale = locale;
	}
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<LanguageSwitch {currentLocale} onLocaleChange={handleLocaleChange} />
{#key currentLocale}
	{@render children()}
{/key}
