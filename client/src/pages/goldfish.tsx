import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Hand,
  RotateCcw,
  SkipForward,
  ArrowRight,
  Layers3,
  Shuffle,
  Eye,
  X,
  ChevronDown,
} from "lucide-react";
import { ManaSymbol } from "@/components/ManaSymbols";

/* ─── Types ────────────────────────────────────────────────────── */

interface SimCard {
  name: string;
  imageSmall: string | null;
  imageNormal: string | null;
  manaCost: string | null;
  cmc: number;
  typeLine: string;
  isCommander: boolean;
  oracleText: string | null;
}

type SimPhase = "pick-deck" | "opening-hand" | "playing";

/* ─── Shuffle helper ───────────────────────────────────────────── */

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/* ─── Card component ───────────────────────────────────────────── */

function CardImage({
  card,
  onClick,
  small = false,
  dimmed = false,
}: {
  card: SimCard;
  onClick?: () => void;
  small?: boolean;
  dimmed?: boolean;
}) {
  const [imgError, setImgError] = useState(false);
  const imgSrc = small ? card.imageSmall : card.imageNormal || card.imageSmall;

  return (
    <div
      className={`relative group cursor-pointer transition-all ${
        dimmed ? "opacity-40" : "hover:scale-105 hover:z-10"
      } ${small ? "w-[70px]" : "w-[130px]"}`}
      onClick={onClick}
    >
      {imgSrc && !imgError ? (
        <img
          src={imgSrc}
          alt={card.name}
          className="rounded-lg shadow-md w-full"
          onError={() => setImgError(true)}
          loading="lazy"
        />
      ) : (
        <div
          className={`rounded-lg border-2 border-border bg-card flex items-center justify-center ${
            small ? "h-[98px]" : "h-[182px]"
          }`}
        >
          <span className="text-xs text-muted-foreground text-center px-1 leading-tight">
            {card.name}
          </span>
        </div>
      )}
      {card.isCommander && (
        <div className="absolute top-0.5 right-0.5 bg-primary text-primary-foreground text-[8px] font-bold px-1 rounded">
          CMD
        </div>
      )}
    </div>
  );
}

/* ─── Card zoom overlay ────────────────────────────────────────── */

