-- ============================================================================
-- Migration: Enable Row Level Security (RLS) on all tables
-- Date: 2026-03-21
--
-- PURPOSE:
-- The Supabase anon key is exposed in the client-side source code. Without RLS,
-- anyone with that key has unrestricted access to all tables via the PostgREST
-- API. Enabling RLS ensures that access is governed by explicit policies.
--
-- CURRENT STATE:
-- This app has NO authentication — there are no user accounts or login flows.
-- Therefore, we cannot create per-user policies yet. As a stepping stone, we
-- grant the `anon` role full CRUD access through permissive policies. This
-- preserves existing app functionality while activating the RLS framework.
--
-- TODO (when authentication is added):
--   1. Add a `user_id` column (UUID, references auth.users) to each table.
--   2. Replace these blanket policies with per-user policies, e.g.:
--        USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)
--   3. Consider read-only public policies for shared/public data.
--   4. Revoke or narrow the anon role's access as appropriate.
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE collection_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE deck_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE rivals ENABLE ROW LEVEL SECURITY;

-- Allow anon role full access (temporary until auth is added)
CREATE POLICY "anon_full_access_collection" ON collection_cards
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon_full_access_decks" ON decks
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon_full_access_deck_cards" ON deck_cards
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon_full_access_game_history" ON game_history
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon_full_access_wishlist" ON wishlist_cards
  FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "anon_full_access_rivals" ON rivals
  FOR ALL TO anon USING (true) WITH CHECK (true);
