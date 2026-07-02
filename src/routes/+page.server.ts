import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ url }) => ({
	social: {
		url: url.origin,
		image: `${url.origin}/og.png`
	}
});
