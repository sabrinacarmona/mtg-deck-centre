import { supabase } from "./supabase";

// ===== INTERFACES =====

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

// ===== MAPPING HELPERS =====

function collectionCardFromRow(row: any): CollectionCard {
  return {
    id: row.id,
    scryfallId: row.scryfall_id,
    name: row.name,
    typeLine: row.type_line,
    manaCost: row.mana_cost,
    cmc: row.cmc,
    imageSmall: row.image_small,
    imageNormal: row.image_normal,
    priceUsd: row.price_usd,
    colors: row.colors,
    colorIdentity: row.color_identity,
    rarity: row.rarity,
    setName: row.set_name,
    setCode: row.set_code,
    quantity: row.quantity,
    oracleText: row.oracle_text,
    power: row.power,
    toughness: row.toughness,
  };
}

function collectionCardToRow(card: Omit<CollectionCard, "id">): any {
  return {
    scryfall_id: card.scryfallId,
    name: card.name,
    type_line: card.typeLine,
    mana_cost: card.manaCost,
    cmc: card.cmc,
    image_small: card.imageSmall,
    image_normal: card.imageNormal,
    price_usd: card.priceUsd,
    colors: card.colors,
    color_identity: card.colorIdentity,
    rarity: card.rarity,
    set_name: card.setName,
    set_code: card.setCode,
    quantity: card.quantity,
    oracle_text: card.oracleText,
    power: card.power,
    toughness: card.toughness,
  };
}

function deckFromRow(row: any): Deck {
  return {
    id: row.id,
    name: row.name,
    format: row.format,
    description: row.description,
    coverImage: row.cover_image,
  };
}

function deckToRow(deck: Omit<Deck, "id">): any {
  return {
    name: deck.name,
    format: deck.format,
    description: deck.description,
    cover_image: deck.coverImage,
  };
}

function deckCardFromRow(row: any): DeckCard {
  return {
    id: row.id,
    deckId: row.deck_id,
    scryfallId: row.scryfall_id,
    name: row.name,
    typeLine: row.type_line,
    manaCost: row.mana_cost,
    cmc: row.cmc,
    imageSmall: row.image_small,
    imageNormal: row.image_normal,
    colors: row.colors,
    colorIdentity: row.color_identity,
    rarity: row.rarity,
    oracleText: row.oracle_text,
    power: row.power,
    toughness: row.toughness,
    quantity: row.quantity,
    board: row.board,
    priceUsd: row.price_usd,
    isCommander: row.is_commander,
    legalities: row.legalities,
  };
}

function deckCardToRow(card: Omit<DeckCard, "id">): any {
  return {
    deck_id: card.deckId,
    scryfall_id: card.scryfallId,
    name: card.name,
    type_line: card.typeLine,
    mana_cost: card.manaCost,
    cmc: card.cmc,
    image_small: card.imageSmall,
    image_normal: card.imageNormal,
    colors: card.colors,
    color_identity: card.colorIdentity,
    rarity: card.rarity,
    oracle_text: card.oracleText,
    power: card.power,
    toughness: card.toughness,
    quantity: card.quantity,
    board: card.board,
    price_usd: card.priceUsd,
    is_commander: card.isCommander ?? false,
    legalities: card.legalities,
  };
}

function gameHistoryFromRow(row: any): GameHistoryEntry {
  return {
    id: row.id,
    deckId: row.deck_id,
    date: row.date,
    opponent: row.opponent,
    result: row.result,
    notes: row.notes,
  };
}

function gameHistoryToRow(entry: Omit<GameHistoryEntry, "id">): any {
  return {
    deck_id: entry.deckId,
    date: entry.date,
    opponent: entry.opponent,
    result: entry.result,
    notes: entry.notes,
  };
}

function wishlistFromRow(row: any): WishlistCard {
  return {
    id: row.id,
    scryfallId: row.scryfall_id,
    name: row.name,
    imageSmall: row.image_small,
    imageNormal: row.image_normal,
    priceUsd: row.price_usd,
    typeLine: row.type_line,
    addedDate: row.added_date,
  };
}

function wishlistToRow(card: Omit<WishlistCard, "id">): any {
  return {
    scryfall_id: card.scryfallId,
    name: card.name,
    image_small: card.imageSmall,
    image_normal: card.imageNormal,
    price_usd: card.priceUsd,
    type_line: card.typeLine,
    added_date: card.addedDate,
  };
}

function rivalFromRow(row: any): Rival {
  return {
    id: row.id,
    playerName: row.player_name,
    deckName: row.deck_name,
    commander: row.commander,
    colors: row.colors,
    strategy: row.strategy,
    keyThreats: row.key_threats || [],
    weaknesses: row.weaknesses || [],
    counterTips: row.counter_tips || [],
    notes: row.notes,
  };
}

function rivalToRow(rival: Omit<Rival, "id">): any {
  return {
    player_name: rival.playerName,
    deck_name: rival.deckName,
    commander: rival.commander,
    colors: rival.colors,
    strategy: rival.strategy,
    key_threats: rival.keyThreats,
    weaknesses: rival.weaknesses,
    counter_tips: rival.counterTips,
    notes: rival.notes,
  };
}

