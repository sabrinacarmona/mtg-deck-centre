import { useState, useEffect, useCallback } from "react";
import { useQuery, useQueries, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import CardGrid from "@/components/CardGrid";
import CardDetailDialog from "@/components/CardDetailDialog";
import { Search, Heart, Sparkles, BookOpen, Layers3, Crown, TrendingUp, DollarSign, Swords } from "lucide-react";
import { Link } from "wouter";
import type { CollectionCard, DeckCard } from "@shared/schema";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { ScryfallCard, Deck } from "@shared/schema";

interface WishlistCard {
  id: number;
  scryfallId: string;
  name: string;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedCard, setSelectedCard] = useState<ScryfallCard | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Debounce search
  useEffect(() => {
    if (query.length < 2) {
      setDebouncedQuery("");
      return;
    }
    const timer = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(timer);
  }, [query]);

  const { data, isLoading, error } = useQuery<{ data: ScryfallCard[] }>({
    queryKey: ["/api/scryfall/search", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery) return { data: [] };
      const res = await apiRequest(
        "GET",
        `/api/scryfall/search?q=${encodeURIComponent(debouncedQuery)}`
      );
      return res.json();
    },
    enabled: debouncedQuery.length >= 2,
  });

  const { data: decks = [] } = useQuery<Deck[]>({
    queryKey: ["/api/decks"],
  });

  const { data: wishlistCards = [] } = useQuery<WishlistCard[]>({
    queryKey: ["/api/wishlist"],
  });

  const { data: collectionCards = [] } = useQuery<CollectionCard[]>({
    queryKey: ["/api/collection"],
  });

  const wishlistIds = new Set(wishlistCards.map((w) => w.scryfallId));

  const cards = data?.data || [];

  const addToCollection = useMutation({
    mutationFn: async (card: ScryfallCard) => {
      const res = await apiRequest("POST", "/api/collection", {
        scryfallId: card.id,
        name: card.name,
        typeLine: card.type_line,
        manaCost: card.mana_cost || null,
        cmc: card.cmc ? Math.floor(card.cmc) : 0,
        imageSmall: card.image_uris?.small || card.card_faces?.[0]?.image_uris?.small || null,
        imageNormal: card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal || null,
        priceUsd: card.prices?.usd || null,
        colors: JSON.stringify(card.colors || []),
        colorIdentity: JSON.stringify(card.color_identity || []),
        rarity: card.rarity || null,
        setName: card.set_name || null,
        setCode: card.set || null,
        oracleText: card.oracle_text || null,
        power: card.power || null,
        toughness: card.toughness || null,
        quantity: 1,
      });
      return res.json();
    },
    onSuccess: (_data, card) => {
      queryClient.invalidateQueries({ queryKey: ["/api/collection"] });
      setAddedIds((prev) => new Set(prev).add(card.id));
      toast({ title: `${card.name} added to collection` });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const addToDeck = useMutation({
    mutationFn: async ({ card, deckId }: { card: ScryfallCard; deckId: number }) => {
      const res = await apiRequest("POST", `/api/decks/${deckId}/cards`, {
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
        priceUsd: card.prices?.usd || null,
        legalities: card.legalities ? JSON.stringify(card.legalities) : null,
        quantity: 1,
        board: "main",
      });
      return res.json();
    },
    onSuccess: (_data, { card, deckId }) => {
      const deckName = decks.find((d) => d.id === deckId)?.name || "deck";
      queryClient.invalidateQueries({ queryKey: ["/api/decks", deckId, "cards"] });
      toast({ title: `${card.name} added to ${deckName}` });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const toggleWishlist = useMutation({
    mutationFn: async (card: ScryfallCard) => {
      if (wishlistIds.has(card.id)) {
        await apiRequest("DELETE", `/api/wishlist/scryfall/${card.id}`);
      } else {
        await apiRequest("POST", "/api/wishlist", {
          scryfallId: card.id,
          name: card.name,
          imageSmall: card.image_uris?.small || card.card_faces?.[0]?.image_uris?.small || null,
          imageNormal: card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal || null,
          priceUsd: card.prices?.usd || null,
          typeLine: card.type_line,
          addedDate: new Date().toISOString().split("T")[0],
        });
      }
    },
    onSuccess: (_data, card) => {
      queryClient.invalidateQueries({ queryKey: ["/api/wishlist"] });
      toast({ title: wishlistIds.has(card.id) ? `${card.name} removed from wishlist` : `${card.name} added to wishlist` });
    },
  });

  const handleCardClick = useCallback((card: ScryfallCard) => {
    setSelectedCard(card);
    setDetailOpen(true);
  }, []);

  return (
    <div className="space-y-4" data-testid="search-page">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search 27,000+ Magic cards..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 h-11 text-sm bg-card border-border"
          data-testid="search-input"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">
          Search failed. Try again.
        </div>
      )}

      {/* Results */}
      {cards.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {cards.map((card) => (
            <SearchCardItem
              key={card.id}
              card={card}
              decks={decks}
              wasAdded={addedIds.has(card.id)}
              isWishlisted={wishlistIds.has(card.id)}
              onAddToCollection={() => addToCollection.mutate(card)}
              onAddToDeck={(deckId) => addToDeck.mutate({ card, deckId })}
              onToggleWishlist={() => toggleWishlist.mutate(card)}
              onCardClick={() => handleCardClick(card)}
            />
          ))}
        </div>
      )}

      {isLoading && debouncedQuery.length >= 2 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl bg-muted animate-pulse"
              style={{ aspectRatio: "488/680" }}
            />
          ))}
        </div>
      )}

      {/* Empty states */}
      {!isLoading && cards.length === 0 && debouncedQuery.length >= 2 && (
        <div className="text-center py-12">
          <Search className="w-8 h-8 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            No cards found for "{debouncedQuery}"
          </p>
        </div>
      )}

      {!query && <HomeDashboard decks={decks} />}

      {/* Card detail dialog */}
      <CardDetailDialog
        card={selectedCard}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onAddToCollection={(card) => addToCollection.mutate(card)}
      />
    </div>
  );
}

