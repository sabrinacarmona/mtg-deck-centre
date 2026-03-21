import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Collection cards
export const collectionCards = sqliteTable("collection_cards", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  scryfallId: text("scryfall_id").notNull(),
  name: text("name").notNull(),
  typeLine: text("type_line").notNull(),
  manaCost: text("mana_cost"),
  cmc: integer("cmc").default(0),
  imageSmall: text("image_small"),
  imageNormal: text("image_normal"),
  priceUsd: text("price_usd"),
  colors: text("colors"), // JSON array stored as text
  colorIdentity: text("color_identity"), // JSON array stored as text
  rarity: text("rarity"),
  setName: text("set_name"),
  setCode: text("set_code"),
  quantity: integer("quantity").default(1),
  oracleText: text("oracle_text"),
  power: text("power"),
  toughness: text("toughness"),
});

export const insertCollectionCardSchema = createInsertSchema(collectionCards).omit({ id: true });
export type InsertCollectionCard = z.infer<typeof insertCollectionCardSchema>;
export type CollectionCard = typeof collectionCards.$inferSelect;

// Decks
export const decks = sqliteTable("decks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  format: text("format").notNull().default("commander"),
  description: text("description"),
  coverImage: text("cover_image"),
});

export const insertDeckSchema = createInsertSchema(decks).omit({ id: true });
export type InsertDeck = z.infer<typeof insertDeckSchema>;
export type Deck = typeof decks.$inferSelect;

// Deck cards (many-to-many)
export const deckCards = sqliteTable("deck_cards", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  deckId: integer("deck_id").notNull(),
  scryfallId: text("scryfall_id").notNull(),
  name: text("name").notNull(),
  typeLine: text("type_line").notNull(),
  manaCost: text("mana_cost"),
  cmc: integer("cmc").default(0),
  imageSmall: text("image_small"),
  imageNormal: text("image_normal"),
  colors: text("colors"),
  colorIdentity: text("color_identity"),
  rarity: text("rarity"),
  oracleText: text("oracle_text"),
  power: text("power"),
  toughness: text("toughness"),
  quantity: integer("quantity").default(1),
  board: text("board").default("main"), // "main" or "side"
});

export const insertDeckCardSchema = createInsertSchema(deckCards).omit({ id: true });
export type InsertDeckCard = z.infer<typeof insertDeckCardSchema>;
export type DeckCard = typeof deckCards.$inferSelect;

// Scryfall API card shape (frontend only, not persisted)
export interface ScryfallCard {
  id: string;
  name: string;
  type_line: string;
  mana_cost?: string;
  cmc?: number;
  oracle_text?: string;
  power?: string;
  toughness?: string;
  colors?: string[];
  color_identity?: string[];
  rarity?: string;
  set_name?: string;
  set?: string;
  image_uris?: {
    small: string;
    normal: string;
    large: string;
    art_crop: string;
  };
  card_faces?: Array<{
    image_uris?: {
      small: string;
      normal: string;
      large: string;
      art_crop: string;
    };
    name: string;
    mana_cost?: string;
    type_line?: string;
    oracle_text?: string;
  }>;
  prices?: {
    usd?: string;
    usd_foil?: string;
    eur?: string;
  };
}