// ===== COLLECTION =====

export async function getCollectionCards(): Promise<CollectionCard[]> {
  const { data, error } = await supabase.from("collection_cards").select("*");
  if (error) throw error;
  return (data || []).map(collectionCardFromRow);
}

export async function addCollectionCard(
  card: Omit<CollectionCard, "id">
): Promise<CollectionCard> {
  // Check if already exists by scryfallId
  const { data: existing } = await supabase
    .from("collection_cards")
    .select("*")
    .eq("scryfall_id", card.scryfallId)
    .limit(1);

  if (existing && existing.length > 0) {
    const row = existing[0];
    const newQty = (row.quantity || 1) + (card.quantity || 1);
    const { data: updated, error } = await supabase
      .from("collection_cards")
      .update({ quantity: newQty })
      .eq("id", row.id)
      .select()
      .single();
    if (error) throw error;
    return collectionCardFromRow(updated);
  }

  const { data, error } = await supabase
    .from("collection_cards")
    .insert(collectionCardToRow(card))
    .select()
    .single();
  if (error) throw error;
  return collectionCardFromRow(data);
}

export async function updateCollectionCardQuantity(
  id: number,
  quantity: number
): Promise<CollectionCard | null> {
  const { data, error } = await supabase
    .from("collection_cards")
    .update({ quantity })
    .eq("id", id)
    .select()
    .single();
  if (error) return null;
  return collectionCardFromRow(data);
}

export async function removeCollectionCard(id: number): Promise<void> {
  const { error } = await supabase.from("collection_cards").delete().eq("id", id);
  if (error) throw error;
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
  const { data, error } = await supabase.from("decks").select("*");
  if (error) throw error;
  return (data || []).map(deckFromRow);
}

export async function getDeck(id: number): Promise<Deck | undefined> {
  const { data, error } = await supabase
    .from("decks")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return undefined;
  return deckFromRow(data);
}

export async function createDeck(
  deck: Omit<Deck, "id">
): Promise<Deck> {
  const { data, error } = await supabase
    .from("decks")
    .insert(deckToRow(deck))
    .select()
    .single();
  if (error) throw error;
  return deckFromRow(data);
}

export async function updateDeck(
  id: number,
  data: Partial<Omit<Deck, "id">>
): Promise<Deck | null> {
  const row: any = {};
  if (data.name !== undefined) row.name = data.name;
  if (data.format !== undefined) row.format = data.format;
  if (data.description !== undefined) row.description = data.description;
  if (data.coverImage !== undefined) row.cover_image = data.coverImage;

  const { data: updated, error } = await supabase
    .from("decks")
    .update(row)
    .eq("id", id)
    .select()
    .single();
  if (error) return null;
  return deckFromRow(updated);
}

export async function deleteDeck(id: number): Promise<void> {
  // Delete deck cards first
  await supabase.from("deck_cards").delete().eq("deck_id", id);
  // Delete game history for this deck
  await supabase.from("game_history").delete().eq("deck_id", id);
  // Delete the deck
  const { error } = await supabase.from("decks").delete().eq("id", id);
  if (error) throw error;
}

// ===== DECK CARDS =====

export async function getDeckCards(deckId: number): Promise<DeckCard[]> {
  const { data, error } = await supabase
    .from("deck_cards")
    .select("*")
    .eq("deck_id", deckId);
  if (error) throw error;
  return (data || []).map(deckCardFromRow);
}

export async function addDeckCard(
  card: Omit<DeckCard, "id">
): Promise<DeckCard> {
  // Check if already exists in this deck on same board
  const { data: existing } = await supabase
    .from("deck_cards")
    .select("*")
    .eq("deck_id", card.deckId)
    .eq("scryfall_id", card.scryfallId)
    .eq("board", card.board || "main")
    .limit(1);

  if (existing && existing.length > 0) {
    const row = existing[0];
    const newQty = (row.quantity || 1) + (card.quantity || 1);
    const { data: updated, error } = await supabase
      .from("deck_cards")
      .update({ quantity: newQty })
      .eq("id", row.id)
      .select()
      .single();
    if (error) throw error;
    return deckCardFromRow(updated);
  }

  const { data, error } = await supabase
    .from("deck_cards")
    .insert(deckCardToRow(card))
    .select()
    .single();
  if (error) throw error;
  return deckCardFromRow(data);
}

export async function updateDeckCardQuantity(
  id: number,
  quantity: number
): Promise<DeckCard | null> {
  const { data, error } = await supabase
    .from("deck_cards")
    .update({ quantity })
    .eq("id", id)
    .select()
    .single();
  if (error) return null;
  return deckCardFromRow(data);
}

