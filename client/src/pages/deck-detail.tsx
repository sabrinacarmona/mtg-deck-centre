import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useRoute, Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import ManaCurve from "@/components/ManaCurve";
import ColorDistribution from "@/components/ColorDistribution";
import CardGrid from "@/components/CardGrid";
import {
  ArrowLeft,
  Search,
  Minus,
  Plus,
  Trash2,
  Import,
  ChevronDown,
  ChevronUp,
  BarChart3,
  X,
} from "lucide-react";
import ImportDialog from "@/components/ImportDialog";
import type { Deck, DeckCard, ScryfallCard } from "@shared/schema";

export default function DeckDetailPage() {
  const [, params] = useRoute("/decks/:id");
  const deckId = Number(params?.id);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [board, setBoard] = useState<"main" | "side">("main");
  const [importOpen, setImportOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [zoomedCard, setZoomedCard] = useState<DeckCard | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (searchQuery.length < 2) {
      setDebouncedQuery("");
      return;
    }
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: deck } = useQuery<Deck>({
    queryKey: ["/api/decks", deckId],
    enabled: !!deckId,
  });

  const { data: deckCards = [] } = useQuery<DeckCard[]>({
    queryKey: ["/api/decks", deckId, "cards"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/decks/${deckId}/cards`);
      return res.json();
    },
    enabled: !!deckId,
  });

  const { data: searchData, isLoading: searchLoading } = useQuery<{
    data: ScryfallCard[];
  }>({
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

  const searchCards = searchData?.data || [];

  const addCard = useMutation({
    mutationFn: async (card: ScryfallCard) => {
      const res = await apiRequest("POST", `/api/decks/${deckId}/cards`, {
        scryfallId: card.id,
        name: card.name,
        typeLine: card.type_line,
        manaCost: card.mana_cost || null,
        cmc: card.cmc ? Math.floor(card.cmc) : 0,
        imageSmall:
          card.image_uris?.small ||
          card.card_faces?.[0]?.image_uris?.small ||
          null,
        imageNormal:
          card.image_uris?.normal ||
          card.card_faces?.[0]?.image_uris?.normal ||
          null,
        colors: JSON.stringify(card.colors || []),
        colorIdentity: JSON.stringify(card.color_identity || []),
        rarity: card.rarity || null,
        oracleText: card.oracle_text || null,
        power: card.power || null,
        toughness: card.toughness || null,
        quantity: 1,
        board,
      });
      return res.json();
    },
    onSuccess: (_data, card) => {
      queryClient.invalidateQueries({
        queryKey: ["/api/decks", deckId, "cards"],
      });
      toast({
        title: `${card.name} added to ${board === "main" ? "mainboard" : "sideboard"}`,
      });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateQuantity = useMutation({
    mutationFn: async ({ id, quantity }: { id: number; quantity: number }) => {
      if (quantity <= 0) {
        await apiRequest("DELETE", `/api/deck-cards/${id}`);
        return null;
      }
      const res = await apiRequest("PATCH", `/api/deck-cards/${id}/quantity`, {
        quantity,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/decks", deckId, "cards"],
      });
    },
  });

  const removeCard = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/deck-cards/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/decks", deckId, "cards"],
      });
    },
  });

  const mainCards = deckCards.filter((c) => c.board === "main");
  const sideCards = deckCards.filter((c) => c.board === "side");
  const activeCards = board === "main" ? mainCards : sideCards;
  const totalMain = mainCards.reduce((s, c) => s + (c.quantity || 1), 0);
  const totalSide = sideCards.reduce((s, c) => s + (c.quantity || 1), 0);
  const avgCmc =
    mainCards.length > 0
      ? (
          mainCards.reduce((s, c) => s + (c.cmc || 0) * (c.quantity || 1), 0) /
          totalMain
        ).toFixed(1)
      : "0.0";

  if (!deck) {
    return (
      <div className="text-center py-16">
        <div className="text-2xl mb-2">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="deck-detail-page">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/decks">
          <Button variant="ghost" size="icon" className="w-8 h-8" data-testid="back-btn">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-bold">{deck.name}</h1>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="text-[10px] capitalize">
              {deck.format}
            </Badge>
            <span>{totalMain} main</span>
            <span>{totalSide} side</span>
            <span>Avg CMC: {avgCmc}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="gap-1.5"
            onClick={() => setStatsOpen(!statsOpen)}
            data-testid="toggle-stats-btn"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Stats
            {statsOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="gap-1.5"
            onClick={() => setImportOpen(true)}
            data-testid="import-deck-btn"
          >
            <Import className="w-3.5 h-3.5" />
            Import
          </Button>
        </div>
      </div>

      {/* Collapsible stats */}
      {statsOpen && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-card border border-card-border rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold">Mana Curve</h3>
            <ManaCurve cards={mainCards} />
          </div>
          <div className="bg-card border border-card-border rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold">Colors</h3>
            <ColorDistribution cards={mainCards} />
          </div>
        </div>
      )}

      {/* Board tabs */}
      <div className="flex gap-2 items-center">
        <button
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            board === "main"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          }`}
          onClick={() => setBoard("main")}
          data-testid="board-main"
        >
          Mainboard ({totalMain})
        </button>
        <button
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            board === "side"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          }`}
          onClick={() => setBoard("side")}
          data-testid="board-side"
        >
          Sideboard ({totalSide})
        </button>
      </div>

      {/* Main layout: Left = deck cards visual, Right = search/add */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* LEFT: Visual deck card grid */}
        <div className="lg:col-span-3">
          {activeCards.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              <div className="text-3xl mb-3">🃏</div>
              No cards in {board === "main" ? "mainboard" : "sideboard"} yet.
              <br />
              Use the search panel to add cards.
            </div>
          ) : (
            <DeckVisualGrid
              cards={activeCards}
              onUpdateQuantity={(id, qty) => updateQuantity.mutate({ id, quantity: qty })}
              onRemove={(id) => removeCard.mutate(id)}
              onCardClick={(card) => setZoomedCard(card)}
            />
          )}
        </div>

        {/* RIGHT: Search + add panel */}
        <div className="lg:col-span-2 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search cards to add..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 bg-card border-border"
              data-testid="deck-search-input"
            />
          </div>

          {debouncedQuery.length >= 2 && (
            <CardGrid
              cards={searchCards}
              onAddToDeck={(card) => addCard.mutate(card)}
              isLoading={searchLoading}
            />
          )}

          {!searchQuery && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              <Search className="w-8 h-8 mx-auto mb-3 opacity-30" />
              Search for cards to add to your deck
            </div>
          )}
        </div>
      </div>

      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        deckId={deckId}
        board={board}
      />

      {/* Zoomed card overlay */}
      {zoomedCard && (
        <CardZoomOverlay
          card={zoomedCard}
          onClose={() => setZoomedCard(null)}
          onUpdateQuantity={(id, qty) => {
            updateQuantity.mutate({ id, quantity: qty });
          }}
          onRemove={(id) => {
            removeCard.mutate(id);
            setZoomedCard(null);
          }}
        />
      )}
    </div>
  );
}

/** Visual grid of deck cards with images, quantity badges, and hover controls */
function DeckVisualGrid({
  cards,
  onUpdateQuantity,
  onRemove,
  onCardClick,
}: {
  cards: DeckCard[];
  onUpdateQuantity: (id: number, qty: number) => void;
  onRemove: (id: number) => void;
  onCardClick: (card: DeckCard) => void;
}) {
  // Group by type category
  const grouped: Record<string, DeckCard[]> = {};
  for (const card of cards) {
    const rawType = card.typeLine.split("—")[0].trim();
    let type = "Other";
    if (rawType.includes("Creature")) type = "Creatures";
    else if (rawType.includes("Instant")) type = "Instants";
    else if (rawType.includes("Sorcery")) type = "Sorceries";
    else if (rawType.includes("Enchantment")) type = "Enchantments";
    else if (rawType.includes("Artifact")) type = "Artifacts";
    else if (rawType.includes("Planeswalker")) type = "Planeswalkers";
    else if (rawType.includes("Land")) type = "Lands";
    if (!grouped[type]) grouped[type] = [];
    grouped[type].push(card);
  }

  const typeOrder = [
    "Creatures",
    "Planeswalkers",
    "Instants",
    "Sorceries",
    "Enchantments",
    "Artifacts",
    "Lands",
    "Other",
  ];

  const sortedGroups = typeOrder
    .filter((t) => grouped[t]?.length > 0)
    .map((t) => ({ type: t, cards: grouped[t] }));

  return (
    <div className="space-y-5">
      {sortedGroups.map(({ type, cards: typeCards }) => (
        <div key={type}>
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
            {type} ({typeCards.reduce((s, c) => s + (c.quantity || 1), 0)})
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-4 xl:grid-cols-5 gap-2">
            {typeCards.map((card) => (
              <DeckCardTile
                key={card.id}
                card={card}
                onUpdateQuantity={onUpdateQuantity}
                onRemove={onRemove}
                onCardClick={onCardClick}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Single card tile with image, quantity badge, and hover controls */
function DeckCardTile({
  card,
  onUpdateQuantity,
  onRemove,
  onCardClick,
}: {
  card: DeckCard;
  onUpdateQuantity: (id: number, qty: number) => void;
  onRemove: (id: number) => void;
  onCardClick: (card: DeckCard) => void;
}) {
  return (
    <div
      className="relative group cursor-pointer"
      data-testid={`deck-card-${card.id}`}
      onClick={() => onCardClick(card)}
    >
      {/* Card image */}
      {card.imageSmall || card.imageNormal ? (
        <img
          src={card.imageNormal || card.imageSmall || ""}
          alt={card.name}
          className="w-full rounded-lg card-hover"
          loading="lazy"
        />
      ) : (
        <div className="w-full aspect-[5/7] rounded-lg bg-muted flex items-center justify-center">
          <span className="text-[10px] text-muted-foreground text-center px-1">
            {card.name}
          </span>
        </div>
      )}

      {/* Quantity badge */}
      {(card.quantity || 1) > 1 && (
        <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-lg">
          {card.quantity}
        </div>
      )}

      {/* Hover overlay — name only, click to zoom */}
      <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-end">
        <div className="w-full bg-gradient-to-t from-black/80 to-transparent rounded-b-lg px-2 py-1.5">
          <span className="text-[10px] text-white font-medium leading-tight line-clamp-2">
            {card.name}
          </span>
        </div>
      </div>
    </div>
  );
}

/** Full-screen card zoom overlay with large image and controls */
function CardZoomOverlay({
  card,
  onClose,
  onUpdateQuantity,
  onRemove,
}: {
  card: DeckCard;
  onClose: () => void;
  onUpdateQuantity: (id: number, qty: number) => void;
  onRemove: (id: number) => void;
}) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const image = card.imageNormal || card.imageSmall;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
      data-testid="card-zoom-overlay"
    >
      <div
        className="relative flex flex-col sm:flex-row items-center gap-6 max-w-3xl w-full px-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          className="absolute -top-2 -right-2 sm:top-0 sm:right-0 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors z-10"
          onClick={onClose}
          data-testid="card-zoom-close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Large card image */}
        {image ? (
          <img
            src={image}
            alt={card.name}
            className="rounded-2xl shadow-2xl max-h-[75vh] w-auto"
            data-testid="card-zoom-image"
          />
        ) : (
          <div className="bg-muted rounded-2xl w-[300px] aspect-[5/7] flex items-center justify-center">
            <span className="text-muted-foreground">{card.name}</span>
          </div>
        )}

        {/* Card info + controls */}
        <div className="flex flex-col items-center sm:items-start gap-4 text-white">
          <div>
            <h2 className="text-xl font-bold">{card.name}</h2>
            <p className="text-sm text-white/60">{card.typeLine}</p>
            {card.manaCost && (
              <p className="text-sm text-white/50 mt-1">{card.manaCost}</p>
            )}
          </div>

          {card.oracleText && (
            <p className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed max-w-xs">
              {card.oracleText}
            </p>
          )}

          {card.power && card.toughness && (
            <p className="text-sm font-semibold text-white/70">
              {card.power}/{card.toughness}
            </p>
          )}

          {/* Quantity controls */}
          <div className="flex items-center gap-2 mt-2">
            <button
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              onClick={() => onUpdateQuantity(card.id, (card.quantity || 1) - 1)}
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-lg font-bold w-8 text-center">
              {card.quantity || 1}x
            </span>
            <button
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              onClick={() => onUpdateQuantity(card.id, (card.quantity || 1) + 1)}
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              className="w-8 h-8 rounded-lg bg-red-500/30 hover:bg-red-500/50 flex items-center justify-center text-white transition-colors ml-2"
              onClick={() => onRemove(card.id)}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
