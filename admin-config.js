// ===== EDUTECHY ADMIN CONFIG =====
// Replace these with your Supabase credentials
// OR set them from the Settings page in the admin panel

function getKey(k, fallback) {
  return localStorage.getItem('et_' + k) || fallback;
}

const SUPABASE_URL      = getKey('s-url',  'https://ajsepyqjxxaunaitbeth.supabase.co');
const SUPABASE_ANON_KEY = getKey('s-key',  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqc2VweXFqeHhhdW5haXRiZXRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2MTg0NzcsImV4cCI6MjA5NzE5NDQ3N30.1pVhuATEEyBdbx9muxXhfr1ATWHgjbvJf1lvrt99KW4');

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
