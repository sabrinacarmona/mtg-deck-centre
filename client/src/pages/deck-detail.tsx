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
import { ArrowLeft, Search, Minus, Plus, Trash2, Layers3, Import } from "lucide-react";
import ImportDialog from "@/components/ImportDialog";
import type { Deck, DeckCard, ScryfallCard } from "@shared/schema";

export default function DeckDetailPage() {
  const [, params] = useRoute("/decks/:id");
  const deckId = Number(params?.id);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [board, setBoard] = useState<"main" | "side">("main");
  const [importOpen, setImportOpen] = useState(false);
  const { toast } = useToast();

  // Debounce search
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
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
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
  const totalMain = mainCards.reduce((s, c) => s + (c.quantity || 1), 0);
  const totalSide = sideCards.reduce((s, c) => s + (c.quantity || 1), 0);
  const avgCmc =
    mainCards.length > 0
      ? (
          mainCards.reduce(
            (s, c) => s + (c.cmc || 0) * (c.quantity || 1),
            0
          ) / totalMain
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
      {/* Back nav + title */}
      <div className="flex items-center gap-3">
        <Link href="/decks">
          <Button variant="ghost" size="icon" className="w-8 h-8" data-testid="back-btn">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Search + add */}
        <div className="lg:col-span-2 space-y-3">
          {/* Search */}
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

          {/* Board selector + import */}
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
              Mainboard
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
              Sideboard
            </button>
            <div className="ml-auto">
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

          {/* Search results */}
          {debouncedQuery.length >= 2 && (
            <CardGrid
              cards={searchCards}
              onAddToDeck={(card) => addCard.mutate(card)}
              isLoading={searchLoading}
            />
          )}

          {!searchQuery && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Search for cards to add to your deck
            </div>
          )}
        </div>

        {/* Right: Deck list + stats */}
        <div className="space-y-4">
          {/* Stats */}
          <div className="bg-card border border-card-border rounded-xl p-4 space-y-4">
            <h3 className="text-sm font-semibold">Mana Curve</h3>
            <ManaCurve cards={mainCards} />
          </div>

          <div className="bg-card border border-card-border rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold">Colors</h3>
            <ColorDistribution cards={mainCards} />
          </div>

          {/* Card list */}
          <Tabs defaultValue="main">
            <TabsList className="w-full">
              <TabsTrigger value="main" className="flex-1 text-xs">
                Main ({totalMain})
              </TabsTrigger>
              <TabsTrigger value="side" className="flex-1 text-xs">
                Side ({totalSide})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="main">
              <DeckCardList
                cards={mainCards}
                onUpdateQuantity={(id, qty) =>
                  updateQuantity.mutate({ id, quantity: qty })
                }
                onRemove={(id) => removeCard.mutate(id)}
              />
            </TabsContent>
            <TabsContent value="side">
              <DeckCardList
                cards={sideCards}
                onUpdateQuantity={(id, qty) =>
                  updateQuantity.mutate({ id, quantity: qty })
                }
                onRemove={(id) => removeCard.mutate(id)}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Import dialog */}
      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        deckId={deckId}
        board={board}
      />
    </div>
  );
}

function DeckCardList({
  cards,
  onUpdateQuantity,
  onRemove,
}: {
  cards: DeckCard[];
  onUpdateQuantity: (id: number, qty: number) => void;
  onRemove: (id: number) => void;
}) {
  if (cards.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-muted-foreground">
        No cards yet
      </div>
    );
  }

  // Group by type
  const grouped: Record<string, DeckCard[]> = {};
  for (const card of cards) {
    const type = card.typeLine.split("—")[0].trim().split(" ").pop() || "Other";
    if (!grouped[type]) grouped[type] = [];
    grouped[type].push(card);
  }

  return (
    <div className="space-y-3 mt-2">
      {Object.entries(grouped).map(([type, typeCards]) => (
        <div key={type}>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-1">
            {type} ({typeCards.reduce((s, c) => s + (c.quantity || 1), 0)})
          </div>
          <div className="space-y-0.5">
            {typeCards.map((card) => (
              <div
                key={card.id}
                className="flex items-center gap-2 py-1 px-1.5 rounded hover:bg-muted/50 transition-colors group"
                data-testid={`deck-card-${card.id}`}
              >
                <span className="text-xs font-semibold text-muted-foreground w-4 text-right">
                  {card.quantity}x
                </span>
                <span className="text-xs flex-1 truncate">{card.name}</span>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    className="p-0.5 text-muted-foreground hover:text-foreground"
                    onClick={() =>
                      onUpdateQuantity(card.id, (card.quantity || 1) - 1)
                    }
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <button
                    className="p-0.5 text-muted-foreground hover:text-foreground"
                    onClick={() =>
                      onUpdateQuantity(card.id, (card.quantity || 1) + 1)
                    }
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <button
                    className="p-0.5 text-destructive hover:text-destructive/80"
                    onClick={() => onRemove(card.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
