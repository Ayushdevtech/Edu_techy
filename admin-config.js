// ===== EDUTECHY ADMIN CONFIG =====
// Replace these with your Supabase credentials
// OR set them from the Settings page in the admin panel

function getKey(k, fallback) {
  return localStorage.getItem('et_' + k) || fallback;
}

const SUPABASE_URL      = getKey('s-url',  'YOUR_SUPABASE_URL');
const SUPABASE_ANON_KEY = getKey('s-key',  'YOUR_SUPABASE_ANON_KEY');

const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/*
HOW TO SET UP:
1. Open Admin Panel in browser
2. Login with your Supabase admin email
3. Go to Settings
4. Paste your Supabase URL + Anon Key
5. Paste your Gemini API Key (get free from aistudio.google.com)
6. Click Save — done!
*/
