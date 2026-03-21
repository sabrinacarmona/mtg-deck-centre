import { openDB, type IDBPDatabase } from "idb";
import { SEED_DECKS, type SeedDeck } from "./seed-decks";

const DB_NAME = "mtg-deck-centre";
const DB_VERSION = 1;
const SEED_KEY = "mtg-deck-centre-seeded";

interface CollectionCard {
  id?: number;
  scryfallId: string;
  name: string;
  typeLine: string;
  manaCost: string | null;
  cmc: number;
  imageSmall: string | null;
  imageNormal: string | null;
  priceUsd: string | null;
  colors: string | null;
  colorIdentity: string | null;
  rarity: string | null;
  setName: string | null;
  setCode: string | null;
  quantity: number;
  oracleText: string | null;
  power: string | null;
  toughness: string | null;
}

interface Deck {
  id?: number;
  name: string;
  format: string;
  description: string | null;
  coverImage: string | null;
}

interface DeckCard {
  id?: number;
  deckId: number;
  scryfallId: string;
  name: string;
  typeLine: string;
  manaCost: string | null;
  cmc: number;
  imageSmall: string | null;
  imageNormal: string | null;
  colors: string | null;
  colorIdentity: string | null;
  rarity: string | null;
  oracleText: string | null;
  power: string | null;
  toughness: string | null;
  quantity: number;
  board: string;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Collection store
        if (!db.objectStoreNames.contains("collectionCards")) {
          const cs = db.createObjectStore("collectionCards", {
            keyPath: "id",
            autoIncrement: true,
          });
          cs.createIndex("scryfallId", "scryfallId", { unique: false });
        }
        // Decks store
        if (!db.objectStoreNames.contains("decks")) {
          db.createObjectStore("decks", { keyPath: "id", autoIncrement: true });
        }
        // Deck cards store
        if (!db.objectStoreNames.contains("deckCards")) {
          const dc = db.createObjectStore("deckCards", {
            keyPath: "id",
            autoIncrement: true,
          });
          dc.createIndex("deckId", "deckId", { unique: false });
        }
      },
    });
  }
  return dbPromise;
}

// ===== COLLECTION =====

export async function getCollectionCards(): Promise<CollectionCard[]> {
  const db = await getDB();
  return db.getAll("collectionCards");
}

export async function addCollectionCard(
  card: Omit<CollectionCard, "id">
): Promise<CollectionCard> {
  const db = await getDB();
  // Check if already exists by scryfallId
  const all = await db.getAllFromIndex(
    "collectionCards",
    "scryfallId",
    card.scryfallId
  );
  if (all.length > 0) {
    const existing = all[0];
    existing.quantity = (existing.quantity || 1) + (card.quantity || 1);
    await db.put("collectionCards", existing);
    return existing;
  }
  const id = await db.add("collectionCards", { ...card });
  return { ...card, id: id as number };
}

export async function updateCollectionCardQuantity(
  id: number,
  quantity: number
): Promise<CollectionCard | null> {
  const db = await getDB();
  const card = await db.get("collectionCards", id);
  if (!card) return null;
  card.quantity = quantity;
  await db.put("collectionCards", card);
  return card;
}

export async function removeCollectionCard(id: number): Promise<void> {
  const db = await getDB();
  await db.delete("collectionCards", id);
}

export async function bulkImportCollection(
  cards: Omit<CollectionCard, "id">[]
): Promise<{ added: number; failed: string[] }> {
  let added = 0;
  const failed: string[] = [];
  for (const card of cards) {
    try {
      await addCollectionCard(card);
      added++;
    } catch {
      failed.push(card.name || "Unknown");
    }
  }
  return { added, failed };
}

// ===== DECKS =====

export async function getDecks(): Promise<Deck[]> {
  const db = await getDB();
  return db.getAll("decks");
}

export async function getDeck(id: number): Promise<Deck | undefined> {
  const db = await getDB();
  return db.get("decks", id);
}

export async function createDeck(
  deck: Omit<Deck, "id">
): Promise<Deck> {
  const db = await getDB();
  const id = await db.add("decks", { ...deck });
  return { ...deck, id: id as number };
}

export async function updateDeck(
  id: number,
  data: Partial<Omit<Deck, "id">>
): Promise<Deck | null> {
  const db = await getDB();
  const deck = await db.get("decks", id);
  if (!deck) return null;
  Object.assign(deck, data);
  await db.put("decks", deck);
  return deck;
}

export async function deleteDeck(id: number): Promise<void> {
  const db = await getDB();
  // Delete all deck cards first
  const cards = await db.getAllFromIndex("deckCards", "deckId", id);
  const tx = db.transaction("deckCards", "readwrite");
  for (const card of cards) {
    tx.store.delete(card.id);
  }
  await tx.done;
  await db.delete("decks", id);
}

// ===== DECK CARDS =====

export async function getDeckCards(deckId: number): Promise<DeckCard[]> {
  const db = await getDB();
  return db.getAllFromIndex("deckCards", "deckId", deckId);
}

export async function addDeckCard(
  card: Omit<DeckCard, "id">
): Promise<DeckCard> {
  const db = await getDB();
  // Check if already exists in this deck on same board
  const all = await db.getAllFromIndex("deckCards", "deckId", card.deckId);
  const existing = all.find(
    (c) => c.scryfallId === card.scryfallId && c.board === (card.board || "main")
  );
  if (existing) {
    existing.quantity = (existing.quantity || 1) + (card.quantity || 1);
    await db.put("deckCards", existing);
    return existing;
  }
  const id = await db.add("deckCards", { ...card });
  return { ...card, id: id as number };
}

