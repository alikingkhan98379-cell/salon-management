import { createClient } from '@supabase/supabase-js';
import { CONFIG } from './config';

export const isSupabaseConfigured = Boolean(
  CONFIG.SUPABASE_URL &&
  CONFIG.SUPABASE_ANON_KEY &&
  CONFIG.SUPABASE_URL.startsWith('http')
);

export const supabase = isSupabaseConfigured
  ? createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;
