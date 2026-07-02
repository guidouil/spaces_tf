import { Resvg } from '@resvg/resvg-js';

const WIDTH = 1200;
const HEIGHT = 630;

export type OgCardOptions = {
	title: string;
	subtitle: string;
	badge: string;
	accent?: string;
	meta?: string;
};

export function ogImageResponse(options: OgCardOptions) {
	const svg = renderOgSvg(options);
	const png = new Resvg(svg, {
		fitTo: {
			mode: 'width',
			value: WIDTH
		}
	})
		.render()
		.asPng();

	return new Response(new Uint8Array(png), {
		headers: {
			'content-type': 'image/png',
			'cache-control': 'public, max-age=300, stale-while-revalidate=86400'
		}
	});
}

function renderOgSvg({ title, subtitle, badge, accent = '#18e0c2', meta }: OgCardOptions) {
	const titleLines = wrap(title, 20, 3);
	const subtitleLines = wrap(subtitle, 45, 2);

	return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" fill="none" xmlns="http://www.w3.org/2000/svg">
	<rect width="${WIDTH}" height="${HEIGHT}" fill="#f7f139"/>
	<path d="M0 0h1200v630H0z" fill="url(#bg)"/>
	<path d="M0 0h1200v630H0z" fill="url(#grid)" opacity="0.22"/>
	<rect x="74" y="76" width="1052" height="478" rx="34" fill="#fffbe9" stroke="#18130c" stroke-width="8"/>
	<rect x="92" y="94" width="1052" height="478" rx="34" fill="#18130c" opacity="0.16"/>
	<rect x="74" y="76" width="1052" height="478" rx="34" fill="#fffbe9" stroke="#18130c" stroke-width="8"/>
	<g transform="translate(116 116)">
		<rect x="0" y="0" width="74" height="74" rx="10" fill="${escapeXml(accent)}" stroke="#18130c" stroke-width="6" transform="rotate(-6 37 37)"/>
		<text x="37" y="49" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="900" fill="#18130c">tf</text>
		<text x="98" y="48" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="900" fill="#18130c">Spaces.tf</text>
	</g>
	<rect x="884" y="118" width="178" height="52" rx="26" fill="${escapeXml(accent)}" stroke="#18130c" stroke-width="4"/>
	<text x="973" y="153" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="19" font-weight="900" fill="#18130c" letter-spacing="2">${escapeXml(badge.toUpperCase())}</text>
	<text x="116" y="262" font-family="Inter, Arial, sans-serif" font-size="82" font-weight="950" fill="#18130c">
		${titleLines.map((line, index) => `<tspan x="116" dy="${index === 0 ? 0 : 88}">${escapeXml(line)}</tspan>`).join('')}
	</text>
	<text x="118" y="466" font-family="Inter, Arial, sans-serif" font-size="32" font-weight="760" fill="#4d4336">
		${subtitleLines.map((line, index) => `<tspan x="118" dy="${index === 0 ? 0 : 40}">${escapeXml(line)}</tspan>`).join('')}
	</text>
	${meta ? `<text x="118" y="526" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="900" fill="#006b61" letter-spacing="2">${escapeXml(meta.toUpperCase())}</text>` : ''}
	<g transform="translate(890 366)">
		<rect x="0" y="0" width="172" height="116" rx="18" fill="#18130c"/>
		<circle cx="42" cy="40" r="16" fill="${escapeXml(accent)}"/>
		<rect x="72" y="29" width="62" height="20" rx="10" fill="#fffbe9"/>
		<rect x="28" y="76" width="116" height="18" rx="9" fill="#ff6f3c"/>
	</g>
	<defs>
		<linearGradient id="bg" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
			<stop stop-color="#f7f139"/>
			<stop offset="0.58" stop-color="#ff6f3c"/>
			<stop offset="1" stop-color="#18130c"/>
		</linearGradient>
		<pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse">
			<path d="M0 0h14v14H0z" fill="#18130c"/>
		</pattern>
	</defs>
</svg>`;
}

function wrap(value: string, maxLength: number, maxLines: number) {
	const words = value.trim().replace(/\s+/g, ' ').split(' ');
	const lines: string[] = [];
	let line = '';

	for (const word of words) {
		const next = line ? `${line} ${word}` : word;
		if (next.length <= maxLength) {
			line = next;
			continue;
		}

		if (line) lines.push(line);
		line = word;
		if (lines.length === maxLines) break;
	}

	if (line && lines.length < maxLines) lines.push(line);
	if (lines.length === 0) return ['Spaces.tf'];

	const remaining = words.join(' ');
	if (remaining.length > lines.join(' ').length && lines.length === maxLines) {
		lines[maxLines - 1] = `${lines[maxLines - 1].replace(/[.,;:!?]+$/, '')}...`;
	}

	return lines;
}

function escapeXml(value: string) {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&apos;');
}
