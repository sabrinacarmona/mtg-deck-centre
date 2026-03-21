import {
  type CollectionCard, type InsertCollectionCard, collectionCards,
  type Deck, type InsertDeck, decks,
  type DeckCard, type InsertDeckCard, deckCards,
  type GameHistory, type InsertGameHistory, gameHistory,
  type Wishlist, type InsertWishlist, wishlist,
  type Rival, type InsertRival, rivals,
} from "@shared/schema";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, and } from "drizzle-orm";

const sqlite = new Database("data.db");
sqlite.pragma("journal_mode = WAL");
export const db = drizzle(sqlite);

export interface IStorage {
  // Collection
  getCollectionCards(): Promise<CollectionCard[]>;
  getCollectionCard(id: number): Promise<CollectionCard | undefined>;
  getCollectionCardByScryfallId(scryfallId: string): Promise<CollectionCard | undefined>;
  addCollectionCard(card: InsertCollectionCard): Promise<CollectionCard>;
  updateCollectionCardQuantity(id: number, quantity: number): Promise<CollectionCard | undefined>;
  removeCollectionCard(id: number): Promise<void>;

  // Decks
  getDecks(): Promise<Deck[]>;
  getDeck(id: number): Promise<Deck | undefined>;
  createDeck(deck: InsertDeck): Promise<Deck>;
  updateDeck(id: number, deck: Partial<InsertDeck>): Promise<Deck | undefined>;
  deleteDeck(id: number): Promise<void>;

  // Deck cards
  getDeckCards(deckId: number): Promise<DeckCard[]>;
  addDeckCard(card: InsertDeckCard): Promise<DeckCard>;
  updateDeckCardQuantity(id: number, quantity: number): Promise<DeckCard | undefined>;
  updateDeckCard(id: number, data: Partial<InsertDeckCard>): Promise<DeckCard | undefined>;
  removeDeckCard(id: number): Promise<void>;

  // Game history
  getGameHistory(deckId: number): Promise<GameHistory[]>;
  addGameHistory(entry: InsertGameHistory): Promise<GameHistory>;
  removeGameHistory(id: number): Promise<void>;

  // Wishlist
  getWishlist(): Promise<Wishlist[]>;
  addWishlist(card: InsertWishlist): Promise<Wishlist>;
  removeWishlist(id: number): Promise<void>;
  removeWishlistByScryfallId(scryfallId: string): Promise<void>;

