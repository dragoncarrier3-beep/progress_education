import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { isDemoMode, supabaseAnonKey, supabaseUrl } from './config';

let client: SupabaseClient | null = null;

if (!isDemoMode) {
  client = createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = client as SupabaseClient;
export { isDemoMode };
