import { createClient } from '@supabase/supabase-js';
import { config } from '../config';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabaseKey = supabaseServiceRoleKey || supabaseAnonKey;

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ Supabase credentials not found. Using JSON file storage.');
}

if (supabaseServiceRoleKey) {
  console.log('✅ Supabase backend client initialized with service role key');
} else if (supabaseAnonKey) {
  console.warn('⚠️ Supabase backend client using anon key. RLS may block write operations.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Check if Supabase is configured
export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseKey);
};