  // Rivals
  getRivals(): Promise<Rival[]>;
  addRival(rival: InsertRival): Promise<Rival>;
  updateRival(id: number, data: Partial<InsertRival>): Promise<Rival | undefined>;
  deleteRival(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Collection
  async getCollectionCards(): Promise<CollectionCard[]> {
    return db.select().from(collectionCards).all();
  }

  async getCollectionCard(id: number): Promise<CollectionCard | undefined> {
    return db.select().from(collectionCards).where(eq(collectionCards.id, id)).get();
  }

  async getCollectionCardByScryfallId(scryfallId: string): Promise<CollectionCard | undefined> {
    return db.select().from(collectionCards).where(eq(collectionCards.scryfallId, scryfallId)).get();
  }

  async addCollectionCard(card: InsertCollectionCard): Promise<CollectionCard> {
    // Check if already exists - increment quantity
    const existing = await this.getCollectionCardByScryfallId(card.scryfallId);
    if (existing) {
      const updated = db.update(collectionCards)
        .set({ quantity: (existing.quantity || 1) + (card.quantity || 1) })
        .where(eq(collectionCards.id, existing.id))
        .returning()
        .get();
      return updated;
    }
    return db.insert(collectionCards).values(card).returning().get();
  }

  async updateCollectionCardQuantity(id: number, quantity: number): Promise<CollectionCard | undefined> {
    return db.update(collectionCards).set({ quantity }).where(eq(collectionCards.id, id)).returning().get();
  }

  async removeCollectionCard(id: number): Promise<void> {
    db.delete(collectionCards).where(eq(collectionCards.id, id)).run();
  }

  // Decks
  async getDecks(): Promise<Deck[]> {
    return db.select().from(decks).all();
  }

  async getDeck(id: number): Promise<Deck | undefined> {
    return db.select().from(decks).where(eq(decks.id, id)).get();
  }

  async createDeck(deck: InsertDeck): Promise<Deck> {
    return db.insert(decks).values(deck).returning().get();
  }

  async updateDeck(id: number, data: Partial<InsertDeck>): Promise<Deck | undefined> {
    return db.update(decks).set(data).where(eq(decks.id, id)).returning().get();
  }

  async deleteDeck(id: number): Promise<void> {
    db.delete(deckCards).where(eq(deckCards.deckId, id)).run();
    db.delete(decks).where(eq(decks.id, id)).run();
  }

  // Deck cards
  async getDeckCards(deckId: number): Promise<DeckCard[]> {
    return db.select().from(deckCards).where(eq(deckCards.deckId, deckId)).all();
  }

  async addDeckCard(card: InsertDeckCard): Promise<DeckCard> {
    // Check if already exists in this deck on same board
    const existing = db.select().from(deckCards)
      .where(and(
        eq(deckCards.deckId, card.deckId),
        eq(deckCards.scryfallId, card.scryfallId),
        eq(deckCards.board, card.board || "main")
      )).get();

    if (existing) {
      return db.update(deckCards)
        .set({ quantity: (existing.quantity || 1) + (card.quantity || 1) })
        .where(eq(deckCards.id, existing.id))
        .returning()
        .get();
    }
    return db.insert(deckCards).values(card).returning().get();
  }

  async updateDeckCardQuantity(id: number, quantity: number): Promise<DeckCard | undefined> {
    return db.update(deckCards).set({ quantity }).where(eq(deckCards.id, id)).returning().get();
  }

  async updateDeckCard(id: number, data: Partial<InsertDeckCard>): Promise<DeckCard | undefined> {
    return db.update(deckCards).set(data).where(eq(deckCards.id, id)).returning().get();
  }

  async removeDeckCard(id: number): Promise<void> {
    db.delete(deckCards).where(eq(deckCards.id, id)).run();
  }

  // Game history
  async getGameHistory(deckId: number): Promise<GameHistory[]> {
    return db.select().from(gameHistory).where(eq(gameHistory.deckId, deckId)).all();
  }

  async addGameHistory(entry: InsertGameHistory): Promise<GameHistory> {
    return db.insert(gameHistory).values(entry).returning().get();
  }

  async removeGameHistory(id: number): Promise<void> {
    db.delete(gameHistory).where(eq(gameHistory.id, id)).run();
  }

  // Wishlist
  async getWishlist(): Promise<Wishlist[]> {
    return db.select().from(wishlist).all();
  }

  async addWishlist(card: InsertWishlist): Promise<Wishlist> {
    // Check if already exists
    const existing = db.select().from(wishlist).where(eq(wishlist.scryfallId, card.scryfallId)).get();
    if (existing) return existing;
    return db.insert(wishlist).values(card).returning().get();
  }

  async removeWishlist(id: number): Promise<void> {
    db.delete(wishlist).where(eq(wishlist.id, id)).run();
  }

  async removeWishlistByScryfallId(scryfallId: string): Promise<void> {
    db.delete(wishlist).where(eq(wishlist.scryfallId, scryfallId)).run();
  }

  // Rivals
  async getRivals(): Promise<Rival[]> {
    return db.select().from(rivals).all();
  }

  async addRival(rival: InsertRival): Promise<Rival> {
    return db.insert(rivals).values(rival).returning().get();
  }

  async updateRival(id: number, data: Partial<InsertRival>): Promise<Rival | undefined> {
    return db.update(rivals).set(data).where(eq(rivals.id, id)).returning().get();
  }

  async deleteRival(id: number): Promise<void> {
    db.delete(rivals).where(eq(rivals.id, id)).run();
  }
}

export const storage = new DatabaseStorage();
