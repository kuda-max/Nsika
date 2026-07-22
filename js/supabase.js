

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://xvnmzfetryxzcncmrttw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2bm16ZmV0cnl4emNuY21ydHR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3MTQ4NzcsImV4cCI6MjEwMDI5MDg3N30.ljtrGztn33WvzwE04gQtLzfgjh6CmXgdtW6_vc203S0";

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);