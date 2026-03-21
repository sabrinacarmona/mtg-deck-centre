import { createClient } from '@supabase/supabase-js';

// ─── Supabase connection ───────────────────────────────────────────────────────
const SUPABASE_URL = 'https://kqdunvqnnuhzqeckufxt.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxZHVudnFubnVoenFlY2t1Znh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwOTU1NjAsImV4cCI6MjA4OTY3MTU2MH0.NOLMVhmQuL4EuqbB9NWKhHv4Bk696mqpsumULtbktaM';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── Local Express API base ────────────────────────────────────────────────────
const API = 'http://localhost:5000';

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function post(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST ${path} failed (${res.status}): ${text}`);
  }
  return res.json();
}

async function fetchAll(table) {
  const { data, error } = await supabase.from(table).select('*');
  if (error) throw new Error(`Supabase fetch "${table}" failed: ${error.message}`);
  return data ?? [];
}

function toNum(v) {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const summary = {};

async function migrateDecks() {
  console.log('\n── Migrating decks ──────────────────────────────────────');
  const rows = await fetchAll('decks');
  console.log(`  Found ${rows.length} decks in Supabase`);

  const idMap = {}; // supabase_id → sqlite_id
  let ok = 0, fail = 0;

  for (const row of rows) {
    try {
      const created = await post('/api/decks', {
        name: row.name,
        format: row.format,
        description: row.description ?? null,
        coverImage: row.cover_image ?? null,
      });
      idMap[row.id] = created.id;
      ok++;
      console.log(`  [OK] deck "${row.name}" (${row.id} → ${created.id})`);
    } catch (err) {
      fail++;
      console.error(`  [FAIL] deck "${row.name}": ${err.message}`);
    }
  }

  summary.decks = { total: rows.length, ok, fail };
  return idMap;
}

async function migrateDeckCards(deckIdMap) {
  console.log('\n── Migrating deck_cards ─────────────────────────────────');
  const rows = await fetchAll('deck_cards');
  console.log(`  Found ${rows.length} deck_cards in Supabase`);

  let ok = 0, fail = 0, skipped = 0;

  for (const row of rows) {
    const newDeckId = deckIdMap[row.deck_id];
    if (!newDeckId) {
      console.warn(`  [SKIP] deck_card "${row.name}" — unknown deck_id ${row.deck_id}`);
      skipped++;
      continue;
    }
    try {
      await post(`/api/decks/${newDeckId}/cards`, {
        scryfallId:    row.scryfall_id,
        name:          row.name,
        typeLine:      row.type_line,
        manaCost:      row.mana_cost,
        cmc:           toNum(row.cmc),
        imageSmall:    row.image_small,
        imageNormal:   row.image_normal,
        colors:        row.colors,
        colorIdentity: row.color_identity,
        rarity:        row.rarity,
        oracleText:    row.oracle_text,
        power:         row.power,
        toughness:     row.toughness,
        quantity:      toNum(row.quantity) ?? 1,
        board:         row.board,
        priceUsd:      row.price_usd,
        isCommander:   row.is_commander === true || row.is_commander === 1,
        legalities:    row.legalities,
      });
      ok++;
    } catch (err) {
      fail++;
      console.error(`  [FAIL] deck_card "${row.name}" (deck ${row.deck_id}): ${err.message}`);
    }
  }

  console.log(`  OK: ${ok}  Fail: ${fail}  Skipped: ${skipped}`);
  summary.deck_cards = { total: rows.length, ok, fail, skipped };
}

async function migrateCollection() {
  console.log('\n── Migrating collection_cards ───────────────────────────');
  const rows = await fetchAll('collection_cards');
  console.log(`  Found ${rows.length} collection_cards in Supabase`);

  let ok = 0, fail = 0;

  for (const row of rows) {
    try {
      await post('/api/collection', {
        scryfallId:    row.scryfall_id,
        name:          row.name,
        typeLine:      row.type_line,
        manaCost:      row.mana_cost,
        cmc:           toNum(row.cmc),
        imageSmall:    row.image_small,
        imageNormal:   row.image_normal,
        priceUsd:      row.price_usd,
        colors:        row.colors,
        colorIdentity: row.color_identity,
        rarity:        row.rarity,
        setName:       row.set_name,
        setCode:       row.set_code,
        quantity:      toNum(row.quantity) ?? 1,
        oracleText:    row.oracle_text,
        power:         row.power,
        toughness:     row.toughness,
      });
      ok++;
    } catch (err) {
      fail++;
      console.error(`  [FAIL] collection card "${row.name}": ${err.message}`);
    }
  }

  console.log(`  OK: ${ok}  Fail: ${fail}`);
  summary.collection_cards = { total: rows.length, ok, fail };
}

async function migrateGameHistory(deckIdMap) {
  console.log('\n── Migrating game_history ───────────────────────────────');
  const rows = await fetchAll('game_history');
  console.log(`  Found ${rows.length} game_history rows in Supabase`);

  let ok = 0, fail = 0, skipped = 0;

  for (const row of rows) {
    const newDeckId = deckIdMap[row.deck_id];
    if (!newDeckId) {
      console.warn(`  [SKIP] game_history id=${row.id} — unknown deck_id ${row.deck_id}`);
      skipped++;
      continue;
    }
    try {
      await post(`/api/decks/${newDeckId}/history`, {
        date:     row.date,
        opponent: row.opponent,
        result:   row.result,
        notes:    row.notes,
      });
      ok++;
    } catch (err) {
      fail++;
      console.error(`  [FAIL] game_history id=${row.id}: ${err.message}`);
    }
  }

  console.log(`  OK: ${ok}  Fail: ${fail}  Skipped: ${skipped}`);
  summary.game_history = { total: rows.length, ok, fail, skipped };
}

async function migrateWishlist() {
  console.log('\n── Migrating wishlist ───────────────────────────────────');
  const rows = await fetchAll('wishlist');
  console.log(`  Found ${rows.length} wishlist rows in Supabase`);

  let ok = 0, fail = 0;

  for (const row of rows) {
    try {
      await post('/api/wishlist', {
        scryfallId:  row.scryfall_id,
        name:        row.name,
        imageSmall:  row.image_small,
        imageNormal: row.image_normal,
        priceUsd:    row.price_usd,
        typeLine:    row.type_line,
        addedDate:   row.added_date,
      });
      ok++;
    } catch (err) {
      fail++;
      console.error(`  [FAIL] wishlist "${row.name}": ${err.message}`);
    }
  }

  console.log(`  OK: ${ok}  Fail: ${fail}`);
  summary.wishlist = { total: rows.length, ok, fail };
}

async function migrateRivals() {
  console.log('\n── Migrating rivals ─────────────────────────────────────');
  const rows = await fetchAll('rivals');
  console.log(`  Found ${rows.length} rivals in Supabase`);

  let ok = 0, fail = 0;

  for (const row of rows) {
    try {
      // SQLite schema stores arrays as JSON text — stringify them
      const toJsonStr = (v) => {
        if (v === null || v === undefined) return '[]';
        if (Array.isArray(v)) return JSON.stringify(v);
        return JSON.stringify([v]);
      };

      await post('/api/rivals', {
        playerName:  row.player_name,
        deckName:    row.deck_name,
        commander:   row.commander,
        colors:      row.colors,
        strategy:    row.strategy,
        keyThreats:  toJsonStr(row.key_threats),
        weaknesses:  toJsonStr(row.weaknesses),
        counterTips: toJsonStr(row.counter_tips),
        notes:       row.notes,
      });
      ok++;
      console.log(`  [OK] rival "${row.player_name}" (${row.deck_name})`);
    } catch (err) {
      fail++;
      console.error(`  [FAIL] rival "${row.player_name}": ${err.message}`);
    }
  }

  console.log(`  OK: ${ok}  Fail: ${fail}`);
  summary.rivals = { total: rows.length, ok, fail };
}

// ─── Run ──────────────────────────────────────────────────────────────────────
(async () => {
  console.log('=== MTG Deck Centre — Supabase → SQLite migration ===');
  console.log(`  Supabase: ${SUPABASE_URL}`);
  console.log(`  Local API: ${API}`);
  console.log(`  Started: ${new Date().toISOString()}`);

  try {
    const deckIdMap = await migrateDecks();
    await migrateDeckCards(deckIdMap);
    await migrateCollection();
    await migrateGameHistory(deckIdMap);
    await migrateWishlist();
    await migrateRivals();
  } catch (err) {
    console.error('\nFatal error during migration:', err);
    process.exit(1);
  }

  console.log('\n=== Migration summary ===');
  for (const [table, stats] of Object.entries(summary)) {
    const parts = [`total=${stats.total}`, `ok=${stats.ok}`, `fail=${stats.fail}`];
    if (stats.skipped !== undefined) parts.push(`skipped=${stats.skipped}`);
    console.log(`  ${table.padEnd(16)} ${parts.join('  ')}`);
  }

  const totalFails = Object.values(summary).reduce((s, v) => s + v.fail, 0);
  console.log(`\n  Finished: ${new Date().toISOString()}`);
  console.log(totalFails === 0 ? '  All records migrated successfully.' : `  Migration complete with ${totalFails} failure(s).`);
})();
