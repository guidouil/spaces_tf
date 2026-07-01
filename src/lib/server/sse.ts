import type { GameSnapshot } from '$lib/server/game';

export function snapshotStream(loadSnapshot: () => Promise<GameSnapshot | null>) {
	const encoder = new TextEncoder();
	let interval: ReturnType<typeof setInterval> | null = null;
	let closed = false;

	return new ReadableStream({
		async start(controller) {
			let lastPayload = '';

			const send = async () => {
				if (closed) return;

				const snapshot = await loadSnapshot();
				const payload = JSON.stringify(snapshot);

				if (payload !== lastPayload) {
					controller.enqueue(encoder.encode(`event: snapshot\ndata: ${payload}\n\n`));
					lastPayload = payload;
				} else {
					controller.enqueue(encoder.encode(': ping\n\n'));
				}
			};

			await send();
			interval = setInterval(() => void send(), 1500);
		},
		cancel() {
			closed = true;
			if (interval) clearInterval(interval);
		}
	});
}

export const sseHeaders = {
	'content-type': 'text/event-stream',
	'cache-control': 'no-cache, no-transform',
	connection: 'keep-alive'
};
