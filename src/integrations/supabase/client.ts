
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://eibfyzmuwmgbntptchmd.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpYmZ5em11d21nYm50cHRjaG1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMyMDQ2NjksImV4cCI6MjA1ODc4MDY2OX0.v7NKFxVK6BgMP9BK7ppqvvLSp-m2rGsw5uTGkcEmJ_s";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
