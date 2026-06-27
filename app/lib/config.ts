// Demo mode runs entirely in the browser (localStorage) — no backend required.
// Set EXPO_PUBLIC_SUPABASE_URL + EXPO_PUBLIC_SUPABASE_ANON_KEY to use real Supabase.

const url = (process.env.EXPO_PUBLIC_SUPABASE_URL || '').trim();
const key = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '').trim();

export const supabaseUrl = url;
export const supabaseAnonKey = key;

export const isDemoMode =
  !url ||
  !key ||
  url.includes('databasepad.com') ||
  !url.includes('supabase.co');
