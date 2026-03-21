import { useState, useCallback, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Gamepad2,
  Plus,
  Minus,
  RotateCcw,
  Dices,
  Coins,
  Skull,
  Zap,
  FlaskConical,
  Shield,
  Crown,
  ChevronDown,
  ChevronUp,
  X,
  Trophy,
  History,
} from "lucide-react";
import { ManaSymbol } from "@/components/ManaSymbols";

/* ─── Types ────────────────────────────────────────────────────── */

interface Player {
  name: string;
  deckName: string;
  commander: string;
  colors: string;
  life: number;
  commanderDamage: Record<string, number>; // keyed by opponent commander name
  poisonCounters: number;
  energyCounters: number;
  experienceCounters: number;
}

interface DiceRoll {
  sides: number;
  result: number;
  timestamp: number;
}

interface CoinFlip {
  result: "heads" | "tails";
  timestamp: number;
}

type GamePhase = "setup" | "playing" | "finished";

/* ─── Constants ────────────────────────────────────────────────── */

const STARTING_LIFE = 40;
const COMMANDER_DAMAGE_LETHAL = 21;
const POISON_LETHAL = 10;
const LIFE_INCREMENTS = [1, 5, 10];
const DICE_OPTIONS = [4, 6, 8, 10, 12, 20, 100];

/* ─── Utility ──────────────────────────────────────────────────── */

function getColorSymbols(colors: string): string[] {
  const map: Record<string, string> = { W: "W", U: "U", B: "B", R: "R", G: "G" };
  return colors.split("").filter((c) => map[c]).map((c) => map[c]);
}

/* ─── Components ───────────────────────────────────────────────── */

