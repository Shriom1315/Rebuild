import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// LOGGING FOR DEBUGGING - Remove in production
console.log('--- Supabase Configuration Check ---');
console.log('URL:', supabaseUrl);
console.log('Key Length:', supabaseAnonKey ? supabaseAnonKey.length : 0);
console.log('------------------------------------');

// Validate that credentials are provided
if (!supabaseUrl || !supabaseAnonKey) {
  const msg = 'Missing Supabase credentials. Ensure your .env file exists and has REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY.';
  console.error(msg);
}

// Check if credentials are still placeholders
if (supabaseUrl?.includes('your-project-id') || supabaseAnonKey?.includes('your-anon-key')) {
  console.error('Please replace placeholder values in .env file with your actual Supabase credentials');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);
