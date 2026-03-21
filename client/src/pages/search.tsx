import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import CardGrid from "@/components/CardGrid";
import CardDetailDialog from "@/components/CardDetailDialog";
import { Search, Heart } from "lucide-react";
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
          <div className="text-3xl mb-3">🔮</div>
          <p className="text-sm text-muted-foreground">
            No cards found for "{debouncedQuery}"
          </p>
        </div>
      )}

      {!query && (
        <div className="text-center py-16">
          <div className="text-4xl mb-4">⚡</div>
          <h2 className="text-lg font-semibold mb-1">Search for Cards</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Type a card name, type, or keyword to search the entire Magic: The
            Gathering catalog via Scryfall.
          </p>
        </div>
      )}

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
          <div className="text-emerald-400 text-xs font-medium">
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
            className={`h-7 w-7 p-0 ${isWishlisted ? "text-red-400" : "text-white/60"}`}
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
