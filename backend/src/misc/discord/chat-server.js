const http = require('http');
const { URL } = require('url');

function getCorsHeaders(req, corsOrigins) {
	const requestOrigin = req.headers.origin;
	const allowAnyOrigin = corsOrigins.includes('*');

	if (allowAnyOrigin) {
		return {
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization',
		};
	}

	const isAllowedOrigin =
		typeof requestOrigin === 'string' &&
		(corsOrigins.includes(requestOrigin) || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(requestOrigin));

	if (!isAllowedOrigin) return {};

	return {
		'Access-Control-Allow-Origin': requestOrigin,
		Vary: 'Origin',
		'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type, Authorization',
	};
}

function readJsonBody(req) {
	return new Promise((resolve, reject) => {
		let raw = '';

		req.on('data', (chunk) => {
			raw += chunk;
			if (raw.length > 1024 * 1024) {
				reject(new Error('Payload demasiado grande'));
				req.destroy();
			}
		});

		req.on('end', () => {
			if (!raw) {
				resolve({});
				return;
			}

			try {
				resolve(JSON.parse(raw));
			} catch {
				reject(new Error('JSON invalido'));
			}
		});

		req.on('error', reject);
	});
}

function sendJson(res, statusCode, payload, extraHeaders = {}) {
	res.writeHead(statusCode, {
		'Content-Type': 'application/json; charset=utf-8',
		...extraHeaders,
	});
	res.end(JSON.stringify(payload));
}

async function getLastBotMessages(client, channelId, limit = 50) {
	const channel = await client.channels.fetch(channelId);
	if (!channel || !channel.isTextBased()) {
		throw new Error('Canal invalido o no es de texto');
	}

	const fetched = await channel.messages.fetch({ limit: 100 });
	const botId = client.user?.id;
	if (!botId) return [];

	return fetched
		.filter((m) => m.author?.id === botId)
		.sort((a, b) => b.createdTimestamp - a.createdTimestamp)
		.first(limit)
		.map((m) => ({
			id: m.id,
			content: m.content,
			createdAt: m.createdAt.toISOString(),
		}));
}

function createLocalChatServer({ client, channelId, rcon, host = '127.0.0.1', port = 3210, corsOrigins = [] }) {
	if (!client) throw new Error('client es requerido');
	if (!channelId) throw new Error('channelId es requerido');

	const server = http.createServer(async (req, res) => {
		const method = req.method || 'GET';
		const url = new URL(req.url || '/', `http://${host}:${port}`);
		const corsHeaders = getCorsHeaders(req, corsOrigins);

		if (method === 'OPTIONS') {
			if (!Object.keys(corsHeaders).length) {
				sendJson(res, 403, { error: 'Origen no permitido por CORS' });
				return;
			}

			res.writeHead(204, corsHeaders);
			res.end();
			return;
		}

		if (url.pathname === '/health' && method === 'GET') {
			sendJson(res, 200, { ok: true }, corsHeaders);
			return;
		}

		if (url.pathname === '/messages' && method === 'GET') {
			try {
				const messages = await getLastBotMessages(client, channelId, 50);
				sendJson(res, 200, { count: messages.length, messages }, corsHeaders);
			} catch (err) {
				sendJson(res, 500, { error: err.message || 'Error interno' }, corsHeaders);
			}
			return;
		}

		if (url.pathname === '/messages' && method === 'POST') {
			try {
				const body = await readJsonBody(req);
				const message = typeof body.message === 'string' ? body.message.trim() : '';

				if (!message) {
					sendJson(res, 400, { error: 'El campo "message" es obligatorio' }, corsHeaders);
					return;
				}

				const channel = await client.channels.fetch(channelId);
				if (!channel || !channel.isTextBased()) {
					sendJson(res, 500, { error: 'Canal invalido o no es de texto' }, corsHeaders);
					return;
				}

				const sent = await channel.send(message);
				sendJson(res, 201, {
					ok: true,
					id: sent.id,
					content: sent.content,
					createdAt: sent.createdAt.toISOString(),
				}, corsHeaders);
			} catch (err) {
				const statusCode = err.message === 'JSON invalido' ? 400 : 500;
				sendJson(res, statusCode, { error: err.message || 'Error interno' }, corsHeaders);
			}
			return;
		}

		if (url.pathname === '/rust/say' && method === 'POST') {
			try {
				const body = await readJsonBody(req);
				const message = typeof body.message === 'string' ? body.message.trim() : '';

				if (!message) {
					sendJson(res, 400, { error: 'El campo "message" es obligatorio' }, corsHeaders);
					return;
				}

				if (!rcon || typeof rcon.sendCommand !== 'function') {
					sendJson(res, 500, { error: 'RCON no configurado en el servidor HTTP' }, corsHeaders);
					return;
				}

				if (!rcon.connected) {
					sendJson(res, 503, { error: 'RCON desconectado' }, corsHeaders);
					return;
				}

				rcon.sendCommand(`say "${message}"`);
				sendJson(res, 201, { ok: true, sentToRust: true, message }, corsHeaders);
			} catch (err) {
				const statusCode = err.message === 'JSON invalido' ? 400 : 500;
				sendJson(res, statusCode, { error: err.message || 'Error interno' }, corsHeaders);
			}
			return;
		}

		sendJson(res, 404, { error: 'Ruta no encontrada' }, corsHeaders);
	});

	server.listen(port, host, () => {
		console.log(`HTTP local listo en http://${host}:${port}`);
	});

	return server;
}

module.exports = {
	createLocalChatServer,
};