function CardZoom({ card, onClose }: { card: SimCard; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="relative max-w-sm" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center z-10"
        >
          <X className="w-4 h-4" />
        </button>
        {card.imageNormal ? (
          <img
            src={card.imageNormal}
            alt={card.name}
            className="rounded-xl shadow-2xl w-full max-w-[350px]"
          />
        ) : (
          <div className="rounded-xl border-2 border-border bg-card p-8 text-center">
            <h3 className="font-bold">{card.name}</h3>
            <p className="text-sm text-muted-foreground mt-2">{card.typeLine}</p>
            {card.oracleText && (
              <p className="text-xs text-muted-foreground mt-2">{card.oracleText}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Mana curve mini chart ────────────────────────────────────── */

function ManaCurve({ cards }: { cards: SimCard[] }) {
  const curve = useMemo(() => {
    const buckets: Record<number, number> = {};
    for (const c of cards) {
      if (c.typeLine.toLowerCase().includes("land")) continue;
      const cmc = Math.min(Math.floor(c.cmc), 7); // 7+ bucket
      buckets[cmc] = (buckets[cmc] || 0) + 1;
    }
    const max = Math.max(...Object.values(buckets), 1);
    return Array.from({ length: 8 }, (_, i) => ({
      cmc: i === 7 ? "7+" : String(i),
      count: buckets[i] || 0,
      pct: ((buckets[i] || 0) / max) * 100,
    }));
  }, [cards]);

  return (
    <div className="flex items-end gap-1 h-16">
      {curve.map((b) => (
        <div key={b.cmc} className="flex flex-col items-center gap-0.5 flex-1">
          <div
            className="w-full bg-primary/30 rounded-t transition-all min-h-[2px]"
            style={{ height: `${Math.max(b.pct, 4)}%` }}
          />
          <span className="text-[9px] text-muted-foreground">{b.cmc}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Deck picker ──────────────────────────────────────────────── */

function DeckPicker({ onPick }: { onPick: (deckId: number) => void }) {
  const { data: decks = [] } = useQuery<any[]>({
    queryKey: ["/api/decks"],
  });

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
          <Hand className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-primary">Opening Hand Simulator</h1>
        <p className="text-sm text-muted-foreground">Pick a deck to goldfish</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-3xl mx-auto">
        {decks.map((d: any) => (
          <button
            key={d.id}
            onClick={() => onPick(d.id)}
            className="text-left px-4 py-4 rounded-xl border-2 border-border hover:border-primary/40 bg-card hover:bg-primary/5 transition-all"
          >
            <div className="font-bold text-sm">{d.name}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{d.format}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Opening hand decision ────────────────────────────────────── */

function OpeningHandView({
  hand,
  mulliganCount,
  onKeep,
  onMulligan,
  onZoom,
  commander,
}: {
  hand: SimCard[];
  mulliganCount: number;
  onKeep: () => void;
  onMulligan: () => void;
  onZoom: (card: SimCard) => void;
  commander: SimCard | null;
}) {
  const handSize = 7 - mulliganCount;
  const mulliganLabel =
    mulliganCount === 0
      ? "Opening 7"
      : mulliganCount === 1
      ? "Mulligan to 6"
      : mulliganCount === 2
      ? "Mulligan to 5"
      : `Mulligan to ${handSize}`;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold text-primary">{mulliganLabel}</h2>
        <p className="text-xs text-muted-foreground">
          {mulliganCount === 0
            ? "Your opening hand — keep or mulligan?"
            : `Drawing ${handSize} cards — keep or go lower?`}
        </p>
      </div>

      {/* Commander zone */}
      {commander && (
        <div className="text-center">
          <div className="text-xs text-muted-foreground mb-1">Command Zone</div>
          <div className="inline-block">
            <CardImage card={commander} onClick={() => onZoom(commander)} />
          </div>
        </div>
      )}

      {/* Hand */}
      <div className="flex flex-wrap justify-center gap-2">
        {hand.map((card, i) => (
          <CardImage key={`${card.name}-${i}`} card={card} onClick={() => onZoom(card)} />
        ))}
      </div>

      {/* Analysis */}
      <div className="max-w-md mx-auto">
        <HandAnalysis cards={hand} />
      </div>

      {/* Keep / Mulligan */}
      <div className="flex justify-center gap-3">
        <Button onClick={onKeep} size="lg" className="px-6 font-bold">
          <Eye className="w-4 h-4 mr-2" />
          Keep
        </Button>
        {handSize > 4 && (
          <Button onClick={onMulligan} variant="outline" size="lg" className="px-6 font-bold">
            <Shuffle className="w-4 h-4 mr-2" />
            Mulligan
          </Button>
        )}
      </div>
    </div>
  );
}

/* ─── Hand analysis ────────────────────────────────────────────── */

function HandAnalysis({ cards }: { cards: SimCard[] }) {
  const analysis = useMemo(() => {
    const lands = cards.filter((c) => c.typeLine.toLowerCase().includes("land"));
    const nonLands = cards.filter((c) => !c.typeLine.toLowerCase().includes("land"));
    const ramp = cards.filter(
      (c) =>
        c.typeLine.toLowerCase().includes("land") === false &&
        (c.oracleText?.toLowerCase().includes("add {") ||
          c.oracleText?.toLowerCase().includes("add one mana") ||
          c.typeLine.toLowerCase().includes("mana dork") ||
          c.name.toLowerCase().includes("signet") ||
          c.name.toLowerCase().includes("sol ring") ||
          c.name.toLowerCase().includes("talisman") ||
          c.name.toLowerCase().includes("mind stone") ||
          c.name.toLowerCase().includes("arcane signet") ||
          c.cmc <= 2 && c.oracleText?.toLowerCase().includes("search your library for a"))
    );
    const cheapPlays = nonLands.filter((c) => c.cmc <= 2);
    const avgCmc = nonLands.length > 0 ? nonLands.reduce((s, c) => s + c.cmc, 0) / nonLands.length : 0;

    const verdicts: { emoji: string; text: string; good: boolean }[] = [];

    if (lands.length === 0) verdicts.push({ emoji: "🚫", text: "No lands — mulligan this", good: false });
    else if (lands.length === 1) verdicts.push({ emoji: "⚠️", text: "Only 1 land — risky keep", good: false });
    else if (lands.length >= 2 && lands.length <= 4)
      verdicts.push({ emoji: "✅", text: `${lands.length} lands — solid`, good: true });
    else if (lands.length >= 5)
      verdicts.push({ emoji: "⚠️", text: `${lands.length} lands — land heavy`, good: false });

    if (ramp.length > 0) verdicts.push({ emoji: "⚡", text: `${ramp.length} ramp piece${ramp.length > 1 ? "s" : ""}`, good: true });
    if (cheapPlays.length >= 2) verdicts.push({ emoji: "🎯", text: `${cheapPlays.length} early plays`, good: true });
    else if (cheapPlays.length === 0 && lands.length < 4) verdicts.push({ emoji: "🐌", text: "No early plays", good: false });

    return { lands: lands.length, nonLands: nonLands.length, avgCmc, ramp: ramp.length, verdicts };
  }, [cards]);

  return (
    <div className="rounded-lg border border-border bg-card/50 p-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
        <span>
          {analysis.lands} land{analysis.lands !== 1 && "s"} · {analysis.nonLands} spell{analysis.nonLands !== 1 && "s"}
        </span>
        <span>Avg CMC: {analysis.avgCmc.toFixed(1)}</span>
      </div>
      <div className="space-y-1">
        {analysis.verdicts.map((v, i) => (
          <div
            key={i}
            className={`text-xs px-2 py-1 rounded ${
              v.good ? "bg-green-500/10 text-green-400" : "bg-amber-500/10 text-amber-400"
            }`}
          >
            {v.emoji} {v.text}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Turn-by-turn play ────────────────────────────────────────── */

function PlayView({
  hand,
  library,
  commander,
  deckName,
  onDraw,
  onReset,
  turnNumber,
  drawnThisTurn,
  onZoom,
  allCards,
}: {
  hand: SimCard[];
  library: SimCard[];
  commander: SimCard | null;
  deckName: string;
  onDraw: () => void;
  onReset: () => void;
  turnNumber: number;
  onZoom: (card: SimCard) => void;
  allCards: SimCard[];
}) {
  const [played, setPlayed] = useState<SimCard[]>([]);
  const [showBattlefield, setShowBattlefield] = useState(true);

  const playCard = (index: number) => {
    const card = hand[index];
    setPlayed((prev) => [...prev, card]);
    // Remove from hand by creating new array without that index
    // We'll handle this via parent state
  };

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <Hand className="w-5 h-5 text-primary shrink-0" />
          <h1 className="text-lg sm:text-xl font-bold text-primary">Goldfishing</h1>
          <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded">
            Turn {turnNumber}
          </span>
          <span className="text-xs text-muted-foreground hidden sm:inline">{deckName}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onDraw} disabled={library.length === 0} className="flex-1 sm:flex-none text-xs">
            <ArrowRight className="w-3.5 h-3.5 mr-1" />
            Draw ({library.length})
          </Button>
          <Button variant="outline" size="sm" onClick={onReset} className="flex-1 sm:flex-none text-xs">
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            New Hand
          </Button>
        </div>
      </div>

      {/* Commander zone */}
      {commander && (
        <div>
          <div className="text-xs text-muted-foreground mb-1">Command Zone</div>
          <div className="inline-block">
            <CardImage card={commander} small onClick={() => onZoom(commander)} />
          </div>
        </div>
      )}

      {/* Hand */}
      <div>
        <div className="text-xs text-muted-foreground mb-1">Hand ({hand.length} cards)</div>
        <div className="flex flex-wrap gap-2">
          {hand.map((card, i) => (
            <CardImage key={`${card.name}-${i}`} card={card} onClick={() => onZoom(card)} />
          ))}
        </div>
        {hand.length === 0 && (
          <div className="text-sm text-muted-foreground italic">Empty hand</div>
        )}
      </div>

      {/* Stats sidebar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <HandAnalysis cards={hand} />
        </div>
        <div className="rounded-lg border border-border bg-card/50 p-3">
          <div className="text-xs text-muted-foreground mb-2">Mana Curve (Full Deck)</div>
          <ManaCurve cards={allCards} />
        </div>
      </div>
    </div>
  );
}

/* ─── Main page ────────────────────────────────────────────────── */

export default function GoldfishPage() {
  const [phase, setPhase] = useState<SimPhase>("pick-deck");
  const [deckId, setDeckId] = useState<number | null>(null);
  const [allCards, setAllCards] = useState<SimCard[]>([]);
  const [library, setLibrary] = useState<SimCard[]>([]);
  const [hand, setHand] = useState<SimCard[]>([]);
  const [commander, setCommander] = useState<SimCard | null>(null);
  const [mulliganCount, setMulliganCount] = useState(0);
  const [turnNumber, setTurnNumber] = useState(1);
  const [zoomedCard, setZoomedCard] = useState<SimCard | null>(null);

  const { data: decks = [] } = useQuery<any[]>({
    queryKey: ["/api/decks"],
  });

  const pickDeck = useCallback(
    async (id: number) => {
      setDeckId(id);
      const res = await apiRequest("GET", `/api/decks/${id}/cards`);
      const cards: any[] = await res.json();

      const simCards: SimCard[] = cards.map((c: any) => ({
        name: c.name,
        imageSmall: c.imageSmall,
        imageNormal: c.imageNormal,
        manaCost: c.manaCost,
        cmc: c.cmc,
        typeLine: c.typeLine,
        isCommander: !!c.isCommander,
        oracleText: c.oracleText,
      }));

      setAllCards(simCards);

      // Separate commander
      const cmd = simCards.find((c) => c.isCommander) || null;
      setCommander(cmd);

      // Library = everything except commander, shuffled
      const deck = shuffle(simCards.filter((c) => !c.isCommander));

      // Draw opening 7
      const openingHand = deck.slice(0, 7);
      const remaining = deck.slice(7);

      setHand(openingHand);
      setLibrary(remaining);
      setMulliganCount(0);
      setPhase("opening-hand");
    },
    []
  );

  const doMulligan = useCallback(() => {
    const newCount = mulliganCount + 1;
    const handSize = 7 - newCount;

    // Re-shuffle everything (except commander) and draw new hand
    const deck = shuffle(allCards.filter((c) => !c.isCommander));
    const newHand = deck.slice(0, handSize);
    const remaining = deck.slice(handSize);

    setHand(newHand);
    setLibrary(remaining);
    setMulliganCount(newCount);
  }, [mulliganCount, allCards]);

  const keepHand = useCallback(() => {
    setTurnNumber(1);
    setPhase("playing");
  }, []);

  const drawCard = useCallback(() => {
    if (library.length === 0) return;
    const [drawn, ...rest] = library;
    setHand((prev) => [...prev, drawn]);
    setLibrary(rest);
    setTurnNumber((t) => t + 1);
  }, [library]);

  const resetToPickDeck = useCallback(() => {
    setPhase("pick-deck");
    setHand([]);
    setLibrary([]);
    setCommander(null);
    setMulliganCount(0);
    setTurnNumber(1);
  }, []);

  const resetSameDeck = useCallback(() => {
    if (deckId) pickDeck(deckId);
  }, [deckId, pickDeck]);

  const deckName = deckId ? decks.find((d: any) => d.id === deckId)?.name || "Deck" : "Deck";

  return (
    <>
      {zoomedCard && <CardZoom card={zoomedCard} onClose={() => setZoomedCard(null)} />}

      {phase === "pick-deck" && <DeckPicker onPick={pickDeck} />}

      {phase === "opening-hand" && (
        <OpeningHandView
          hand={hand}
          mulliganCount={mulliganCount}
          onKeep={keepHand}
          onMulligan={doMulligan}
          onZoom={setZoomedCard}
          commander={commander}
        />
      )}

      {phase === "playing" && (
        <PlayView
          hand={hand}
          library={library}
          commander={commander}
          deckName={deckName}
          onDraw={drawCard}
          onReset={resetSameDeck}
          turnNumber={turnNumber}
          onZoom={setZoomedCard}
          allCards={allCards}
        />
      )}
    </>
  );
}
