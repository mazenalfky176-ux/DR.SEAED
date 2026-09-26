import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY)
    throw new Error('Set server environment variables first.');
const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const apply = process.argv.includes('--apply');
let offset = 0, candidates = 0, removed = 0;
const files = [];
for (;;) {
    const result = await client.storage.from('clinic-images').list('managed', { limit: 100, offset, sortBy: { column: 'name', order: 'asc' } });
    if (result.error)
        throw new Error('Could not list images.');
    files.push(...result.data);
    if (result.data.length < 100)
        break;
    offset += 100;
}
for (const file of files) {
    if (!file.created_at || Date.parse(file.created_at) > Date.now() - 7 * 86400000)
        continue;
    const key = 'managed/' + file.name;
    const url = client.storage.from('clinic-images').getPublicUrl(key).data.publicUrl;
    const content = await client.from('clinic_content').select('data').eq('id', 'default').maybeSingle();
    if (content.error || !content.data)
        throw new Error('Cannot verify published content. Cleanup stopped.');
    if (JSON.stringify(content.data.data).includes(url))
        continue;
    candidates++;
    if (apply) {
        const result = await client.storage.from('clinic-images').remove([key]);
        if (result.error)
            throw new Error('Cleanup failed.');
        removed++;
    }
}
console.log(`${candidates} unused images older than seven days. ${removed} removed. ${apply ? '' : 'Dry run; use --apply during a maintenance window with no active editors.'}`);
