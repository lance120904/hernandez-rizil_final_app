import { createClient } from "@supabase/supabase-js";

// 🔑 Replace these with your real Supabase project values
const SUPABASE_URL = "https://xrqhniflafjdckvggjqu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhycWhuaWZsYWZqZGNrdmdnanF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyODcyMjMsImV4cCI6MjA5Mzg2MzIyM30.ZwAgkwAYhjrGjLVFdTC2-UAx8DwCUgwV4ZQy4iGTvvM";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);