import { createClient } from "@supabase/supabase-js";

// 🔑 Replace these with your real Supabase project values
const SUPABASE_URL = "https://YOUR_PROJECT_ID.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0dWtuZmJ5cHFpb2RqZ3V1c3p3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyMjcyMjgsImV4cCI6MjA5MzgwMzIyOH0.dNSWTBw91_K45FdRzrYYl8P8x6pGlw5b3Ze8n6ZGNTs";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);