function LifeCounter({
  value,
  onChange,
  label,
  icon: Icon,
  color = "primary",
  lethalAt,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
  icon: React.ElementType;
  color?: string;
  lethalAt?: number;
}) {
  const isLethal = lethalAt !== undefined && value >= lethalAt;
  const holdTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const startHold = (delta: number) => {
    onChange(value + delta);
    holdTimer.current = setInterval(() => {
      onChange((prev: number) => prev + delta);
    }, 150);
  };

  const stopHold = () => {
    if (holdTimer.current) {
      clearInterval(holdTimer.current);
      holdTimer.current = null;
    }
  };

  // Because onChange with prev won't work outside state, we use a simpler hold
  useEffect(() => () => stopHold(), []);

  return (
    <div className={`flex items-center gap-2 ${isLethal ? "animate-pulse" : ""}`}>
      <div className="flex items-center gap-1.5 min-w-[100px]">
        <Icon className={`w-4 h-4 ${isLethal ? "text-red-500" : "text-muted-foreground"}`} />
        <span className={`text-xs font-medium ${isLethal ? "text-red-500" : "text-muted-foreground"}`}>
          {label}
          {isLethal && " ☠"}
        </span>
      </div>
      <button
        className="w-7 h-7 rounded-md bg-muted hover:bg-muted/80 flex items-center justify-center text-foreground transition-colors"
        onClick={() => onChange(Math.max(0, value - 1))}
      >
        <Minus className="w-3.5 h-3.5" />
      </button>
      <span
        className={`w-10 text-center font-mono font-bold text-lg ${
          isLethal ? "text-red-500" : "text-foreground"
        }`}
      >
        {value}
      </span>
      <button
        className="w-7 h-7 rounded-md bg-muted hover:bg-muted/80 flex items-center justify-center text-foreground transition-colors"
        onClick={() => onChange(value + 1)}
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function PlayerCard({
  player,
  opponent,
  onUpdate,
  isActive,
}: {
  player: Player;
  opponent: Player;
  onUpdate: (updates: Partial<Player>) => void;
  isActive: boolean;
}) {
  const [showCounters, setShowCounters] = useState(false);
  const colorSymbols = getColorSymbols(player.colors);
  const isLifeLethal = player.life <= 0;
  const isPoisonLethal = player.poisonCounters >= POISON_LETHAL;
  const cmdDmgFromOpponent = player.commanderDamage[opponent.commander] || 0;
  const isCmdLethal = cmdDmgFromOpponent >= COMMANDER_DAMAGE_LETHAL;
  const isDead = isLifeLethal || isPoisonLethal || isCmdLethal;

  return (
    <div
      className={`rounded-xl border-2 transition-all ${
        isDead
          ? "border-red-500/60 bg-red-950/10"
          : isActive
          ? "border-primary/60 bg-card shadow-lg shadow-primary/10"
          : "border-border bg-card"
      }`}
    >
      {/* Player header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className={`w-4 h-4 ${isDead ? "text-red-500" : "text-primary"}`} />
            <h3 className="font-bold text-lg">{player.name}</h3>
            {isDead && (
              <span className="text-xs font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded">
                ELIMINATED
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {colorSymbols.map((s, i) => (
              <ManaSymbol key={i} symbol={s} size={18} />
            ))}
          </div>
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {player.deckName} — {player.commander}
        </div>
      </div>

      {/* Life total — BIG */}
      <div className="p-6 flex items-center justify-center gap-4">
        <div className="flex gap-1">
          {LIFE_INCREMENTS.reverse().map((inc) => (
            <button
              key={`minus-${inc}`}
              className="px-2.5 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-sm transition-colors"
              onClick={() => onUpdate({ life: player.life - inc })}
            >
              -{inc}
            </button>
          ))}
        </div>
        <div className="text-center min-w-[80px]">
          <div
            className={`text-5xl font-mono font-black tracking-tight ${
              isDead ? "text-red-500" : player.life <= 10 ? "text-amber-500" : "text-foreground"
            }`}
          >
            {player.life}
          </div>
          <div className="text-xs text-muted-foreground mt-1">Life</div>
        </div>
        <div className="flex gap-1">
          {[...LIFE_INCREMENTS].reverse().map((inc) => (
            <button
              key={`plus-${inc}`}
              className="px-2.5 py-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 font-bold text-sm transition-colors"
              onClick={() => onUpdate({ life: player.life + inc })}
            >
              +{inc}
            </button>
          ))}
        </div>
      </div>

      {/* Commander damage from opponent */}
      <div className="px-4 pb-3">
        <LifeCounter
          value={cmdDmgFromOpponent}
          onChange={(v) =>
            onUpdate({
              commanderDamage: { ...player.commanderDamage, [opponent.commander]: v },
            })
          }
          label={`Cmd dmg (${opponent.commander.split(",")[0]})`}
          icon={Skull}
          lethalAt={COMMANDER_DAMAGE_LETHAL}
        />
      </div>

      {/* Expandable counters */}
      <div className="px-4 pb-4">
        <button
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors mb-2"
          onClick={() => setShowCounters(!showCounters)}
        >
          {showCounters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          Counters
        </button>
        {showCounters && (
          <div className="space-y-2">
            <LifeCounter
              value={player.poisonCounters}
              onChange={(v) => onUpdate({ poisonCounters: v })}
              label="Poison"
              icon={FlaskConical}
              lethalAt={POISON_LETHAL}
            />
            <LifeCounter
              value={player.energyCounters}
              onChange={(v) => onUpdate({ energyCounters: v })}
              label="Energy"
              icon={Zap}
            />
            <LifeCounter
              value={player.experienceCounters}
              onChange={(v) => onUpdate({ experienceCounters: v })}
              label="Experience"
              icon={Shield}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function DiceRoller() {
  const [rolls, setRolls] = useState<DiceRoll[]>([]);
  const [flips, setFlips] = useState<CoinFlip[]>([]);
  const [rolling, setRolling] = useState(false);

  const rollDice = (sides: number) => {
    setRolling(true);
    setTimeout(() => {
      const result = Math.floor(Math.random() * sides) + 1;
      setRolls((prev) => [{ sides, result, timestamp: Date.now() }, ...prev.slice(0, 9)]);
      setRolling(false);
    }, 300);
  };

  const flipCoin = () => {
    setRolling(true);
    setTimeout(() => {
      const result = Math.random() < 0.5 ? "heads" : "tails";
      setFlips((prev) => [{ result, timestamp: Date.now() } as CoinFlip, ...prev.slice(0, 9)]);
      setRolling(false);
    }, 300);
  };

  return (
    <div className="rounded-xl border-2 border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Dices className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-sm">Dice & Coins</h3>
      </div>

      {/* Dice buttons */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {DICE_OPTIONS.map((sides) => (
          <button
            key={sides}
            onClick={() => rollDice(sides)}
            disabled={rolling}
            className="px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs transition-all disabled:opacity-50"
          >
            d{sides}
          </button>
        ))}
        <button
          onClick={flipCoin}
          disabled={rolling}
          className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 font-bold text-xs transition-all disabled:opacity-50 flex items-center gap-1"
        >
          <Coins className="w-3.5 h-3.5" />
          Flip
        </button>
      </div>

      {/* Results */}
      {(rolls.length > 0 || flips.length > 0) && (
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {[
            ...rolls.map((r) => ({
              type: "dice" as const,
              text: `d${r.sides} → ${r.result}`,
              ts: r.timestamp,
              highlight: r.result === r.sides,
            })),
            ...flips.map((f) => ({
              type: "coin" as const,
              text: `Coin → ${f.result}`,
              ts: f.timestamp,
              highlight: false,
            })),
          ]
            .sort((a, b) => b.ts - a.ts)
            .slice(0, 8)
            .map((entry, i) => (
              <div
                key={entry.ts + i}
                className={`text-xs font-mono px-2 py-1 rounded ${
                  i === 0
                    ? entry.highlight
                      ? "bg-green-500/10 text-green-400 font-bold"
                      : "bg-primary/10 text-primary font-bold"
                    : "text-muted-foreground"
                }`}
              >
                {entry.text}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

/* ─── Setup screen ─────────────────────────────────────────────── */

function GameSetup({
  onStart,
}: {
  onStart: (p1: Player, p2: Player) => void;
}) {
  const { data: decks = [] } = useQuery<any[]>({
    queryKey: ["/api/decks"],
  });

  // Fetch deck cards for each deck to find commander
  const deckCardQueries = useQuery({
    queryKey: ["/api/deck-cards-all", decks.map((d: any) => d.id).join(",")],
    queryFn: async () => {
      const results: Record<number, any[]> = {};
      for (const deck of decks) {
        const res = await apiRequest("GET", `/api/decks/${deck.id}/cards`);
        results[deck.id] = await res.json();
      }
      return results;
    },
    enabled: decks.length > 0,
  });

  const allDeckCards = deckCardQueries.data || {};

  const getCommander = (deckId: number): string => {
    const cards = allDeckCards[deckId] || [];
    const cmd = cards.find((c: any) => c.isCommander);
    return cmd?.name || "Unknown Commander";
  };

  const getColors = (deckId: number): string => {
    const cards = allDeckCards[deckId] || [];
    const cmd = cards.find((c: any) => c.isCommander);
    return cmd?.colorIdentity || "";
  };

  // Separate user decks vs Will's decks
  const userDecks = decks.filter((d: any) => !d.name.startsWith("Will's"));
  const willDecks = decks.filter((d: any) => d.name.startsWith("Will's"));

  const [p1Deck, setP1Deck] = useState<number | null>(null);
  const [p2Deck, setP2Deck] = useState<number | null>(null);
  const [p2Name, setP2Name] = useState("Will");

  const canStart = p1Deck !== null && p2Deck !== null;

  const handleStart = () => {
    if (!canStart) return;
    const d1 = decks.find((d: any) => d.id === p1Deck)!;
    const d2 = decks.find((d: any) => d.id === p2Deck)!;

    onStart(
      {
        name: "Sabrina",
        deckName: d1.name,
        commander: getCommander(d1.id),
        colors: getColors(d1.id),
        life: STARTING_LIFE,
        commanderDamage: {},
        poisonCounters: 0,
        energyCounters: 0,
        experienceCounters: 0,
      },
      {
        name: p2Name || "Opponent",
        deckName: d2.name,
        commander: getCommander(d2.id),
        colors: getColors(d2.id),
        life: STARTING_LIFE,
        commanderDamage: {},
        poisonCounters: 0,
        energyCounters: 0,
        experienceCounters: 0,
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
          <Gamepad2 className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-primary">Game Night</h1>
        <p className="text-sm text-muted-foreground">Pick your decks and start tracking</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {/* Player 1 — Sabrina */}
        <div className="rounded-xl border-2 border-primary/30 bg-card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-primary" />
            <h2 className="font-bold">Sabrina</h2>
          </div>
          <div className="space-y-2">
            {userDecks.map((d: any) => (
              <button
                key={d.id}
                onClick={() => setP1Deck(d.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all text-sm ${
                  p1Deck === d.id
                    ? "border-primary bg-primary/10 text-primary font-semibold"
                    : "border-border hover:border-primary/30 text-foreground"
                }`}
              >
                <div className="font-medium">{d.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{getCommander(d.id)}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Player 2 — Opponent */}
        <div className="rounded-xl border-2 border-border bg-card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Skull className="w-4 h-4 text-muted-foreground" />
            <input
              value={p2Name}
              onChange={(e) => setP2Name(e.target.value)}
              className="font-bold bg-transparent border-none outline-none text-foreground w-full"
              placeholder="Opponent name"
            />
          </div>
          <div className="space-y-2">
            {willDecks.length > 0 && (
              <div className="text-xs text-muted-foreground mb-1">Will's decks</div>
            )}
            {willDecks.map((d: any) => (
              <button
                key={d.id}
                onClick={() => setP2Deck(d.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all text-sm ${
                  p2Deck === d.id
                    ? "border-primary bg-primary/10 text-primary font-semibold"
                    : "border-border hover:border-primary/30 text-foreground"
                }`}
              >
                <div className="font-medium">{d.name.replace("Will's ", "")}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{getCommander(d.id)}</div>
              </button>
            ))}
            {userDecks.length > 0 && (
              <>
                <div className="text-xs text-muted-foreground mt-2 mb-1">Your decks</div>
                {userDecks.map((d: any) => (
                  <button
                    key={d.id}
                    onClick={() => setP2Deck(d.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all text-sm ${
                      p2Deck === d.id
                        ? "border-primary bg-primary/10 text-primary font-semibold"
                        : "border-border hover:border-primary/30 text-foreground"
                    }`}
                  >
                    <div className="font-medium">{d.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{getCommander(d.id)}</div>
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="text-center">
        <Button
          onClick={handleStart}
          disabled={!canStart}
          className="px-8 py-3 text-base font-bold"
          size="lg"
        >
          <Gamepad2 className="w-5 h-5 mr-2" />
          Start Game
        </Button>
      </div>
    </div>
  );
}

/* ─── Game screen ──────────────────────────────────────────────── */

function GamePlaying({
  p1,
  p2,
  onUpdateP1,
  onUpdateP2,
  onReset,
  onEnd,
  turnCount,
  onNextTurn,
}: {
  p1: Player;
  p2: Player;
  onUpdateP1: (u: Partial<Player>) => void;
  onUpdateP2: (u: Partial<Player>) => void;
  onReset: () => void;
  onEnd: (winner: string) => void;
  turnCount: number;
  onNextTurn: () => void;
}) {
  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Gamepad2 className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold text-primary">Game Night</h1>
          <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded">
            Turn {turnCount}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onNextTurn}>
            Next Turn
          </Button>
          <Button variant="outline" size="sm" onClick={onReset}>
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            Reset
          </Button>
        </div>
      </div>

      {/* Player panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PlayerCard player={p1} opponent={p2} onUpdate={onUpdateP1} isActive={turnCount % 2 === 1} />
        <PlayerCard player={p2} opponent={p1} onUpdate={onUpdateP2} isActive={turnCount % 2 === 0} />
      </div>

      {/* Dice and utilities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DiceRoller />

        {/* Quick actions */}
        <div className="rounded-xl border-2 border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">End Game</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onEnd(p1.name)}
              className="px-3 py-3 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 font-bold text-sm transition-all border border-green-500/20"
            >
              🏆 {p1.name} Wins
            </button>
            <button
              onClick={() => onEnd(p2.name)}
              className="px-3 py-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-sm transition-all border border-red-500/20"
            >
              🏆 {p2.name} Wins
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Game Over screen ─────────────────────────────────────────── */

function GameOver({
  winner,
  turnCount,
  p1,
  p2,
  onNewGame,
}: {
  winner: string;
  turnCount: number;
  p1: Player;
  p2: Player;
  onNewGame: () => void;
}) {
  return (
    <div className="text-center space-y-6 py-10">
      <div className="w-20 h-20 mx-auto rounded-full bg-primary/20 flex items-center justify-center gold-glow">
        <Trophy className="w-10 h-10 text-primary" />
      </div>
      <div>
        <h1 className="text-3xl font-black text-primary">{winner} Wins!</h1>
        <p className="text-muted-foreground mt-2">
          Game ended on Turn {turnCount}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <div className="text-sm text-muted-foreground">{p1.name}</div>
          <div className="text-2xl font-mono font-bold mt-1">{p1.life}</div>
          <div className="text-xs text-muted-foreground">life remaining</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <div className="text-sm text-muted-foreground">{p2.name}</div>
          <div className="text-2xl font-mono font-bold mt-1">{p2.life}</div>
          <div className="text-xs text-muted-foreground">life remaining</div>
        </div>
      </div>

      <Button onClick={onNewGame} size="lg" className="px-8 font-bold">
        <RotateCcw className="w-4 h-4 mr-2" />
        New Game
      </Button>
    </div>
  );
}

/* ─── Main page ────────────────────────────────────────────────── */

export default function GameNightPage() {
  const [phase, setPhase] = useState<GamePhase>("setup");
  const [p1, setP1] = useState<Player | null>(null);
  const [p2, setP2] = useState<Player | null>(null);
  const [turnCount, setTurnCount] = useState(1);
  const [winner, setWinner] = useState<string | null>(null);

  const handleStart = (player1: Player, player2: Player) => {
    setP1(player1);
    setP2(player2);
    setTurnCount(1);
    setPhase("playing");
  };

  const updateP1 = useCallback((updates: Partial<Player>) => {
    setP1((prev) => (prev ? { ...prev, ...updates } : prev));
  }, []);

  const updateP2 = useCallback((updates: Partial<Player>) => {
    setP2((prev) => (prev ? { ...prev, ...updates } : prev));
  }, []);

  const handleReset = () => {
    if (p1 && p2) {
      setP1({
        ...p1,
        life: STARTING_LIFE,
        commanderDamage: {},
        poisonCounters: 0,
        energyCounters: 0,
        experienceCounters: 0,
      });
      setP2({
        ...p2,
        life: STARTING_LIFE,
        commanderDamage: {},
        poisonCounters: 0,
        energyCounters: 0,
        experienceCounters: 0,
      });
      setTurnCount(1);
    }
  };

  const handleEnd = (winnerName: string) => {
    setWinner(winnerName);
    setPhase("finished");
  };

  const handleNewGame = () => {
    setP1(null);
    setP2(null);
    setTurnCount(1);
    setWinner(null);
    setPhase("setup");
  };

  if (phase === "setup") {
    return <GameSetup onStart={handleStart} />;
  }

  if (phase === "finished" && p1 && p2 && winner) {
    return <GameOver winner={winner} turnCount={turnCount} p1={p1} p2={p2} onNewGame={handleNewGame} />;
  }

  if (phase === "playing" && p1 && p2) {
    return (
      <GamePlaying
        p1={p1}
        p2={p2}
        onUpdateP1={updateP1}
        onUpdateP2={updateP2}
        onReset={handleReset}
        onEnd={handleEnd}
        turnCount={turnCount}
        onNextTurn={() => setTurnCount((t) => t + 1)}
      />
    );
  }

  return null;
}
