import { createClient } from "@supabase/supabase-js";

// Vite automatically exposes environment variables prefixed with VITE_ via import.meta.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
	console.error(
		"CRITICAL: Supabase environment variables missing. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are present in your .env file."
	);
}

// Initialize the standard client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
