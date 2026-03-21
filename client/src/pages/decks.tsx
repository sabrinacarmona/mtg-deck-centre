import { useState } from "react";
import { useQuery, useQueries, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Layers3, Trash2, Crown, GitCompare } from "lucide-react";
import type { Deck, DeckCard } from "@shared/schema";

const formats = [
  "commander",
  "standard",
  "modern",
  "legacy",
  "vintage",
  "pioneer",
  "pauper",
  "casual",
];

export default function DecksPage() {
  const [newDeckName, setNewDeckName] = useState("");
  const [newDeckFormat, setNewDeckFormat] = useState("commander");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: deckList = [], isLoading } = useQuery<Deck[]>({
    queryKey: ["/api/decks"],
  });

  // Fetch all deck cards to find commanders
  const deckCardsResults = useQueries({
    queries: deckList.map((deck) => ({
      queryKey: ["/api/decks", deck.id, "cards"],
      queryFn: async () => {
        const res = await apiRequest("GET", `/api/decks/${deck.id}/cards`);
        return res.json() as Promise<DeckCard[]>;
      },
      enabled: !!deck.id,
    })),
  });

  const deckCardsMap = new Map<number, DeckCard[]>();
  deckList.forEach((deck, i) => {
    const data = deckCardsResults[i]?.data;
    if (data) deckCardsMap.set(deck.id, data as unknown as DeckCard[]);
  });

  const createDeck = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/decks", {
        name: newDeckName,
        format: newDeckFormat,
      });
      return res.json();
    },
    onSuccess: (deck: Deck) => {
      queryClient.invalidateQueries({ queryKey: ["/api/decks"] });
      setNewDeckName("");
      setNewDeckFormat("commander");
      setDialogOpen(false);
      toast({ title: `"${deck.name}" created` });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteDeck = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/decks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/decks"] });
      toast({ title: "Deck deleted" });
    },
  });

  return (
    <div className="space-y-4" data-testid="decks-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Decks</h1>
        <div className="flex items-center gap-2">
          {deckList.length >= 2 && (
            <Link href="/compare">
              <Button variant="secondary" size="sm" className="gap-1.5">
                <GitCompare className="w-3.5 h-3.5" />
                Compare
              </Button>
            </Link>
          )}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="new-deck-btn">
                <Plus className="w-4 h-4 mr-2" />
                New Deck
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Deck</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Deck Name</label>
                  <Input
                    placeholder="e.g. Draconic Destruction Upgraded"
                    value={newDeckName}
                    onChange={(e) => setNewDeckName(e.target.value)}
                    data-testid="deck-name-input"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Format</label>
                  <Select value={newDeckFormat} onValueChange={setNewDeckFormat}>
                    <SelectTrigger data-testid="deck-format-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {formats.map((f) => (
                        <SelectItem key={f} value={f}>
                          {f.charAt(0).toUpperCase() + f.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full"
                  disabled={!newDeckName.trim() || createDeck.isPending}
                  onClick={() => createDeck.mutate()}
                  data-testid="create-deck-submit"
                >
                  {createDeck.isPending ? "Creating..." : "Create Deck"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      )}

      {/* Deck grid */}
      {!isLoading && deckList.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {deckList.map((deck) => {
            const cards = deckCardsMap.get(deck.id) || [];
            const commander = cards.find((c) => c.isCommander);
            const artCard = commander || cards[0];
            const artUrl = artCard?.imageNormal || artCard?.imageSmall;
            const totalCards = cards.reduce((s, c) => s + (c.quantity || 1), 0);
            return (
              <Link key={deck.id} href={`/decks/${deck.id}`}>
                <div
                  className="relative overflow-hidden rounded-xl cursor-pointer group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/40"
                  style={{ aspectRatio: "4/3" }}
                  data-testid={`deck-card-${deck.id}`}
                >
                  {/* Art background — full visibility */}
                  {artUrl ? (
                    <img
                      src={artUrl}
                      alt={deck.name}
                      className="absolute inset-0 w-full h-full object-cover object-top"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900" />
                  )}

                  {/* Gradient overlay — heavier at bottom for text */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                  {/* Delete button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 w-7 h-7 opacity-0 group-hover:opacity-100 transition-opacity text-white/60 hover:text-red-400 hover:bg-black/40 z-10"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      deleteDeck.mutate(deck.id);
                    }}
                    data-testid={`delete-deck-${deck.id}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>

                  {/* Content at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                    <h3 className="font-bold text-base text-white drop-shadow-lg">
                      {deck.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] bg-white/15 backdrop-blur-sm text-white/90 px-2 py-0.5 rounded-full capitalize font-medium">
                        {deck.format}
                      </span>
                      <span className="text-[10px] text-white/50">
                        {totalCards} cards
                      </span>
                    </div>
                    {(commander || artCard) && (
                      <div className="flex items-center gap-1.5 mt-2 text-[11px] text-white/70">
                        <Crown className="w-3 h-3 text-amber-400/80" />
                        <span className="truncate">
                          {(commander || artCard)?.name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && deckList.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/15 flex items-center justify-center mb-4">
            <Layers3 className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-lg font-semibold mb-1">No Decks Yet</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">
            Create your first deck, add cards, and track your mana curve, color
            distribution, and more.
          </p>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create First Deck
          </Button>
        </div>
      )}
    </div>
  );
}
