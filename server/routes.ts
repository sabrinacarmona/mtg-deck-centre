import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ===== COLLECTION =====
  app.get("/api/collection", async (_req, res) => {
    const cards = await storage.getCollectionCards();
    res.json(cards);
  });

  app.post("/api/collection", async (req, res) => {
    try {
      const card = await storage.addCollectionCard(req.body);
      res.json(card);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.patch("/api/collection/:id/quantity", async (req, res) => {
    const { quantity } = req.body;
    const card = await storage.updateCollectionCardQuantity(Number(req.params.id), quantity);
    if (!card) return res.status(404).json({ error: "Card not found" });
    res.json(card);
  });

  app.delete("/api/collection/:id", async (req, res) => {
    await storage.removeCollectionCard(Number(req.params.id));
    res.json({ ok: true });
  });

  // ===== DECKS =====
  app.get("/api/decks", async (_req, res) => {
    const allDecks = await storage.getDecks();
    res.json(allDecks);
  });

  app.get("/api/decks/:id", async (req, res) => {
    const deck = await storage.getDeck(Number(req.params.id));
    if (!deck) return res.status(404).json({ error: "Deck not found" });
    res.json(deck);
  });

  app.post("/api/decks", async (req, res) => {
    try {
      const deck = await storage.createDeck(req.body);
      res.json(deck);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.patch("/api/decks/:id", async (req, res) => {
    const deck = await storage.updateDeck(Number(req.params.id), req.body);
    if (!deck) return res.status(404).json({ error: "Deck not found" });
    res.json(deck);
  });

  app.delete("/api/decks/:id", async (req, res) => {
    await storage.deleteDeck(Number(req.params.id));
    res.json({ ok: true });
  });

  // ===== DECK CARDS =====
  app.get("/api/decks/:deckId/cards", async (req, res) => {
    const cards = await storage.getDeckCards(Number(req.params.deckId));
    res.json(cards);
  });

  app.post("/api/decks/:deckId/cards", async (req, res) => {
    try {
      const card = await storage.addDeckCard({
        ...req.body,
        deckId: Number(req.params.deckId),
      });
      res.json(card);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.patch("/api/deck-cards/:id/quantity", async (req, res) => {
    const { quantity } = req.body;
    const card = await storage.updateDeckCardQuantity(Number(req.params.id), quantity);
    if (!card) return res.status(404).json({ error: "Card not found" });
    res.json(card);
  });

  app.patch("/api/deck-cards/:id", async (req, res) => {
    const card = await storage.updateDeckCard(Number(req.params.id), req.body);
    if (!card) return res.status(404).json({ error: "Card not found" });
    res.json(card);
  });

  app.delete("/api/deck-cards/:id", async (req, res) => {
    await storage.removeDeckCard(Number(req.params.id));
    res.json({ ok: true });
  });

  // ===== GAME HISTORY =====
  app.get("/api/decks/:deckId/history", async (req, res) => {
    const history = await storage.getGameHistory(Number(req.params.deckId));
    res.json(history);
  });

  app.post("/api/decks/:deckId/history", async (req, res) => {
    try {
      const entry = await storage.addGameHistory({
        ...req.body,
        deckId: Number(req.params.deckId),
      });
      res.json(entry);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete("/api/game-history/:id", async (req, res) => {
    await storage.removeGameHistory(Number(req.params.id));
    res.json({ ok: true });
  });

  // ===== WISHLIST =====
  app.get("/api/wishlist", async (_req, res) => {
    const cards = await storage.getWishlist();
    res.json(cards);
  });

  app.post("/api/wishlist", async (req, res) => {
    try {
      const card = await storage.addWishlist(req.body);
      res.json(card);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete("/api/wishlist/scryfall/:scryfallId", async (req, res) => {
    await storage.removeWishlistByScryfallId(req.params.scryfallId);
    res.json({ ok: true });
  });

  app.delete("/api/wishlist/:id", async (req, res) => {
    await storage.removeWishlist(Number(req.params.id));
    res.json({ ok: true });
  });

  // ===== RIVALS =====
  app.get("/api/rivals", async (_req, res) => {
    const allRivals = await storage.getRivals();
    res.json(allRivals);
  });

  app.post("/api/rivals", async (req, res) => {
    try {
      const rival = await storage.addRival(req.body);
      res.json(rival);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.patch("/api/rivals/:id", async (req, res) => {
    const rival = await storage.updateRival(Number(req.params.id), req.body);
    if (!rival) return res.status(404).json({ error: "Rival not found" });
    res.json(rival);
  });

  app.delete("/api/rivals/:id", async (req, res) => {
    await storage.deleteRival(Number(req.params.id));
    res.json({ ok: true });
  });

  // ===== SCRYFALL PROXY =====
  app.get("/api/scryfall/search", async (req, res) => {
    const q = req.query.q as string;
    if (!q || q.length < 2) return res.json({ data: [] });

    try {
      const response = await fetch(
        `https://api.scryfall.com/cards/search?q=${encodeURIComponent(q)}&order=name`
      );
      if (!response.ok) {
        if (response.status === 404) return res.json({ data: [] });
        throw new Error(`Scryfall error: ${response.status}`);
      }
      const data = await response.json();
      res.json(data);
    } catch (e: any) {
      res.status(502).json({ error: e.message });
    }
  });

  // ===== SCRYFALL FUZZY NAMED =====
  app.get("/api/scryfall/named", async (req, res) => {
    const fuzzy = req.query.fuzzy as string;
    if (!fuzzy) return res.status(400).json({ error: "fuzzy param required" });

    try {
      const response = await fetch(
        `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(fuzzy)}`
      );
      if (!response.ok) {
        if (response.status === 404) return res.status(404).json({ error: "Card not found" });
        throw new Error(`Scryfall error: ${response.status}`);
      }
      const data = await response.json();
      res.json(data);
    } catch (e: any) {
      res.status(502).json({ error: e.message });
    }
  });

  // ===== SCRYFALL COLLECTION (batch lookup by name) =====
  app.post("/api/scryfall/collection", async (req, res) => {
    const { identifiers } = req.body;
    if (!identifiers || !Array.isArray(identifiers)) {
      return res.status(400).json({ error: "identifiers array required" });
    }

    try {
      // Scryfall allows max 75 identifiers per request
      const allCards: any[] = [];
      const allNotFound: any[] = [];

      for (let i = 0; i < identifiers.length; i += 75) {
        const batch = identifiers.slice(i, i + 75);
        const response = await fetch("https://api.scryfall.com/cards/collection", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifiers: batch }),
        });

        if (!response.ok) {
          throw new Error(`Scryfall error: ${response.status}`);
        }

        const data = await response.json();
        allCards.push(...(data.data || []));
        allNotFound.push(...(data.not_found || []));

        // Rate-limit: 50ms between requests
        if (i + 75 < identifiers.length) {
          await new Promise((r) => setTimeout(r, 100));
        }
      }

      res.json({ data: allCards, not_found: allNotFound });
    } catch (e: any) {
      res.status(502).json({ error: e.message });
    }
  });

  // ===== BULK IMPORT TO COLLECTION =====
  app.post("/api/import/collection", async (req, res) => {
    const { cards } = req.body;
    if (!cards || !Array.isArray(cards)) {
      return res.status(400).json({ error: "cards array required" });
    }

    const results: { added: number; failed: string[] } = { added: 0, failed: [] };

    for (const card of cards) {
      try {
        await storage.addCollectionCard(card);
        results.added++;
      } catch (e: any) {
        results.failed.push(card.name || "Unknown");
      }
    }

    res.json(results);
  });

  // ===== BULK IMPORT TO DECK =====
  app.post("/api/import/deck/:deckId", async (req, res) => {
    const deckId = Number(req.params.deckId);
    const { cards } = req.body;
    if (!cards || !Array.isArray(cards)) {
      return res.status(400).json({ error: "cards array required" });
    }

    const results: { added: number; failed: string[] } = { added: 0, failed: [] };

    for (const card of cards) {
      try {
        await storage.addDeckCard({ ...card, deckId });
        results.added++;
      } catch (e: any) {
        results.failed.push(card.name || "Unknown");
      }
    }

    res.json(results);
  });

  app.get("/api/scryfall/random", async (_req, res) => {
    try {
      const response = await fetch("https://api.scryfall.com/cards/random?q=-is:funny+-is:digital");
      const data = await response.json();
      res.json(data);
    } catch (e: any) {
      res.status(502).json({ error: e.message });
    }
  });

  // ===== WISHLIST DELETE must come before generic param route =====
  // Route order fix: Express matches /api/wishlist/scryfall/:id before /api/wishlist/:id
  // Both are already registered above in correct order.

  return httpServer;
}
