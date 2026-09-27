import { spawn } from 'node:child_process';
import { writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for deployment');
}

const secretsFile = join(tmpdir(), `dr-seaed-worker-secrets-${process.pid}.json`);
await writeFile(secretsFile, JSON.stringify({ SUPABASE_SERVICE_ROLE_KEY: key }), { mode: 0o600 });

try {
    const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    const exitCode = await new Promise((resolve, reject) => {
        const child = spawn(command, ['--yes', 'wrangler@4.142.0', 'deploy', '--secrets-file', secretsFile], {
            stdio: 'inherit',
            env: process.env,
        });
        child.once('error', reject);
        child.once('exit', (code, signal) => {
            if (signal) reject(new Error(`Wrangler was terminated by ${signal}`));
            else resolve(code ?? 1);
        });
    });
    if (exitCode !== 0) process.exitCode = exitCode;
}
finally {
    await rm(secretsFile, { force: true });
}
