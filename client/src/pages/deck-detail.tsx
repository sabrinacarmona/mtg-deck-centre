import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useRoute } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import {
  Trophy,
  PlusCircle,
  Trash2,
  Droplets,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import ImportDialog from "@/components/ImportDialog";
import ManaAnalyzer from "@/components/ManaAnalyzer";
import DeckHeader from "@/components/deck/DeckHeader";
import DeckStats from "@/components/deck/DeckStats";
import DeckCardGrid from "@/components/deck/DeckCardGrid";
import DeckCardZoom from "@/components/deck/DeckCardZoom";
import DeckStrategyGuide from "@/components/deck/DeckStrategyGuide";
import DeckSearch from "@/components/deck/DeckSearch";
import DeckCombos from "@/components/deck/DeckCombos";
import DeckUpgrades from "@/components/deck/DeckUpgrades";
import type { Deck, DeckCard, ScryfallCard } from "@shared/schema";

interface GameHistoryEntry {
  id: number;
  deckId: number;
  date: string;
  opponent: string;
  result: "win" | "loss" | "draw";
  notes: string;
}

export default function DeckDetailPage() {
  const [, params] = useRoute("/decks/:id");
  const deckId = Number(params?.id);
  const [board, setBoard] = useState<"main" | "side">("main");
  const [importOpen, setImportOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [zoomedCard, setZoomedCard] = useState<DeckCard | null>(null);
  const [gameLogOpen, setGameLogOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [manaAnalysisOpen, setManaAnalysisOpen] = useState(false);
  const [combosOpen, setCombosOpen] = useState(false);
  const [upgradesOpen, setUpgradesOpen] = useState(false);
  const { toast } = useToast();

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

  const { data: gameHistory = [] } = useQuery<GameHistoryEntry[]>({
    queryKey: ["/api/decks", deckId, "history"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/decks/${deckId}/history`);
      return res.json();
    },
    enabled: !!deckId,
  });

  const addCard = useMutation({
    mutationFn: async (card: ScryfallCard) => {
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
        board,
      });
      return res.json();
    },
    onSuccess: (_data, card) => {
      queryClient.invalidateQueries({ queryKey: ["/api/decks", deckId, "cards"] });
      toast({ title: `${card.name} added to ${board === "main" ? "mainboard" : "sideboard"}` });
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
      const res = await apiRequest("PATCH", `/api/deck-cards/${id}/quantity`, { quantity });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/decks", deckId, "cards"] });
    },
  });

  const removeCard = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/deck-cards/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/decks", deckId, "cards"] });
    },
  });

  const toggleCommander = useMutation({
    mutationFn: async ({ id, isCommander }: { id: number; isCommander: boolean }) => {
      const res = await apiRequest("PATCH", `/api/deck-cards/${id}`, { isCommander });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/decks", deckId, "cards"] });
    },
  });

  const addHistoryEntry = useMutation({
    mutationFn: async (entry: Omit<GameHistoryEntry, "id" | "deckId">) => {
      const res = await apiRequest("POST", `/api/decks/${deckId}/history`, entry);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/decks", deckId, "history"] });
      toast({ title: "Game logged" });
    },
  });

  const deleteHistoryEntry = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/game-history/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/decks", deckId, "history"] });
    },
  });

  const mainCards = deckCards.filter((c) => c.board === "main");
  const sideCards = deckCards.filter((c) => c.board === "side");
  const activeCards = board === "main" ? mainCards : sideCards;
  const totalMain = mainCards.reduce((s, c) => s + (c.quantity || 1), 0);
  const totalSide = sideCards.reduce((s, c) => s + (c.quantity || 1), 0);
  const totalPrice = deckCards.reduce((sum, c) => sum + parseFloat(c.priceUsd || "0") * (c.quantity || 1), 0);

  const handleExport = () => {
    const typeOrder = ["Creatures", "Planeswalkers", "Instants", "Sorceries", "Enchantments", "Artifacts", "Lands", "Other"];
    const grouped: Record<string, DeckCard[]> = {};
    for (const card of mainCards) {
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
    let text = "";
    for (const type of typeOrder) {
      if (!grouped[type]?.length) continue;
      text += `// ${type}\n`;
      for (const c of grouped[type]) text += `${c.quantity || 1} ${c.name}\n`;
      text += "\n";
    }
    if (sideCards.length > 0) {
      text += "Sideboard\n";
      for (const c of sideCards) text += `${c.quantity || 1} ${c.name}\n`;
    }
    return text.trim();
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(handleExport());
    toast({ title: "Decklist copied to clipboard" });
  };

  const downloadTxt = () => {
    const text = handleExport();
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${deck?.name || "deck"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Decklist downloaded" });
  };

  if (!deck) {
    return (
      <div className="text-center py-16">
        <div className="text-2xl mb-2">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="deck-detail-page">
      <DeckHeader
        deck={deck}
        mainCards={mainCards}
        sideCards={sideCards}
        totalPrice={totalPrice}
        statsOpen={statsOpen}
        guideOpen={guideOpen}
        onToggleStats={() => setStatsOpen(!statsOpen)}
        onToggleGuide={() => setGuideOpen(!guideOpen)}
        onCopy={copyToClipboard}
        onExport={downloadTxt}
        onImport={() => setImportOpen(true)}
      />

      {statsOpen && <DeckStats cards={mainCards} />}

      {guideOpen && <DeckStrategyGuide deckName={deck.name} />}

      {/* Board tabs */}
      <div className="flex gap-2 items-center">
        <button
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            board === "main" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}
          onClick={() => setBoard("main")}
          data-testid="board-main"
        >
          Mainboard ({totalMain})
        </button>
        <button
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            board === "side" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}
          onClick={() => setBoard("side")}
          data-testid="board-side"
        >
          Sideboard ({totalSide})
        </button>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          {activeCards.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              <div className="w-12 h-12 mx-auto rounded-full bg-primary/15 flex items-center justify-center mb-3">
                <PlusCircle className="w-6 h-6 text-primary" />
              </div>
              No cards in {board === "main" ? "mainboard" : "sideboard"} yet.
              <br />
              Use the search panel to add cards.
            </div>
          ) : (
            <DeckCardGrid
              cards={activeCards}
              onUpdateQuantity={(id, qty) => updateQuantity.mutate({ id, quantity: qty })}
              onRemove={(id) => removeCard.mutate(id)}
              onCardClick={(card) => setZoomedCard(card)}
              deckFormat={deck.format}
            />
          )}
        </div>

        <DeckSearch
          deckId={deckId}
          board={board}
          mobileSearchOpen={mobileSearchOpen}
          onMobileSearchClose={() => setMobileSearchOpen(false)}
          onAddCard={(card) => addCard.mutate(card)}
        />
      </div>

      {/* Mobile floating add button */}
      {!mobileSearchOpen && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className="fixed bottom-20 md:bottom-6 right-4 md:right-6 lg:hidden w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center z-40"
              onClick={() => setMobileSearchOpen(true)}
              aria-label="Add Cards"
            >
              <PlusCircle className="w-6 h-6" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Add Cards</TooltipContent>
        </Tooltip>
      )}

      {/* Game Log */}
      <div className="border border-card-border rounded-xl overflow-hidden">
        <button
          className="w-full flex items-center justify-between p-3 bg-card hover:bg-muted/50 transition-colors"
          onClick={() => setGameLogOpen(!gameLogOpen)}
        >
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Game Log</span>
            {gameHistory.length > 0 && (
              <Badge variant="outline" className="text-[10px]">
                {gameHistory.filter((g) => g.result === "win").length}W -{" "}
                {gameHistory.filter((g) => g.result === "loss").length}L -{" "}
                {gameHistory.filter((g) => g.result === "draw").length}D
              </Badge>
            )}
          </div>
          {gameLogOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {gameLogOpen && (
          <div className="p-3 space-y-3 border-t border-card-border">
            <GameLogForm onSubmit={(entry) => addHistoryEntry.mutate(entry)} />
            {gameHistory.length > 0 && (
              <div className="space-y-1.5">
                {gameHistory
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((entry) => (
                    <div key={entry.id} className="flex items-center gap-2 text-xs bg-muted/50 rounded-lg p-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        entry.result === "win" ? "bg-emerald-500/20 text-emerald-400" :
                        entry.result === "loss" ? "bg-red-500/20 text-red-400" :
                        "bg-yellow-500/20 text-yellow-400"
                      }`}>
                        {entry.result === "win" ? "W" : entry.result === "loss" ? "L" : "D"}
                      </span>
                      <span className="text-muted-foreground">{entry.date}</span>
                      <span className="font-medium">vs {entry.opponent}</span>
                      {entry.notes && <span className="text-muted-foreground truncate flex-1">{entry.notes}</span>}
                      <button
                        className="text-muted-foreground hover:text-destructive ml-auto"
                        onClick={() => deleteHistoryEntry.mutate(entry.id)}
                        aria-label="Delete entry"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mana Base Analysis */}
      <div className="border border-card-border rounded-xl overflow-hidden">
        <button
          className="w-full flex items-center justify-between p-3 bg-card hover:bg-muted/50 transition-colors"
          onClick={() => setManaAnalysisOpen(!manaAnalysisOpen)}
        >
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Mana Base Analysis</span>
          </div>
          {manaAnalysisOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {manaAnalysisOpen && (
          <div className="p-3 border-t border-card-border">
            <ManaAnalyzer cards={mainCards} />
          </div>
        )}
      </div>

      <DeckCombos cards={mainCards} open={combosOpen} onToggle={() => setCombosOpen(!combosOpen)} />
      <DeckUpgrades cards={mainCards} open={upgradesOpen} onToggle={() => setUpgradesOpen(!upgradesOpen)} />

      <ImportDialog open={importOpen} onOpenChange={setImportOpen} deckId={deckId} board={board} />

      {zoomedCard && (
        <DeckCardZoom
          card={zoomedCard}
          deckFormat={deck.format}
          onClose={() => setZoomedCard(null)}
          onUpdateQuantity={(id, qty) => updateQuantity.mutate({ id, quantity: qty })}
          onRemove={(id) => { removeCard.mutate(id); setZoomedCard(null); }}
          onToggleCommander={(id, isCommander) => toggleCommander.mutate({ id, isCommander })}
        />
      )}
    </div>
  );
}

function GameLogForm({ onSubmit }: { onSubmit: (entry: { date: string; opponent: string; result: "win" | "loss" | "draw"; notes: string }) => void }) {
  const [opponent, setOpponent] = useState("");
  const [result, setResult] = useState<"win" | "loss" | "draw">("win");
  const [notes, setNotes] = useState("");

  const handleSubmit = () => {
    if (!opponent.trim()) return;
    onSubmit({
      date: new Date().toISOString().split("T")[0],
      opponent: opponent.trim(),
      result,
      notes: notes.trim(),
    });
    setOpponent("");
    setNotes("");
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <Input placeholder="Opponent" value={opponent} onChange={(e) => setOpponent(e.target.value)} className="h-8 text-xs bg-card" />
      <div className="flex gap-1">
        {(["win", "loss", "draw"] as const).map((r) => (
          <button
            key={r}
            onClick={() => setResult(r)}
            className={`px-2 py-1 rounded text-xs font-medium ${
              result === r
                ? r === "win" ? "bg-emerald-500/20 text-emerald-400" :
                  r === "loss" ? "bg-red-500/20 text-red-400" :
                  "bg-yellow-500/20 text-yellow-400"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {r.charAt(0).toUpperCase() + r.slice(1)}
          </button>
        ))}
      </div>
      <Input placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} className="h-8 text-xs bg-card flex-1" />
      <Button size="sm" className="h-8 text-xs" onClick={handleSubmit} disabled={!opponent.trim()}>Log</Button>
    </div>
  );
}