export async function updateDeckCardQuantity(
  id: number,
  quantity: number
): Promise<DeckCard | null> {
  const db = await getDB();
  const card = await db.get("deckCards", id);
  if (!card) return null;
  card.quantity = quantity;
  await db.put("deckCards", card);
  return card;
}

export async function removeDeckCard(id: number): Promise<void> {
  const db = await getDB();
  await db.delete("deckCards", id);
}

export async function bulkImportDeck(
  deckId: number,
  cards: Omit<DeckCard, "id">[]
): Promise<{ added: number; failed: string[] }> {
  let added = 0;
  const failed: string[] = [];
  for (const card of cards) {
    try {
      await addDeckCard({ ...card, deckId });
      added++;
    } catch {
      failed.push(card.name || "Unknown");
    }
  }
  return { added, failed };
}

// ===== SCRYFALL (direct client calls) =====

const SCRYFALL_BASE = "https://api.scryfall.com";

export async function scryfallSearch(
  q: string
): Promise<{ data: any[] }> {
  if (!q || q.length < 2) return { data: [] };
  const res = await fetch(
    `${SCRYFALL_BASE}/cards/search?q=${encodeURIComponent(q)}&order=name`
  );
  if (!res.ok) {
    if (res.status === 404) return { data: [] };
    throw new Error(`Scryfall error: ${res.status}`);
  }
  return res.json();
}

export async function scryfallRandom(): Promise<any> {
  const res = await fetch(`${SCRYFALL_BASE}/cards/random`);
  return res.json();
}

export async function scryfallCollection(
  identifiers: Array<{ name: string; set?: string }>
): Promise<{ data: any[]; not_found: any[] }> {
  const allCards: any[] = [];
  const allNotFound: any[] = [];

  for (let i = 0; i < identifiers.length; i += 75) {
    const batch = identifiers.slice(i, i + 75);
    const res = await fetch(`${SCRYFALL_BASE}/cards/collection`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifiers: batch }),
    });
    if (!res.ok) throw new Error(`Scryfall error: ${res.status}`);
    const data = await res.json();
    allCards.push(...(data.data || []));
    allNotFound.push(...(data.not_found || []));
    if (i + 75 < identifiers.length) {
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  return { data: allCards, not_found: allNotFound };
}

// ===== AUTO-SEED ON FIRST LOAD =====

function parseDecklistLine(line: string): { quantity: number; name: string } | null {
  const t = line.trim();
  if (!t) return null;
  const m = t.match(/^(\d+)\s+(.+)$/);
  return m ? { quantity: parseInt(m[1]), name: m[2].trim() } : null;
}

function scryfallToPayload(card: any, qty: number, forDeck: boolean) {
  const base: any = {
    scryfallId: card.id,
    name: card.name,
    typeLine: card.type_line,
    manaCost: card.mana_cost || null,
    cmc: card.cmc ? Math.floor(card.cmc) : 0,
    imageSmall: card.image_uris?.small || card.card_faces?.[0]?.image_uris?.small || null,
    imageNormal: card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal || null,
    colors: JSON.stringify(card.colors || []),
    colorIdentity: JSON.stringify(card.color_identity || []),
    rarity: card.rarity || null,
    oracleText: card.oracle_text || null,
    power: card.power || null,
    toughness: card.toughness || null,
    quantity: qty,
  };
  if (forDeck) {
    base.board = "main";
  } else {
    base.priceUsd = card.prices?.usd || null;
    base.setName = card.set_name || null;
    base.setCode = card.set || null;
  }
  return base;
}

async function seedOneDeck(seed: SeedDeck): Promise<number> {
  const entries = seed.decklist.split("\n").map(parseDecklistLine).filter(Boolean) as { quantity: number; name: string }[];

  // Resolve via Scryfall — handle split cards by searching first half
  const identifiers = entries.map((e) => {
    const name = e.name.includes(" // ") ? e.name.split(" // ")[0] : e.name;
    return { name };
  });

  const resolved = await scryfallCollection(identifiers);
  const cardMap = new Map<string, any>();
  for (const card of resolved.data) {
    cardMap.set(card.name.toLowerCase(), card);
    if (card.card_faces?.length > 0) {
      cardMap.set(card.card_faces[0].name.toLowerCase(), card);
    }
  }

  // Create the deck
  const deck = await createDeck({ name: seed.name, format: seed.format, description: null, coverImage: null });

  let imported = 0;
  for (const entry of entries) {
    const lookupName = entry.name.includes(" // ") ? entry.name.split(" // ")[0] : entry.name;
    const card = cardMap.get(lookupName.toLowerCase());
    if (!card) continue;

    // Add to collection
    await addCollectionCard(scryfallToPayload(card, entry.quantity, false));
    // Add to deck
    await addDeckCard({ ...scryfallToPayload(card, entry.quantity, true), deckId: deck.id! });
    imported++;
  }

  return imported;
}

let seedPromise: Promise<void> | null = null;

export function initSeedIfNeeded(): Promise<void> {
  if (seedPromise) return seedPromise;

  seedPromise = (async () => {
    // Check if already seeded using a simple flag
    // We use the deck count as indicator — if there are decks, we're done
    const existingDecks = await getDecks();
    if (existingDecks.length > 0) return;

    console.log("[MTG Deck Centre] First load — seeding 4 precon decks from Scryfall...");

    for (const seed of SEED_DECKS) {
      try {
        const count = await seedOneDeck(seed);
        console.log(`  ✓ ${seed.name}: ${count} cards imported`);
      } catch (err) {
        console.error(`  ✗ ${seed.name}: failed`, err);
      }
    }

    console.log("[MTG Deck Centre] Seeding complete.");
  })();

  return seedPromise;
}
