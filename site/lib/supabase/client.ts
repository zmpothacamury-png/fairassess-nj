import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // This only warns. It does not stop the build. Add both values to
  // .env.local (local dev) and to the Vercel project settings (deployed).
  console.warn(
    "Supabase env vars are missing: NEXT_PUBLIC_SUPABASE_URL and/or NEXT_PUBLIC_SUPABASE_ANON_KEY. The waitlist form will not be able to save emails until these are set.",
  );
}

// The anon key is public by design here. It can only INSERT into the
// waitlist table (see the Row Level Security policy in the README) - it
// cannot read, update, or delete anything.
//
// Fall back to placeholder values when the real ones are missing so the
// build doesn't crash (createClient throws on an empty URL). With
// placeholders, form submissions will just fail at runtime with the
// normal error message instead of breaking the whole site.
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key",
);
