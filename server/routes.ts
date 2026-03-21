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

  app.delete("/api/deck-cards/:id", async (req, res) => {
    await storage.removeDeckCard(Number(req.params.id));
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

  app.get("/api/scryfall/random", async (_req, res) => {
    try {
      const response = await fetch("https://api.scryfall.com/cards/random");
      const data = await response.json();
      res.json(data);
    } catch (e: any) {
      res.status(502).json({ error: e.message });
    }
  });

  return httpServer;
}
