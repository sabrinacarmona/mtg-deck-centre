import { openDB, type IDBPDatabase } from "idb";
import { SEED_DECKS, type SeedDeck } from "./seed-decks";

const DB_NAME = "mtg-deck-centre";
const DB_VERSION = 3;
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
  priceUsd?: string | null;
  isCommander?: boolean;
  legalities?: string | null;
}

interface GameHistoryEntry {
  id?: number;
  deckId: number;
  date: string;
  opponent: string;
  result: "win" | "loss" | "draw";
  notes: string;
}

interface WishlistCard {
  id?: number;
  scryfallId: string;
  name: string;
  imageSmall: string | null;
  imageNormal: string | null;
  priceUsd: string | null;
  typeLine: string;
  addedDate: string;
}

export interface Rival {
  id?: number;
  playerName: string;
  deckName: string;
  commander: string;
  colors: string;
  strategy: string;
  keyThreats: string[];
  weaknesses: string[];
  counterTips: string[];
  notes: string;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
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
        // V2 stores
        if (oldVersion < 2) {
          // Game history store
          if (!db.objectStoreNames.contains("gameHistory")) {
            const gh = db.createObjectStore("gameHistory", {
              keyPath: "id",
              autoIncrement: true,
            });
            gh.createIndex("deckId", "deckId", { unique: false });
          }
          // Wishlist store
          if (!db.objectStoreNames.contains("wishlist")) {
            const wl = db.createObjectStore("wishlist", {
              keyPath: "id",
              autoIncrement: true,
            });
            wl.createIndex("scryfallId", "scryfallId", { unique: false });
          }
        }
        // V3 stores
        if (oldVersion < 3) {
          if (!db.objectStoreNames.contains("rivals")) {
            db.createObjectStore("rivals", { keyPath: "id", autoIncrement: true });
          }
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

export async function updateDeckCard(
  id: number,
  data: Partial<Omit<DeckCard, "id">>
): Promise<DeckCard | null> {
  const db = await getDB();
  const card = await db.get("deckCards", id);
  if (!card) return null;
  Object.assign(card, data);
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

// ===== GAME HISTORY =====

export async function getGameHistory(deckId: number): Promise<GameHistoryEntry[]> {
  const db = await getDB();
  return db.getAllFromIndex("gameHistory", "deckId", deckId);
}

export async function addGameHistoryEntry(
  entry: Omit<GameHistoryEntry, "id">
): Promise<GameHistoryEntry> {
  const db = await getDB();
  const id = await db.add("gameHistory", { ...entry });
  return { ...entry, id: id as number };
}

export async function removeGameHistoryEntry(id: number): Promise<void> {
  const db = await getDB();
  await db.delete("gameHistory", id);
}

// ===== WISHLIST =====

export async function getWishlistCards(): Promise<WishlistCard[]> {
  const db = await getDB();
  return db.getAll("wishlist");
}

export async function addWishlistCard(
  card: Omit<WishlistCard, "id">
): Promise<WishlistCard> {
  const db = await getDB();
  // Check if already exists
  const all = await db.getAllFromIndex("wishlist", "scryfallId", card.scryfallId);
  if (all.length > 0) return all[0];
  const id = await db.add("wishlist", { ...card });
  return { ...card, id: id as number };
}

export async function removeWishlistCard(id: number): Promise<void> {
  const db = await getDB();
  await db.delete("wishlist", id);
}

export async function removeWishlistByScryfallId(scryfallId: string): Promise<void> {
  const db = await getDB();
  const all = await db.getAllFromIndex("wishlist", "scryfallId", scryfallId);
  for (const card of all) {
    await db.delete("wishlist", card.id);
  }
}

// ===== RIVALS =====

export async function getRivals(): Promise<Rival[]> {
  const db = await getDB();
  return db.getAll("rivals");
}

export async function addRival(rival: Omit<Rival, "id">): Promise<Rival> {
  const db = await getDB();
  const id = await db.add("rivals", { ...rival });
  return { ...rival, id: id as number };
}

export async function updateRival(
  id: number,
  data: Partial<Omit<Rival, "id">>
): Promise<Rival | null> {
  const db = await getDB();
  const rival = await db.get("rivals", id);
  if (!rival) return null;
  Object.assign(rival, data);
  await db.put("rivals", rival);
  return rival;
}

export async function deleteRival(id: number): Promise<void> {
  const db = await getDB();
  await db.delete("rivals", id);
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
    base.priceUsd = card.prices?.usd || null;
    base.legalities = card.legalities ? JSON.stringify(card.legalities) : null;
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

export type SeedProgress = {
  current: number;
  total: number;
  deckName: string;
  phase: "decks" | "rivals" | "done";
};

let seedProgressCallback: ((p: SeedProgress) => void) | null = null;

export function onSeedProgress(cb: (p: SeedProgress) => void) {
  seedProgressCallback = cb;
}

export function initSeedIfNeeded(): Promise<void> {
  if (seedPromise) return seedPromise;

  seedPromise = (async () => {
    // Check if already seeded using a simple flag
    // We use the deck count as indicator — if there are decks, we're done
    const existingDecks = await getDecks();
    if (existingDecks.length > 0) return;

    console.log("[Sabrina's Vault] First load — seeding decks from Scryfall...");
    const total = SEED_DECKS.length;

    for (let i = 0; i < SEED_DECKS.length; i++) {
      const seed = SEED_DECKS[i];
      seedProgressCallback?.({ current: i + 1, total, deckName: seed.name, phase: "decks" });
      try {
        const count = await seedOneDeck(seed);
        console.log(`  ✓ ${seed.name}: ${count} cards imported`);
      } catch (err) {
        console.error(`  ✗ ${seed.name}: failed`, err);
      }
    }

    // Seed rival decks
    seedProgressCallback?.({ current: total, total, deckName: "Rival data", phase: "rivals" });
    console.log("[Sabrina's Vault] Seeding rival deck data...");
    const seedRivals: Omit<Rival, "id">[] = [
      {
        playerName: "Will",
        deckName: "First Flight",
        commander: "Isperia, Supreme Judge",
        colors: "WU",
        strategy: "Azorius flyers deck. Fills the board with flying creatures and buffs them with anthems like Favorable Winds, True Conviction, and Empyrean Eagle. Isperia draws cards whenever creatures attack you, so the deck generates value through combat. Wins by going wide in the air with evasive threats.",
        keyThreats: [
          "Isperia, Supreme Judge — Draws cards when attacked, hard to race",
          "Sephara, Sky's Blade — 7/7 indestructible flyer, can be cheated out by tapping 4 flyers",
          "True Conviction — Gives all creatures double strike AND lifelink",
          "Steel-Plume Marshal — +3/+3 to all flying creatures when attacking",
          "Storm Herd — Creates tokens equal to life total (can be 40+)",
        ],
        weaknesses: [
          "Weak to board wipes — relies on creature board presence",
          "No counterspell protection beyond Counterspell and Negate",
          "Slow to rebuild after a wipe",
          "No graveyard recursion — what dies stays dead",
          "Relies on combat damage — pillow fort effects shut it down",
        ],
        counterTips: [
          "Board wipe before they get Sephara out — she has indestructible",
          "Kill Isperia on sight — card draw engine is the deck's backbone",
          "Use Blasphemous Act or Chain Reaction (damage-based, hits indestructible too if enough damage)",
          "Ghostly Prison / Propaganda effects force them to pay for each attacker",
          "Target anthems (Favorable Winds, Crucible of Fire) with enchantment removal",
          "Don't attack Will unless you can kill — Isperia punishes attacks",
        ],
        notes: "",
      },
      {
        playerName: "Will",
        deckName: "Fallout: Science!",
        commander: "Dr. Madison Li",
        colors: "UG",
        strategy: "Simic energy/artifact deck. Dr. Madison Li generates energy when casting artifacts, then spends energy to buff creatures, draw cards, or reanimate artifacts. Liberty Prime (backup commander) is an 8/8 with vigilance, trample, haste that needs energy to keep alive. Wins through artifact synergies, energy-fueled card advantage, and big combat damage.",
        keyThreats: [
          "Dr. Madison Li — Engine that converts artifacts into energy, then energy into card advantage",
          "Liberty Prime, Recharged — 8/8 vigilance trample haste, devastating if they have energy to maintain",
          "Panharmonicon — Doubles all enter-the-battlefield triggers",
          "Cyberdrive Awakener — Turns all artifacts into 4/4 flyers for a surprise lethal swing",
          "Kappa Cannoneer — Ward 4, gets bigger with each artifact, practically unremovable",
        ],
        weaknesses: [
          "Energy is a finite resource — if they spend it inefficiently they stall",
          "Artifact removal cripples them — Vandalblast, Bane of Progress, Collector Ouphe",
          "Liberty Prime dies if they can't pay 2 energy on attack/block",
          "Weak to Stony Silence / Null Rod effects that shut off artifacts",
          "No real board wipes — struggles to recover from a losing board position",
          "Commander is only a 2/3 — easy to remove repeatedly",
        ],
        counterTips: [
          "Prioritize artifact removal — Vandalblast is devastating, so is Bane of Progress",
          "Kill Dr. Madison Li early and often — commander tax adds up fast on a 4-mana commander",
          "If Liberty Prime is out, force them to attack/block to drain energy",
          "Don't let Panharmonicon stay on the board — double ETB triggers snowball fast",
          "Save instant-speed removal for Cyberdrive Awakener — that's their surprise kill",
          "Your Hosts of Mordor deck's Blasphemous Act handles their board well",
        ],
        notes: "",
      },
    ];
    for (const rival of seedRivals) {
      try {
        await addRival(rival);
        console.log(`  ✓ Rival: ${rival.playerName} — ${rival.deckName}`);
      } catch (err) {
        console.error(`  ✗ Rival: ${rival.playerName} — ${rival.deckName}`, err);
      }
    }

    console.log("[MTG Deck Centre] Seeding complete.");
  })();

  return seedPromise;
}
