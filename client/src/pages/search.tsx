import { useState, useEffect, useCallback } from "react";
import { useQuery, useQueries, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import CardDetailDialog from "@/components/CardDetailDialog";
import {
  Search,
  Heart,
  BookOpen,
  Layers3,
  Crown,
  DollarSign,
  Swords,
  Sparkles,
  TrendingUp,
  Gamepad2,
  GraduationCap,
  Hand,
  BarChart3,
  ExternalLink,
  Filter,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Link } from "wouter";
import { ManaCost, OracleText } from "@/components/ManaSymbols";
import type { CollectionCard, DeckCard } from "@shared/schema";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import type { ScryfallCard, Deck } from "@shared/schema";

interface WishlistCard {
  id: number;
  scryfallId: string;
  name: string;
}

// --- Advanced filter types ---
interface SearchFilters {
  colors: string[];
  cmcOp: "" | "=" | ">=" | "<=";
  cmcValue: string;
  type: string;
  rarity: string;
  setCode: string;
}

const defaultFilters: SearchFilters = {
  colors: [],
  cmcOp: "",
  cmcValue: "",
  type: "",
  rarity: "",
  setCode: "",
};

const manaColors = [
  { code: "W", label: "White" },
  { code: "U", label: "Blue" },
  { code: "B", label: "Black" },
  { code: "R", label: "Red" },
  { code: "G", label: "Green" },
  { code: "C", label: "Colorless" },
];

const cardTypes = [
  "Creature", "Instant", "Sorcery", "Enchantment", "Artifact", "Land", "Planeswalker",
];

const rarities = [
  { value: "common", label: "Common", color: "bg-zinc-600 text-zinc-100" },
  { value: "uncommon", label: "Uncommon", color: "bg-zinc-400 text-zinc-900" },
  { value: "rare", label: "Rare", color: "bg-yellow-500 text-yellow-950" },
  { value: "mythic", label: "Mythic", color: "bg-orange-500 text-orange-950" },
];

function buildScryfallQuery(text: string, filters: SearchFilters): string {
  const parts: string[] = [];
  if (text.trim()) parts.push(text.trim());
  if (filters.colors.length > 0) {
    if (filters.colors.includes("C")) {
      parts.push("c:colorless");
    } else {
      parts.push(`c:${filters.colors.join("").toLowerCase()}`);
    }
  }
  if (filters.cmcOp && filters.cmcValue !== "") {
    parts.push(`cmc${filters.cmcOp}${filters.cmcValue}`);
  }
  if (filters.type) {
    parts.push(`t:${filters.type.toLowerCase()}`);
  }
  if (filters.rarity) {
    parts.push(`r:${filters.rarity}`);
  }
  if (filters.setCode.trim()) {
    parts.push(`s:${filters.setCode.trim().toLowerCase()}`);
  }
  return parts.join(" ");
}

function countActiveFilters(filters: SearchFilters): number {
  let count = 0;
  if (filters.colors.length > 0) count++;
  if (filters.cmcOp && filters.cmcValue !== "") count++;
  if (filters.type) count++;
  if (filters.rarity) count++;
  if (filters.setCode.trim()) count++;
  return count;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedCard, setSelectedCard] = useState<ScryfallCard | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters);
  const { toast } = useToast();

  const activeFilterCount = countActiveFilters(filters);

  // Build full query from text + filters
  const fullQuery = buildScryfallQuery(query, filters);

  // Debounce search
  useEffect(() => {
    if (fullQuery.length < 2) {
      setDebouncedQuery("");
      return;
    }
    const timer = setTimeout(() => setDebouncedQuery(fullQuery), 350);
    return () => clearTimeout(timer);
  }, [fullQuery]);

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

  // Only show Sabrina's decks in "Add to Deck" dropdowns (exclude Will's rival decks)
  const myDecksForAdd = decks.filter((d) => !d.name.startsWith("Will's"));

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
    <div className="space-y-6" data-testid="search-page">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search 27,000+ Magic cards..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 h-12 text-sm bg-card/50 border-border/50 rounded-xl focus:border-primary/40 focus:ring-primary/20"
          data-testid="search-input"
        />
      </div>

      {/* Filter toggle */}
      <div>
        <Button
          variant="secondary"
          size="sm"
          className="gap-1.5 rounded-lg"
          onClick={() => setFiltersOpen(!filtersOpen)}
        >
          <Filter className="w-3.5 h-3.5" />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
          {filtersOpen ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
        </Button>
      </div>

      {/* Collapsible filter panel */}
      {filtersOpen && (
        <div className="space-y-3 p-4 rounded-xl bg-card/50 border border-border/50 animate-fade-in-up">
          {/* Color filter */}
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">Color</div>
            <div className="flex flex-wrap gap-1.5">
              {manaColors.map((c) => {
                const isC = c.code === "C";
                const selected = filters.colors.includes(c.code);
                return (
                  <button
                    key={c.code}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      selected
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => {
                      setFilters((f) => {
                        if (isC) {
                          return { ...f, colors: selected ? [] : ["C"] };
                        }
                        const without = f.colors.filter((x) => x !== c.code && x !== "C");
                        return {
                          ...f,
                          colors: selected ? without : [...without, c.code],
                        };
                      });
                    }}
                  >
                    {!isC && (
                      <img
                        src={`https://svgs.scryfall.io/card-symbols/${c.code}.svg`}
                        alt={c.label}
                        className="w-4 h-4"
                      />
                    )}
                    {isC ? "Colorless" : c.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* CMC filter */}
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">CMC</div>
            <div className="flex items-center gap-2 flex-wrap">
              <select
                className="h-8 px-2 rounded-lg bg-muted text-sm border-0 focus:ring-1 focus:ring-primary"
                value={filters.cmcOp}
                onChange={(e) => setFilters((f) => ({ ...f, cmcOp: e.target.value as SearchFilters["cmcOp"] }))}
              >
                <option value="">—</option>
                <option value="=">=</option>
                <option value=">=">&gt;=</option>
                <option value="<=">&lt;=</option>
              </select>
              <div className="flex gap-1">
                {["0", "1", "2", "3", "4", "5", "6", "7+"].map((v) => {
                  const val = v.replace("+", "");
                  const selected = filters.cmcValue === val && filters.cmcOp !== "";
                  return (
                    <button
                      key={v}
                      className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                        selected
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                      onClick={() => {
                        setFilters((f) => ({
                          ...f,
                          cmcValue: f.cmcValue === val ? "" : val,
                          cmcOp: f.cmcOp || "=",
                        }));
                      }}
                    >
                      {v}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Type filter */}
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">Type</div>
            <div className="flex flex-wrap gap-1.5">
              {cardTypes.map((t) => (
                <button
                  key={t}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filters.type === t
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setFilters((f) => ({ ...f, type: f.type === t ? "" : t }))}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Rarity filter */}
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">Rarity</div>
            <div className="flex flex-wrap gap-1.5">
              {rarities.map((r) => (
                <button
                  key={r.value}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filters.rarity === r.value
                      ? r.color
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setFilters((f) => ({ ...f, rarity: f.rarity === r.value ? "" : r.value }))}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Set code filter */}
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5">Set Code</div>
            <Input
              placeholder="e.g. mkm, one, dmu"
              value={filters.setCode}
              onChange={(e) => setFilters((f) => ({ ...f, setCode: e.target.value }))}
              className="h-8 w-40 text-xs bg-muted border-0"
            />
          </div>

          {/* Clear filters */}
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={() => setFilters(defaultFilters)}
            >
              Clear all filters
            </Button>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 rounded-xl p-4">
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
              decks={myDecksForAdd}
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
              className="rounded-xl bg-muted/50 animate-pulse"
              style={{ aspectRatio: "488/680" }}
            />
          ))}
        </div>
      )}

      {/* Empty states */}
      {!isLoading && cards.length === 0 && debouncedQuery.length >= 2 && (
        <div className="text-center py-16">
          <Search className="w-10 h-10 mx-auto mb-3 text-muted-foreground/20" />
          <p className="text-sm text-muted-foreground">
            No cards found for "{debouncedQuery}"
          </p>
        </div>
      )}

      {!fullQuery && <HomeDashboard decks={decks} />}

      {/* Card detail dialog */}
      <CardDetailDialog
        card={selectedCard}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onAddToCollection={(card) => addToCollection.mutate(card)}
        onToggleWishlist={(card) => toggleWishlist.mutate(card)}
        isWishlisted={selectedCard ? wishlistIds.has(selectedCard.id) : false}
        decks={myDecksForAdd}
        onAddToDeck={(card, deckId) => addToDeck.mutate({ card, deckId })}
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
          <div className="absolute inset-0 bg-muted/50 animate-pulse rounded-xl" />
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

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl flex flex-col justify-end p-2.5 gap-1.5">
        <div className="text-white text-xs font-semibold leading-tight line-clamp-2">
          {card.name}
        </div>
        {card.prices?.usd && (
          <div className="text-primary text-xs font-medium">
            ${card.prices.usd}
          </div>
        )}
        <div className="flex gap-1.5 mt-1">
          <Button
            size="sm"
            variant={wasAdded ? "secondary" : "default"}
            className="h-7 text-xs flex-1 rounded-lg"
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
                  className="h-7 text-xs rounded-lg"
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
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className={`h-7 w-7 p-0 ${isWishlisted ? "text-primary" : "text-white/60"}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleWishlist();
                }}
                aria-label={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
              >
                <Heart className={`w-3.5 h-3.5 ${isWishlisted ? "fill-current" : ""}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}</TooltipContent>
          </Tooltip>
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

  // Card of the Day
  const { data: randomCard, isLoading: randomLoading } = useQuery<ScryfallCard>({
    queryKey: ["/api/scryfall/random", new Date().toDateString()],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/scryfall/random");
      return res.json();
    },
    staleTime: 1000 * 60 * 60, // 1 hour
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

  const myDecks = decks.filter((d: any) => !d.name.startsWith("Will's"));
  const willsDecks = decks.filter((d: any) => d.name.startsWith("Will's"));

  // Use collection cards for stats (same source as collection page)
  const totalCards = collectionCards.reduce((s: number, c: any) => s + (c.quantity || 1), 0);
  const totalValue = collectionCards.reduce((s: number, c: any) => {
    return s + parseFloat(c.priceUsd || "0") * (c.quantity || 1);
  }, 0);

  return (
    <div className="space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3 stagger-children">
        <StatCard icon={Crown} label="Decks" value={myDecks.length.toString()} />
        <StatCard icon={BookOpen} label="Total Cards" value={totalCards.toString()} />
        <StatCard icon={Layers3} label="Unique" value={collectionCards.length.toString()} />
        <StatCard icon={DollarSign} label="Est. Value" value={`$${totalValue.toFixed(2)}`} accent />
      </div>

      {/* Card of the Day */}
      {randomCard && (
        <div className="animate-fade-in-up">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground/80 uppercase tracking-wide">
              Card of the Day
            </h2>
          </div>
          <div className="glass-panel p-4 flex gap-4 items-start">
            <div className="w-28 flex-shrink-0">
              {randomCard.image_uris?.normal ? (
                <img
                  src={randomCard.image_uris.normal}
                  alt={randomCard.name}
                  className="w-full rounded-lg shadow-lg shadow-black/30"
                />
              ) : randomCard.card_faces?.[0]?.image_uris?.normal ? (
                <img
                  src={randomCard.card_faces[0].image_uris.normal}
                  alt={randomCard.name}
                  className="w-full rounded-lg shadow-lg shadow-black/30"
                />
              ) : (
                <div className="w-full aspect-[488/680] bg-muted rounded-lg flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">{randomCard.name}</span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-base text-foreground leading-tight">
                  {randomCard.name}
                </h3>
                {randomCard.mana_cost && (
                  <ManaCost cost={randomCard.mana_cost} size="sm" />
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{randomCard.type_line}</p>
              {randomCard.oracle_text && (
                <div className="text-xs text-foreground/70 mt-2 line-clamp-3 leading-relaxed">
                  <OracleText text={randomCard.oracle_text} size="sm" />
                </div>
              )}
              <div className="flex items-center gap-3 mt-3">
                {randomCard.prices?.usd && (
                  <span className="text-xs font-medium text-primary">${randomCard.prices.usd}</span>
                )}
                {randomCard.rarity && (
                  <span className={`text-xs capitalize px-2 py-0.5 rounded-full ${
                    randomCard.rarity === "mythic" ? "bg-orange-500/15 text-orange-400" :
                    randomCard.rarity === "rare" ? "bg-yellow-500/15 text-yellow-400" :
                    randomCard.rarity === "uncommon" ? "bg-zinc-400/15 text-zinc-300" :
                    "bg-zinc-600/15 text-zinc-400"
                  }`}>
                    {randomCard.rarity}
                  </span>
                )}
                {randomCard.set_name && (
                  <span className="text-[10px] text-muted-foreground truncate">{randomCard.set_name}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* My Decks */}
      {myDecks.length > 0 && (
        <div className="animate-fade-in-up" style={{ animationDelay: "100ms" }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground/80 uppercase tracking-wide">My Decks</h2>
            </div>
            <Link href="/decks">
              <button className="text-xs text-primary hover:underline">View All</button>
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 stagger-children">
            {myDecks.slice(0, 4).map((deck: any) => {
              const deckIdx = decks.findIndex((d: any) => d.id === deck.id);
              const cards = (deckCardsResults[deckIdx]?.data || []) as DeckCard[];
              const artCard = cards.find((c: any) => c.isCommander) || cards[0];
              const artUrl = artCard?.imageNormal || artCard?.imageSmall;
              const cardCount = cards.reduce((s: number, c: any) => s + (c.quantity || 1), 0);
              return (
                <Link key={deck.id} href={`/decks/${deck.id}`}>
                  <div
                    className="relative overflow-hidden rounded-xl cursor-pointer card-hover"
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
      {willsDecks.length > 0 && (
        <div className="animate-fade-in-up" style={{ animationDelay: "200ms" }}>
          <div className="flex items-center gap-2 mb-3">
            <Swords className="w-4 h-4 text-red-400" />
            <h2 className="text-sm font-semibold text-red-400/80 uppercase tracking-wide">Will's Decks</h2>
            <span className="text-[10px] text-muted-foreground ml-auto">Know thy enemy</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {willsDecks.map((deck: any) => {
              const deckIdx = decks.findIndex((d: any) => d.id === deck.id);
              const cards = (deckCardsResults[deckIdx]?.data || []) as DeckCard[];
              const artCard = cards.find((c: any) => c.isCommander) || cards[0];
              const artUrl = artCard?.imageNormal || artCard?.imageSmall;
              const cardCount = cards.reduce((s: number, c: any) => s + (c.quantity || 1), 0);
              const displayName = deck.name.replace("Will's ", "");
              return (
                <Link key={deck.id} href={`/decks/${deck.id}`}>
                  <div
                    className="relative overflow-hidden rounded-xl cursor-pointer card-hover ring-1 ring-red-500/15"
                    style={{ aspectRatio: "3/4" }}
                  >
                    {artUrl ? (
                      <img src={artUrl} alt={deck.name} className="absolute inset-0 w-full h-full object-cover object-top saturate-[0.8]" />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-red-950/90 via-black/20 to-transparent" />
                    <div className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-red-500/70 backdrop-blur-sm text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
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

      {/* Quick Links */}
      <div className="animate-fade-in-up" style={{ animationDelay: "300ms" }}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <QuickLink href="/game-night" icon={Gamepad2} label="Game Night" desc="Track your matches" />
          <QuickLink href="/goldfish" icon={Hand} label="Goldfish" desc="Test your hands" />
          <QuickLink href="/learn" icon={GraduationCap} label="Learn MTG" desc="Rules & strategy" />
          <QuickLink href="/rivals" icon={Swords} label="Rivals" desc="Counter strategies" />
          <QuickLink href="/matchups" icon={BarChart3} label="Matchups" desc="Win/loss history" />
          <QuickLink href="/wishlist" icon={Heart} label="Wishlist" desc="Cards to get" />
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string; accent?: boolean }) {
  return (
    <div className="card-frame rounded-xl p-4 text-center">
      <Icon className="w-5 h-5 mx-auto mb-1.5 text-primary/60" />
      <div className={`text-2xl font-display font-bold animate-count-up ${accent ? "text-primary" : ""}`}>
        {value}
      </div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">{label}</div>
    </div>
  );
}

function QuickLink({ href, icon: Icon, label, desc }: { href: string; icon: any; label: string; desc: string }) {
  return (
    <Link href={href}>
      <div className="flex items-center gap-3 p-3 rounded-xl bg-card/50 border border-border/30 hover:border-primary/20 hover:bg-card/80 transition-all cursor-pointer group">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/15 transition-colors">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium text-foreground leading-tight">{label}</div>
          <div className="text-[10px] text-muted-foreground">{desc}</div>
        </div>
      </div>
    </Link>
  );
}
