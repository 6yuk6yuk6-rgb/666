import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getRequiredEnv } from "@/lib/env";

export function getSupabaseAdmin() {
  return createClient(
    getRequiredEnv("SUPABASE_URL"),
    getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}
