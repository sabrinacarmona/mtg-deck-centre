import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import CardGrid from "@/components/CardGrid";
import CardDetailDialog from "@/components/CardDetailDialog";
import { Search } from "lucide-react";
import type { ScryfallCard } from "@shared/schema";

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
      <CardGrid
        cards={cards}
        onAddToCollection={(card) => addToCollection.mutate(card)}
        onCardClick={handleCardClick}
        isLoading={isLoading && debouncedQuery.length >= 2}
        addedIds={addedIds}
      />

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