export async function updateDeckCard(
  id: number,
  data: Partial<Omit<DeckCard, "id">>
): Promise<DeckCard | null> {
  const row: any = {};
  if (data.deckId !== undefined) row.deck_id = data.deckId;
  if (data.scryfallId !== undefined) row.scryfall_id = data.scryfallId;
  if (data.name !== undefined) row.name = data.name;
  if (data.typeLine !== undefined) row.type_line = data.typeLine;
  if (data.manaCost !== undefined) row.mana_cost = data.manaCost;
  if (data.cmc !== undefined) row.cmc = data.cmc;
  if (data.imageSmall !== undefined) row.image_small = data.imageSmall;
  if (data.imageNormal !== undefined) row.image_normal = data.imageNormal;
  if (data.colors !== undefined) row.colors = data.colors;
  if (data.colorIdentity !== undefined) row.color_identity = data.colorIdentity;
  if (data.rarity !== undefined) row.rarity = data.rarity;
  if (data.oracleText !== undefined) row.oracle_text = data.oracleText;
  if (data.power !== undefined) row.power = data.power;
  if (data.toughness !== undefined) row.toughness = data.toughness;
  if (data.quantity !== undefined) row.quantity = data.quantity;
  if (data.board !== undefined) row.board = data.board;
  if (data.priceUsd !== undefined) row.price_usd = data.priceUsd;
  if (data.isCommander !== undefined) row.is_commander = data.isCommander;
  if (data.legalities !== undefined) row.legalities = data.legalities;

  const { data: updated, error } = await supabase
    .from("deck_cards")
    .update(row)
    .eq("id", id)
    .select()
    .single();
  if (error) return null;
  return deckCardFromRow(updated);
}

export async function removeDeckCard(id: number): Promise<void> {
  const { error } = await supabase.from("deck_cards").delete().eq("id", id);
  if (error) throw error;
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
  const { data, error } = await supabase
    .from("game_history")
    .select("*")
    .eq("deck_id", deckId);
  if (error) throw error;
  return (data || []).map(gameHistoryFromRow);
}

export async function addGameHistoryEntry(
  entry: Omit<GameHistoryEntry, "id">
): Promise<GameHistoryEntry> {
  const { data, error } = await supabase
    .from("game_history")
    .insert(gameHistoryToRow(entry))
    .select()
    .single();
  if (error) throw error;
  return gameHistoryFromRow(data);
}

export async function removeGameHistoryEntry(id: number): Promise<void> {
  const { error } = await supabase.from("game_history").delete().eq("id", id);
  if (error) throw error;
}

// ===== WISHLIST =====

export async function getWishlistCards(): Promise<WishlistCard[]> {
  const { data, error } = await supabase.from("wishlist").select("*");
  if (error) throw error;
  return (data || []).map(wishlistFromRow);
}

export async function addWishlistCard(
  card: Omit<WishlistCard, "id">
): Promise<WishlistCard> {
  // Check if already exists
  const { data: existing } = await supabase
    .from("wishlist")
    .select("*")
    .eq("scryfall_id", card.scryfallId)
    .limit(1);

  if (existing && existing.length > 0) {
    return wishlistFromRow(existing[0]);
  }

  const { data, error } = await supabase
    .from("wishlist")
    .insert(wishlistToRow(card))
    .select()
    .single();
  if (error) throw error;
  return wishlistFromRow(data);
}

export async function removeWishlistCard(id: number): Promise<void> {
  const { error } = await supabase.from("wishlist").delete().eq("id", id);
  if (error) throw error;
}

export async function removeWishlistByScryfallId(scryfallId: string): Promise<void> {
  const { error } = await supabase
    .from("wishlist")
    .delete()
    .eq("scryfall_id", scryfallId);
  if (error) throw error;
}

// ===== RIVALS =====

export async function getRivals(): Promise<Rival[]> {
  const { data, error } = await supabase.from("rivals").select("*");
  if (error) throw error;
  return (data || []).map(rivalFromRow);
}

export async function addRival(rival: Omit<Rival, "id">): Promise<Rival> {
  const { data, error } = await supabase
    .from("rivals")
    .insert(rivalToRow(rival))
    .select()
    .single();
  if (error) throw error;
  return rivalFromRow(data);
}

export async function updateRival(
  id: number,
  data: Partial<Omit<Rival, "id">>
): Promise<Rival | null> {
  const row: any = {};
  if (data.playerName !== undefined) row.player_name = data.playerName;
  if (data.deckName !== undefined) row.deck_name = data.deckName;
  if (data.commander !== undefined) row.commander = data.commander;
  if (data.colors !== undefined) row.colors = data.colors;
  if (data.strategy !== undefined) row.strategy = data.strategy;
  if (data.keyThreats !== undefined) row.key_threats = data.keyThreats;
  if (data.weaknesses !== undefined) row.weaknesses = data.weaknesses;
  if (data.counterTips !== undefined) row.counter_tips = data.counterTips;
  if (data.notes !== undefined) row.notes = data.notes;

  const { data: updated, error } = await supabase
    .from("rivals")
    .update(row)
    .eq("id", id)
    .select()
    .single();
  if (error) return null;
  return rivalFromRow(updated);
}

export async function deleteRival(id: number): Promise<void> {
  const { error } = await supabase.from("rivals").delete().eq("id", id);
  if (error) throw error;
}

// ===== SCRYFALL (direct client calls — unchanged) =====

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
