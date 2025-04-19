import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://<YOUR_PROJECT>.supabase.co';
const supabaseAnonKey = '<YOUR_ANON_KEY>';

// Este arquivo não será mais usado diretamente. Use a API backend para comunicação.

export const supabase = createClient(supabaseUrl, supabaseAnonKey);