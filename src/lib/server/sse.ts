import type { GameSnapshot } from '$lib/server/game';

export function snapshotStream(loadSnapshot: () => Promise<GameSnapshot | null>) {
	const encoder = new TextEncoder();
	let interval: ReturnType<typeof setInterval> | null = null;
	let closed = false;
	let sending = false;

	const cleanup = () => {
		closed = true;
		if (interval) {
			clearInterval(interval);
			interval = null;
		}
	};

	return new ReadableStream({
		async start(controller) {
			let lastPayload = '';

			const enqueue = (message: string) => {
				if (closed) return false;

				try {
					controller.enqueue(encoder.encode(message));
					return true;
				} catch (error) {
					cleanup();
					if (isClosedStreamError(error)) return false;
					throw error;
				}
			};

			const send = async () => {
				if (closed || sending) return;

				sending = true;

				try {
					const snapshot = await loadSnapshot();
					if (closed) return;

					const payload = JSON.stringify(snapshot);

					if (payload !== lastPayload) {
						if (enqueue(`event: snapshot\ndata: ${payload}\n\n`)) lastPayload = payload;
					} else {
						enqueue(': ping\n\n');
					}
				} catch (error) {
					cleanup();
					try {
						controller.error(error);
					} catch {
						// The client can disconnect while the snapshot query is still resolving.
					}
				} finally {
					sending = false;
				}
			};

			await send();
			if (!closed) interval = setInterval(() => void send(), 1500);
		},
		cancel() {
			cleanup();
		}
	});
}

function isClosedStreamError(error: unknown) {
	return (
		error instanceof TypeError &&
		'code' in error &&
		error.code === 'ERR_INVALID_STATE' &&
		error.message.includes('Controller is already closed')
	);
}

export const sseHeaders = {
	'content-type': 'text/event-stream',
	'cache-control': 'no-cache, no-transform',
	connection: 'keep-alive'
};
