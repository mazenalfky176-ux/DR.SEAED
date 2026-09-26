import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { normalizeLegacy } from '../shared/legacy-content';
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY)
    throw new Error('Set server environment variables in .env first.');
const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const existing = await client.from('clinic_content').select('version').eq('id', 'default').maybeSingle();
if (existing.error)
    throw new Error('Run supabase-schema.sql first.');
if (existing.data)
    throw new Error('Content already initialized. Import stopped to preserve existing edits.');
const legacy = await client.from('site_settings').select('settings_json').eq('id', 'default').maybeSingle();
if (legacy.error)
    throw new Error('Cannot read legacy settings. No changes made.');
if (!legacy.data?.settings_json)
    throw new Error('No legacy document found. The API will use the supplied defaults.');
const data = normalizeLegacy(legacy.data.settings_json);
console.log('Legacy public content validated. Private records and credentials excluded. Verify opening hours after migration.');
if (process.argv.includes('--apply')) {
    const result = await client.from('clinic_content').insert({ id: 'default', data, version: 1 });
    if (result.error)
        throw new Error('Import failed; existing data was not overwritten.');
    console.log('Legacy content imported.');
}
else
    console.log('Dry run only. To import, rerun with --apply.');
