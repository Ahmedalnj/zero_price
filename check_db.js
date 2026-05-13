import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(url, key);

async function main() {
    const { data: stores, error } = await supabase.from('stores').select('*');
    console.log('Stores:', stores, error);

    if (stores && stores.length === 0) {
        console.log('Inserting default stores...');
        await supabase.from('stores').insert([
            { id: 'rawa', name: 'متجر رواء' },
            { id: 'zero', name: 'متجر زيرو' },
            { id: 'dribe', name: 'متجر دريبي' }
        ]);
        console.log('Done!');
    }
}
main();