function SearchCardItem({
  card,
  decks,
  wasAdded,
  isWishlisted,
  onAddToCollection,
  onAddToDeck,
  onToggleWishlist,
  onCardClick,
}: {
  card: ScryfallCard;
  decks: Deck[];
  wasAdded: boolean;
  isWishlisted: boolean;
  onAddToCollection: () => void;
  onAddToDeck: (deckId: number) => void;
  onToggleWishlist: () => void;
  onCardClick: () => void;
}) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const image = card.image_uris?.small || card.card_faces?.[0]?.image_uris?.small || null;

  return (
    <div
      className="group relative rounded-xl overflow-hidden card-hover cursor-pointer"
      onClick={onCardClick}
    >
      <div className="relative" style={{ aspectRatio: "488/680" }}>
        {!imgLoaded && (
          <div className="absolute inset-0 bg-muted animate-pulse rounded-xl" />
        )}
        {image ? (
          <img
            src={image}
            alt={card.name}
            className={`w-full h-full object-cover rounded-xl transition-opacity duration-300 ${
              imgLoaded ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() => setImgLoaded(true)}
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 bg-muted flex items-center justify-center rounded-xl">
            <span className="text-xs text-muted-foreground text-center px-2">
              {card.name}
            </span>
          </div>
        )}
      </div>

      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl flex flex-col justify-end p-2 gap-1.5">
        <div className="text-white text-xs font-semibold leading-tight line-clamp-2">
          {card.name}
        </div>
        {card.prices?.usd && (
          <div className="text-amber-400 text-xs font-medium">
            ${card.prices.usd}
          </div>
        )}
        <div className="flex gap-1.5 mt-1">
          <Button
            size="sm"
            variant={wasAdded ? "secondary" : "default"}
            className="h-7 text-xs flex-1"
            onClick={(e) => {
              e.stopPropagation();
              onAddToCollection();
            }}
          >
            {wasAdded ? "Added" : "+ Collection"}
          </Button>
          {decks.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-7 text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  + Deck
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-1" onClick={(e) => e.stopPropagation()}>
                {decks.map((deck) => (
                  <button
                    key={deck.id}
                    className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-muted transition-colors"
                    onClick={() => onAddToDeck(deck.id)}
                  >
                    {deck.name}
                    <span className="text-muted-foreground ml-1 capitalize">({deck.format})</span>
                  </button>
                ))}
              </PopoverContent>
            </Popover>
          )}
          <Button
            size="sm"
            variant="ghost"
            className={`h-7 w-7 p-0 ${isWishlisted ? "text-primary" : "text-white/60"}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleWishlist();
            }}
          >
            <Heart className={`w-3.5 h-3.5 ${isWishlisted ? "fill-current" : ""}`} />
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Home dashboard shown when search is empty */
function HomeDashboard({ decks }: { decks: Deck[] }) {
  const { data: collectionCards = [] } = useQuery<any[]>({
    queryKey: ["/api/collection"],
  });

  // Fetch cards for each deck to get art + stats
  const deckCardsResults = useQueries({
    queries: decks.map((deck) => ({
      queryKey: ["/api/decks", deck.id, "cards"],
      queryFn: async () => {
        const res = await apiRequest("GET", `/api/decks/${deck.id}/cards`);
        return res.json() as Promise<DeckCard[]>;
      },
      enabled: !!deck.id,
    })),
  });

  const totalCards = collectionCards.reduce((s: number, c: any) => s + (c.quantity || 1), 0);
  const uniqueCards = collectionCards.length;
  const totalValue = collectionCards.reduce((s: number, c: any) => {
    return s + parseFloat(c.priceUsd || "0") * (c.quantity || 1);
  }, 0);

  return (
    <div className="space-y-6 pt-2">
      {/* Welcome + stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card-frame rounded-xl p-4 text-center">
          <BookOpen className="w-5 h-5 mx-auto mb-1.5 text-primary/70" />
          <div className="text-2xl font-bold">{totalCards}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Total Cards</div>
        </div>
        <div className="card-frame rounded-xl p-4 text-center">
          <Layers3 className="w-5 h-5 mx-auto mb-1.5 text-primary/70" />
          <div className="text-2xl font-bold">{decks.length}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Decks</div>
        </div>
        <div className="card-frame rounded-xl p-4 text-center">
          <DollarSign className="w-5 h-5 mx-auto mb-1.5 text-primary/70" />
          <div className="text-2xl font-bold text-primary">${totalValue.toFixed(0)}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Est. Value</div>
        </div>
      </div>

      {/* My Decks */}
      {decks.filter((d: any) => !d.name.startsWith("Will's")).length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground/80 uppercase tracking-wide">My Decks</h2>
            </div>
            <Link href="/decks">
              <button className="text-xs text-primary hover:underline">View All</button>
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {decks.filter((d: any) => !d.name.startsWith("Will's")).slice(0, 4).map((deck: any) => {
              const deckIdx = decks.findIndex((d: any) => d.id === deck.id);
              const cards = (deckCardsResults[deckIdx]?.data || []) as DeckCard[];
              const artCard = cards.find((c: any) => c.isCommander) || cards[0];
              const artUrl = artCard?.imageNormal || artCard?.imageSmall;
              const cardCount = cards.reduce((s: number, c: any) => s + (c.quantity || 1), 0);
              return (
                <Link key={deck.id} href={`/decks/${deck.id}`}>
                  <div
                    className="relative overflow-hidden rounded-xl cursor-pointer group transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-black/30"
                    style={{ aspectRatio: "3/4" }}
                  >
                    {artUrl ? (
                      <img src={artUrl} alt={deck.name} className="absolute inset-0 w-full h-full object-cover object-top" />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
                      <h3 className="font-bold text-sm text-white drop-shadow-lg leading-tight">{deck.name}</h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[9px] bg-white/15 backdrop-blur-sm text-white/80 px-1.5 py-0.5 rounded-full capitalize">{deck.format}</span>
                        <span className="text-[9px] text-white/40">{cardCount} cards</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Will's Decks */}
      {decks.filter((d: any) => d.name.startsWith("Will's")).length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Swords className="w-4 h-4 text-red-400" />
            <h2 className="text-sm font-semibold text-red-400/80 uppercase tracking-wide">Will's Decks</h2>
            <span className="text-[10px] text-muted-foreground ml-auto">Know thy enemy</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {decks.filter((d: any) => d.name.startsWith("Will's")).map((deck: any) => {
              const deckIdx = decks.findIndex((d: any) => d.id === deck.id);
              const cards = (deckCardsResults[deckIdx]?.data || []) as DeckCard[];
              const artCard = cards.find((c: any) => c.isCommander) || cards[0];
              const artUrl = artCard?.imageNormal || artCard?.imageSmall;
              const cardCount = cards.reduce((s: number, c: any) => s + (c.quantity || 1), 0);
              const displayName = deck.name.replace("Will's ", "");
              return (
                <Link key={deck.id} href={`/decks/${deck.id}`}>
                  <div
                    className="relative overflow-hidden rounded-xl cursor-pointer group transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-red-900/20 ring-1 ring-red-500/20"
                    style={{ aspectRatio: "3/4" }}
                  >
                    {artUrl ? (
                      <img src={artUrl} alt={deck.name} className="absolute inset-0 w-full h-full object-cover object-top saturate-[0.85]" />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-red-950/90 via-black/20 to-transparent" />
                    <div className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-red-500/80 backdrop-blur-sm text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                      <Swords className="w-2.5 h-2.5" />
                      Rival
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
                      <h3 className="font-bold text-sm text-white drop-shadow-lg leading-tight">{displayName}</h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[9px] bg-red-500/20 backdrop-blur-sm text-red-200 px-1.5 py-0.5 rounded-full capitalize">{deck.format}</span>
                        <span className="text-[9px] text-white/40">{cardCount} cards</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="text-center pt-2">
        <p className="text-xs text-muted-foreground mb-3">
          Search 27,000+ cards above, or explore your collection
        </p>
        <div className="flex items-center justify-center gap-2">
          <Link href="/collection">
            <Button variant="secondary" size="sm" className="gap-1.5 text-xs">
              <BookOpen className="w-3.5 h-3.5" />
              Collection
            </Button>
          </Link>
          <Link href="/scanner">
            <Button variant="secondary" size="sm" className="gap-1.5 text-xs">
              <Search className="w-3.5 h-3.5" />
              Scan Card
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
