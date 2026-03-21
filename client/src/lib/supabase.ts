import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://kqdunvqnnuhzqeckufxt.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxZHVudnFubnVoenFlY2t1Znh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwOTU1NjAsImV4cCI6MjA4OTY3MTU2MH0.NOLMVhmQuL4EuqbB9NWKhHv4Bk696mqpsumULtbktaM";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
