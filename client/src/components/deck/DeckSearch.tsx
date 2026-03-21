import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import CardGrid from "@/components/CardGrid";
import type { ScryfallCard } from "@shared/schema";

interface DeckSearchProps {
  deckId: number;
  board: "main" | "side";
  mobileSearchOpen: boolean;
  onMobileSearchClose: () => void;
  onAddCard: (card: ScryfallCard) => void;
}

export default function DeckSearch({
  deckId,
  board,
  mobileSearchOpen,
  onMobileSearchClose,
  onAddCard,
}: DeckSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    if (searchQuery.length < 2) {
      setDebouncedQuery("");
      return;
    }
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

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

  return (
    <div className={`lg:col-span-2 space-y-3 ${mobileSearchOpen ? "" : "hidden lg:block"}`} id="deck-search-panel">
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
          onAddToDeck={(card) => onAddCard(card)}
          isLoading={searchLoading}
        />
      )}

      {!searchQuery && (
        <div className="text-center py-8 text-sm text-muted-foreground">
          <Search className="w-8 h-8 mx-auto mb-3 opacity-30" />
          Search for cards to add to your deck
        </div>
      )}

      <Button
        variant="secondary"
        className="w-full lg:hidden"
        onClick={onMobileSearchClose}
      >
        Close Search
      </Button>
    </div>
  );
}
