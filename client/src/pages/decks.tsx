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
import { Plus, Layers3, Trash2, Crown, GitCompare, Swords, Download } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
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

  const exportDeck = (deck: Deck) => {
    const cards = deckCardsMap.get(deck.id) || [];
    const mainCards = cards.filter((c) => c.board === "main");
    const sideCards = cards.filter((c) => c.board === "side");

    const typeOrder = ["Creatures", "Planeswalkers", "Instants", "Sorceries", "Enchantments", "Artifacts", "Lands", "Other"];
    const categorize = (card: DeckCard): string => {
      const rawType = card.typeLine.split("—")[0].trim();
      if (rawType.includes("Creature")) return "Creatures";
      if (rawType.includes("Planeswalker")) return "Planeswalkers";
      if (rawType.includes("Instant")) return "Instants";
      if (rawType.includes("Sorcery")) return "Sorceries";
      if (rawType.includes("Enchantment")) return "Enchantments";
      if (rawType.includes("Artifact")) return "Artifacts";
      if (rawType.includes("Land")) return "Lands";
      return "Other";
    };

    const isCommander = deck.format === "commander";
    const commanderCards = mainCards.filter((c) => c.isCommander);
    const nonCommanderMain = mainCards.filter((c) => !c.isCommander);

    const grouped: Record<string, DeckCard[]> = {};
    for (const card of nonCommanderMain) {
      const type = categorize(card);
      if (!grouped[type]) grouped[type] = [];
      grouped[type].push(card);
    }

    let text = "";
    if (isCommander && commanderCards.length > 0) {
      text += "Commander\n";
      for (const c of commanderCards) text += `${c.quantity || 1} ${c.name}\n`;
      text += "\nDeck\n";
    }
    for (const type of typeOrder) {
      if (!grouped[type]?.length) continue;
      if (text.length > 0 && !text.endsWith("\n\n")) text += "\n";
      text += `// ${type}\n`;
      for (const c of grouped[type]) text += `${c.quantity || 1} ${c.name}\n`;
    }
    if (sideCards.length > 0) {
      text += "\nSideboard\n";
      for (const c of sideCards) text += `${c.quantity || 1} ${c.name}\n`;
    }

    const slug = deck.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const blob = new Blob([text.trim()], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: `"${deck.name}" exported` });
  };

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
        <h1 className="text-xl font-display font-bold">Decks</h1>
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

      {/* Deck grid — separated by owner */}
      {!isLoading && deckList.length > 0 && (() => {
        const myDecks = deckList.filter((d) => !d.name.startsWith("Will's"));
        const willDecks = deckList.filter((d) => d.name.startsWith("Will's"));

        const renderDeckCard = (deck: Deck, isRival = false) => {
          const cards = deckCardsMap.get(deck.id) || [];
          const commander = cards.find((c) => c.isCommander);
          const artCard = commander || cards[0];
          const artUrl = artCard?.imageNormal || artCard?.imageSmall;
          const totalCards = cards.reduce((s, c) => s + (c.quantity || 1), 0);
          const displayName = isRival ? deck.name.replace("Will's ", "") : deck.name;
          return (
            <Link key={deck.id} href={`/decks/${deck.id}`}>
              <div
                className={`relative overflow-hidden rounded-xl cursor-pointer group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${isRival ? "hover:shadow-red-900/30 ring-1 ring-red-500/20" : "hover:shadow-black/40"}`}
                style={{ aspectRatio: "4/3" }}
                data-testid={`deck-card-${deck.id}`}
              >
                {/* Art background */}
                {artUrl ? (
                  <img
                    src={artUrl}
                    alt={deck.name}
                    className={`absolute inset-0 w-full h-full object-cover object-top ${isRival ? "saturate-[0.85]" : ""}`}
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900" />
                )}

                {/* Gradient overlay */}
                <div className={`absolute inset-0 bg-gradient-to-t ${isRival ? "from-red-950/90 via-black/30 to-transparent" : "from-black/90 via-black/30 to-transparent"}`} />

                {/* Rival badge */}
                {isRival && (
                  <div className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-red-500/80 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    <Swords className="w-2.5 h-2.5" />
                    Rival
                  </div>
                )}

                {/* Action buttons */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-7 h-7 text-white/60 hover:text-primary hover:bg-black/40"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          exportDeck(deck);
                        }}
                      >
                        <Download className="w-3.5 h-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Export Deck</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-7 h-7 text-white/60 hover:text-red-400 hover:bg-black/40"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          deleteDeck.mutate(deck.id);
                        }}
                        data-testid={`delete-deck-${deck.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Delete Deck</TooltipContent>
                  </Tooltip>
                </div>

                {/* Content at bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                  <h3 className="font-bold text-base text-white drop-shadow-lg">
                    {displayName}
                  </h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`text-[10px] backdrop-blur-sm px-2 py-0.5 rounded-full capitalize font-medium ${isRival ? "bg-red-500/20 text-red-200" : "bg-white/15 text-white/90"}`}>
                      {deck.format}
                    </span>
                    <span className="text-[10px] text-white/50">
                      {totalCards} cards
                    </span>
                  </div>
                  {(commander || artCard) && (
                    <div className="flex items-center gap-1.5 mt-2 text-[11px] text-white/70">
                      <Crown className={`w-3 h-3 ${isRival ? "text-red-400/80" : "text-amber-400/80"}`} />
                      <span className="truncate">
                        {(commander || artCard)?.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Link>
          );
        };

        return (
          <div className="space-y-8">
            {/* My Decks */}
            {myDecks.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Crown className="w-4 h-4 text-primary" />
                  <h2 className="text-sm font-semibold text-foreground/80 uppercase tracking-wide">My Decks</h2>
                  <span className="text-xs text-muted-foreground">{myDecks.length}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myDecks.map((deck) => renderDeckCard(deck, false))}
                </div>
              </div>
            )}

            {/* Will's Decks */}
            {willDecks.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Swords className="w-4 h-4 text-red-400" />
                  <h2 className="text-sm font-semibold text-red-400/80 uppercase tracking-wide">Will's Decks</h2>
                  <span className="text-xs text-red-400/50">{willDecks.length}</span>
                  <span className="text-[10px] text-muted-foreground ml-auto">Know thy enemy</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {willDecks.map((deck) => renderDeckCard(deck, true))}
                </div>
              </div>
            )}
          </div>
        );
      })()}

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
