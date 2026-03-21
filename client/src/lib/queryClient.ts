import { QueryClient, QueryFunction } from "@tanstack/react-query";
import * as db from "./db";

// ===== Route API calls to IndexedDB =====

/** Fake Response wrapper for compatibility with existing mutation code */
function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** Client-side API router — replaces server fetch calls */
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown
): Promise<Response> {
  const body = data as any;

  // ===== COLLECTION =====
  if (url === "/api/collection" && method === "GET") {
    return jsonResponse(await db.getCollectionCards());
  }
  if (url === "/api/collection" && method === "POST") {
    return jsonResponse(await db.addCollectionCard(body));
  }
  if (url.match(/^\/api\/collection\/(\d+)$/) && method === "DELETE") {
    const id = parseInt(url.split("/").pop()!);
    await db.removeCollectionCard(id);
    return jsonResponse({ ok: true });
  }
  if (url.match(/^\/api\/collection\/(\d+)\/quantity$/) && method === "PATCH") {
    const id = parseInt(url.split("/")[3]);
    return jsonResponse(await db.updateCollectionCardQuantity(id, body.quantity));
  }

  // ===== DECKS =====
  if (url === "/api/decks" && method === "GET") {
    return jsonResponse(await db.getDecks());
  }
  if (url === "/api/decks" && method === "POST") {
    return jsonResponse(await db.createDeck(body));
  }
  if (url.match(/^\/api\/decks\/(\d+)$/) && method === "GET") {
    const id = parseInt(url.split("/").pop()!);
    const deck = await db.getDeck(id);
    if (!deck) return jsonResponse({ error: "Not found" }, 404);
    return jsonResponse(deck);
  }
  if (url.match(/^\/api\/decks\/(\d+)$/) && method === "PATCH") {
    const id = parseInt(url.split("/")[3]);
    return jsonResponse(await db.updateDeck(id, body));
  }
  if (url.match(/^\/api\/decks\/(\d+)$/) && method === "DELETE") {
    const id = parseInt(url.split("/").pop()!);
    await db.deleteDeck(id);
    return jsonResponse({ ok: true });
  }

  // ===== DECK CARDS =====
  if (url.match(/^\/api\/decks\/(\d+)\/cards$/) && method === "GET") {
    const deckId = parseInt(url.split("/")[3]);
    return jsonResponse(await db.getDeckCards(deckId));
  }
  if (url.match(/^\/api\/decks\/(\d+)\/cards$/) && method === "POST") {
    const deckId = parseInt(url.split("/")[3]);
    return jsonResponse(await db.addDeckCard({ ...body, deckId }));
  }
  if (url.match(/^\/api\/deck-cards\/(\d+)\/quantity$/) && method === "PATCH") {
    const id = parseInt(url.split("/")[3]);
    return jsonResponse(await db.updateDeckCardQuantity(id, body.quantity));
  }
  if (url.match(/^\/api\/deck-cards\/(\d+)$/) && method === "PATCH") {
    const id = parseInt(url.split("/")[3]);
    return jsonResponse(await db.updateDeckCard(id, body));
  }
  if (url.match(/^\/api\/deck-cards\/(\d+)$/) && method === "DELETE") {
    const id = parseInt(url.split("/").pop()!);
    await db.removeDeckCard(id);
    return jsonResponse({ ok: true });
  }

  // ===== GAME HISTORY =====
  if (url.match(/^\/api\/decks\/(\d+)\/history$/) && method === "GET") {
    const deckId = parseInt(url.split("/")[3]);
    return jsonResponse(await db.getGameHistory(deckId));
  }
  if (url.match(/^\/api\/decks\/(\d+)\/history$/) && method === "POST") {
    const deckId = parseInt(url.split("/")[3]);
    return jsonResponse(await db.addGameHistoryEntry({ ...body, deckId }));
  }
  if (url.match(/^\/api\/game-history\/(\d+)$/) && method === "DELETE") {
    const id = parseInt(url.split("/").pop()!);
    await db.removeGameHistoryEntry(id);
    return jsonResponse({ ok: true });
  }

  // ===== WISHLIST =====
  if (url === "/api/wishlist" && method === "GET") {
    return jsonResponse(await db.getWishlistCards());
  }
  if (url === "/api/wishlist" && method === "POST") {
    return jsonResponse(await db.addWishlistCard(body));
  }
  if (url.match(/^\/api\/wishlist\/(\d+)$/) && method === "DELETE") {
    const id = parseInt(url.split("/").pop()!);
    await db.removeWishlistCard(id);
    return jsonResponse({ ok: true });
  }
  if (url.match(/^\/api\/wishlist\/scryfall\/(.+)$/) && method === "DELETE") {
    const scryfallId = url.split("/").pop()!;
    await db.removeWishlistByScryfallId(scryfallId);
    return jsonResponse({ ok: true });
  }

  // ===== SCRYFALL =====
  if (url.startsWith("/api/scryfall/search") && method === "GET") {
    const q = new URLSearchParams(url.split("?")[1]).get("q") || "";
    return jsonResponse(await db.scryfallSearch(q));
  }
  if (url === "/api/scryfall/random" && method === "GET") {
    return jsonResponse(await db.scryfallRandom());
  }
  if (url === "/api/scryfall/collection" && method === "POST") {
    return jsonResponse(await db.scryfallCollection(body.identifiers));
  }

  // ===== IMPORT =====
  if (url === "/api/import/collection" && method === "POST") {
    return jsonResponse(await db.bulkImportCollection(body.cards));
  }
  if (url.match(/^\/api\/import\/deck\/(\d+)$/) && method === "POST") {
    const deckId = parseInt(url.split("/").pop()!);
    return jsonResponse(await db.bulkImportDeck(deckId, body.cards));
  }

  throw new Error(`Unhandled API route: ${method} ${url}`);
}

// ===== Query client setup =====

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: _unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey.join("/");
    const res = await apiRequest("GET", url);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
