import express from 'express';
import { Readable } from 'node:stream';
import { fileURLToPath } from 'node:url';
import { handleApi } from '../backend/api';
import { MemoryStore, testUser } from './memory-store';
const app = express(), store = new MemoryStore();
const origin = 'http://127.0.0.1:4173';
app.use('/api', async (req, res) => {
    const headers = new Headers();
    for (const [key, v] of Object.entries(req.headers))
        if (v)
            headers.set(key, String(v));
    const init: RequestInit & {
        duplex?: string;
    } = { method: req.method, headers };
    if (!['GET', 'HEAD'].includes(req.method)) {
        init.body = Readable.toWeb(req) as ReadableStream;
        init.duplex = 'half';
    }
    const response = await handleApi(new Request(origin + req.originalUrl, init), { ADMIN_USER_ID: testUser, PUBLIC_SITE_URL: origin }, store);
    res.status(response.status);
    response.headers.forEach((v, k) => res.setHeader(k, v));
    res.send(Buffer.from(await response.arrayBuffer()));
});
app.get('/test-images/:name', (req, res) => {
    const bytes = store.images.get(req.path);
    if (!bytes) {
        res.sendStatus(404);
        return;
    }
    res.type(req.path.endsWith('.png') ? 'png' : 'jpg').send(Buffer.from(bytes));
});
app.use(express.static(fileURLToPath(new URL('../dist', import.meta.url))));
app.listen(4173, '127.0.0.1', () => console.log('Synthetic verification server: ' + origin));
