import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

if (!supabaseUrl) {
  throw new Error("Supabase URL is missing. Check your .env file.");
}

if (!supabaseKey) {
  throw new Error("Supabase Publishable Key is missing. Check your .env file.");
}

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);