import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
  Trophy,
  Users,
} from "lucide-react";
import { ManaSymbol } from "@/components/ManaSymbols";

/* ─── Types ────────────────────────────────────────────────────── */

interface Player {
  id: number; // 0-based index
  name: string;
  deckId: number | null;
  deckName: string;
  commander: string;
  colors: string;
  life: number;
  commanderDamage: Record<string, number>; // keyed by opponent player id
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

const PLAYER_COLORS: Record<number, { border: string; bg: string; text: string; label: string }> = {
  0: { border: "border-amber-500/50", bg: "bg-amber-500/10", text: "text-amber-400", label: "gold" },
  1: { border: "border-red-500/50", bg: "bg-red-500/10", text: "text-red-400", label: "red" },
  2: { border: "border-blue-500/50", bg: "bg-blue-500/10", text: "text-blue-400", label: "blue" },
  3: { border: "border-green-500/50", bg: "bg-green-500/10", text: "text-green-400", label: "green" },
};

const DEFAULT_NAMES = ["Sabrina", "Will", "Player 3", "Player 4"];

/* ─── Utility ──────────────────────────────────────────────────── */

function getColorSymbols(colors: string): string[] {
  const map: Record<string, string> = { W: "W", U: "U", B: "B", R: "R", G: "G" };
  return colors.split("").filter((c) => map[c]).map((c) => map[c]);
}

function makePlayer(id: number, name: string): Player {
  return {
    id,
    name,
    deckId: null,
    deckName: "",
    commander: "",
    colors: "",
    life: STARTING_LIFE,
    commanderDamage: {},
    poisonCounters: 0,
    energyCounters: 0,
    experienceCounters: 0,
  };
}

/* ─── Components ───────────────────────────────────────────────── */

function SmallCounter({
  value,
  onChange,
  label,
  icon: Icon,
  lethalAt,
  color,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
  icon: React.ElementType;
  lethalAt?: number;
  color?: string;
}) {
  const isLethal = lethalAt !== undefined && value >= lethalAt;

  return (
    <div className={`flex items-center gap-2 ${isLethal ? "animate-pulse" : ""}`}>
      <div className="flex items-center gap-1.5 min-w-[100px]">
        <Icon className={`w-4 h-4 ${isLethal ? "text-red-500" : color || "text-muted-foreground"}`} />
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
          isLethal ? "text-red-500" : color || "text-foreground"
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
  allPlayers,
  onUpdate,
  isActive,
}: {
  player: Player;
  allPlayers: Player[];
  onUpdate: (updates: Partial<Player>) => void;
  isActive: boolean;
}) {
  const [showCounters, setShowCounters] = useState(false);
  const colorSymbols = getColorSymbols(player.colors);
  const opponents = allPlayers.filter((p) => p.id !== player.id);
  const pColor = PLAYER_COLORS[player.id] || PLAYER_COLORS[0];

  const isLifeLethal = player.life <= 0;
  const isPoisonLethal = player.poisonCounters >= POISON_LETHAL;
  const isCmdLethal = opponents.some(
    (opp) => (player.commanderDamage[String(opp.id)] || 0) >= COMMANDER_DAMAGE_LETHAL
  );
  const isDead = isLifeLethal || isPoisonLethal || isCmdLethal;

  return (
    <div
      className={`rounded-xl border-2 transition-all ${
        isDead
          ? "border-red-500/60 bg-red-950/10"
          : isActive
          ? `${pColor.border} bg-card shadow-lg`
          : "border-border bg-card"
      }`}
    >
      {/* Player header */}
      <div className="p-3 sm:p-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className={`w-4 h-4 ${isDead ? "text-red-500" : pColor.text}`} />
            <h3 className="font-bold text-lg">{player.name}</h3>
            {isDead && (
              <span className="text-xs font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded">
                ELIMINATED
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {colorSymbols.map((s, i) => (
              <ManaSymbol key={i} symbol={s} size="md" />
            ))}
          </div>
        </div>
        <div className="text-xs text-muted-foreground mt-1 truncate">
          {player.deckName} — {player.commander}
        </div>
      </div>

      {/* Life total — BIG */}
      <div className="p-3 sm:p-5 flex items-center justify-center gap-2 sm:gap-3">
        <div className="flex gap-1">
          {[10, 5, 1].map((inc) => (
            <button
              key={`minus-${inc}`}
              className="px-2 py-1.5 sm:px-2.5 sm:py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-xs sm:text-sm transition-colors"
              onClick={() => onUpdate({ life: player.life - inc })}
            >
              -{inc}
            </button>
          ))}
        </div>
        <div className="text-center min-w-[60px] sm:min-w-[80px]">
          <div
            className={`text-4xl sm:text-5xl font-mono font-black tracking-tight ${
              isDead ? "text-red-500" : player.life <= 10 ? "text-amber-500" : "text-foreground"
            }`}
          >
            {player.life}
          </div>
          <div className="text-[10px] sm:text-xs text-muted-foreground mt-1">Life</div>
        </div>
        <div className="flex gap-1">
          {[1, 5, 10].map((inc) => (
            <button
              key={`plus-${inc}`}
              className="px-2 py-1.5 sm:px-2.5 sm:py-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 font-bold text-xs sm:text-sm transition-colors"
              onClick={() => onUpdate({ life: player.life + inc })}
            >
              +{inc}
            </button>
          ))}
        </div>
      </div>

      {/* Poison counter — always visible */}
      <div className="px-3 sm:px-4 pb-2">
        <div className={`flex items-center gap-2 ${isPoisonLethal ? "animate-pulse" : ""}`}>
          <div className="flex items-center gap-1.5 min-w-[100px]">
            <Skull className={`w-4 h-4 ${isPoisonLethal ? "text-red-500" : "text-green-400"}`} />
            <span className={`text-xs font-medium ${isPoisonLethal ? "text-red-500 font-bold" : "text-green-400"}`}>
              Poison{isPoisonLethal && " ☠"}
            </span>
          </div>
          <button
            className="w-7 h-7 rounded-md bg-muted hover:bg-muted/80 flex items-center justify-center text-foreground transition-colors"
            onClick={() => onUpdate({ poisonCounters: Math.max(0, player.poisonCounters - 1) })}
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span
            className={`w-10 text-center font-mono font-bold text-lg ${
              isPoisonLethal ? "text-red-500" : player.poisonCounters > 0 ? "text-green-400" : "text-muted-foreground"
            }`}
          >
            {player.poisonCounters}
          </span>
          <button
            className="w-7 h-7 rounded-md bg-muted hover:bg-muted/80 flex items-center justify-center text-foreground transition-colors"
            onClick={() => onUpdate({ poisonCounters: player.poisonCounters + 1 })}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        {isPoisonLethal && (
          <div className="mt-1 text-xs font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded text-center animate-pulse">
            POISONED — {player.name} loses!
          </div>
        )}
      </div>

      {/* Commander damage from each opponent */}
      <div className="px-3 sm:px-4 pb-2 space-y-1">
        {opponents.map((opp) => {
          const dmg = player.commanderDamage[String(opp.id)] || 0;
          const oppColor = PLAYER_COLORS[opp.id] || PLAYER_COLORS[0];
          return (
            <SmallCounter
              key={opp.id}
              value={dmg}
              onChange={(v) =>
                onUpdate({
                  commanderDamage: { ...player.commanderDamage, [String(opp.id)]: v },
                })
              }
              label={`Cmd (${opp.commander.split(",")[0].slice(0, 12)})`}
              icon={Shield}
              lethalAt={COMMANDER_DAMAGE_LETHAL}
              color={oppColor.text}
            />
          );
        })}
      </div>

      {/* Expandable extra counters */}
      <div className="px-3 sm:px-4 pb-3">
        <button
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors mb-2"
          onClick={() => setShowCounters(!showCounters)}
        >
          {showCounters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          More Counters
        </button>
        {showCounters && (
          <div className="space-y-2">
            <SmallCounter
              value={player.energyCounters}
              onChange={(v) => onUpdate({ energyCounters: v })}
              label="Energy"
              icon={Zap}
            />
            <SmallCounter
              value={player.experienceCounters}
              onChange={(v) => onUpdate({ experienceCounters: v })}
              label="Experience"
              icon={FlaskConical}
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
  onStart: (players: Player[]) => void;
}) {
  const [playerCount, setPlayerCount] = useState(2);

  const { data: decks = [] } = useQuery<any[]>({
    queryKey: ["/api/decks"],
  });

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

  const allDecks = decks;

  const [selectedDecks, setSelectedDecks] = useState<(number | null)[]>([null, null, null, null]);
  const [playerNames, setPlayerNames] = useState<string[]>(["Sabrina", "Will", "Player 3", "Player 4"]);

  const setDeck = (idx: number, deckId: number | null) => {
    setSelectedDecks((prev) => {
      const next = [...prev];
      next[idx] = deckId;
      return next;
    });
  };

  const setName = (idx: number, name: string) => {
    setPlayerNames((prev) => {
      const next = [...prev];
      next[idx] = name;
      return next;
    });
  };

  const canStart = selectedDecks.slice(0, playerCount).every((d) => d !== null);

  const handleStart = () => {
    if (!canStart) return;
    const players: Player[] = [];
    for (let i = 0; i < playerCount; i++) {
      const deckId = selectedDecks[i]!;
      const deck = decks.find((d: any) => d.id === deckId)!;
      players.push({
        id: i,
        name: playerNames[i] || DEFAULT_NAMES[i],
        deckId,
        deckName: deck.name,
        commander: getCommander(deck.id),
        colors: getColors(deck.id),
        life: STARTING_LIFE,
        commanderDamage: {},
        poisonCounters: 0,
        energyCounters: 0,
        experienceCounters: 0,
      });
    }
    onStart(players);
  };

  const renderDeckPicker = (playerIdx: number) => {
    const isP1 = playerIdx === 0;
    const pColor = PLAYER_COLORS[playerIdx];

    return (
      <div
        key={playerIdx}
        className={`rounded-xl border-2 ${pColor.border} bg-card p-4 sm:p-5 space-y-3`}
      >
        <div className="flex items-center gap-2">
          <Crown className={`w-4 h-4 ${pColor.text}`} />
          {isP1 ? (
            <h2 className="font-bold">Sabrina</h2>
          ) : (
            <input
              value={playerNames[playerIdx]}
              onChange={(e) => setName(playerIdx, e.target.value)}
              className="font-bold bg-transparent border-none outline-none text-foreground w-full"
              placeholder={DEFAULT_NAMES[playerIdx]}
            />
          )}
        </div>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {allDecks.map((d: any) => (
            <button
              key={d.id}
              onClick={() => setDeck(playerIdx, d.id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all text-sm ${
                selectedDecks[playerIdx] === d.id
                  ? `${pColor.border} ${pColor.bg} ${pColor.text} font-semibold`
                  : "border-border hover:border-primary/30 text-foreground"
              }`}
            >
              <div className="font-medium">{d.name}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{getCommander(d.id)}</div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
          <Gamepad2 className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-2xl font-display font-bold text-primary">Game Night</h1>
        <p className="text-sm text-muted-foreground">Pick your decks and start tracking</p>
      </div>

      {/* Player count selector */}
      <div className="flex items-center justify-center gap-2">
        <Users className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">Players:</span>
        {[2, 3, 4].map((n) => (
          <button
            key={n}
            onClick={() => setPlayerCount(n)}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
              playerCount === n
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {n}
          </button>
        ))}
      </div>

      {/* Player deck pickers */}
      <div className={`grid grid-cols-1 ${playerCount <= 2 ? "md:grid-cols-2" : "md:grid-cols-2"} gap-4 sm:gap-6 max-w-4xl mx-auto`}>
        {Array.from({ length: playerCount }, (_, i) => renderDeckPicker(i))}
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

/* ─── Match Timer ──────────────────────────────────────────────── */

function MatchTimer() {
  const [startTime] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Date.now() - startTime);
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const minutes = Math.floor(elapsed / 60000);
  const seconds = Math.floor((elapsed % 60000) / 1000);
  const formatted = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  return (
    <span className="text-xs font-mono text-muted-foreground bg-muted/50 px-2 py-0.5 rounded hidden sm:inline-block">
      {formatted}
    </span>
  );
}

/* ─── Game screen ──────────────────────────────────────────────── */

function GamePlaying({
  players,
  onUpdatePlayer,
  onReset,
  onEnd,
  turnCount,
  onNextTurn,
}: {
  players: Player[];
  onUpdatePlayer: (idx: number, u: Partial<Player>) => void;
  onReset: () => void;
  onEnd: (winner: string) => void;
  turnCount: number;
  onNextTurn: () => void;
}) {
  const activePlayerIdx = (turnCount - 1) % players.length;

  const gridClass =
    players.length === 2
      ? "grid-cols-1 md:grid-cols-2"
      : players.length === 3
      ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
      : "grid-cols-1 md:grid-cols-2";

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3">
          <Gamepad2 className="w-5 h-5 text-primary" />
          <h1 className="text-lg sm:text-xl font-display font-bold text-primary">Game Night</h1>
          <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded">
            Turn {turnCount}
          </span>
          <MatchTimer />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onNextTurn} className="flex-1 sm:flex-none">
            Next Turn
          </Button>
          <Button variant="outline" size="sm" onClick={onReset} className="flex-1 sm:flex-none">
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            Reset
          </Button>
        </div>
      </div>

      {/* Player panels */}
      <div className={`grid ${gridClass} gap-4`}>
        {players.map((player, idx) => (
          <PlayerCard
            key={player.id}
            player={player}
            allPlayers={players}
            onUpdate={(u) => onUpdatePlayer(idx, u)}
            isActive={idx === activePlayerIdx}
          />
        ))}
      </div>

      {/* Dice and end game */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DiceRoller />

        <div className="rounded-xl border-2 border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">End Game</h3>
          </div>
          <div className={`grid ${players.length <= 2 ? "grid-cols-2" : "grid-cols-2"} gap-2`}>
            {players.map((player) => {
              const pColor = PLAYER_COLORS[player.id] || PLAYER_COLORS[0];
              return (
                <button
                  key={player.id}
                  onClick={() => onEnd(player.name)}
                  className={`px-3 py-3 rounded-lg ${pColor.bg} hover:opacity-80 ${pColor.text} font-bold text-sm transition-all border ${pColor.border}`}
                >
                  🏆 {player.name}
                </button>
              );
            })}
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
  players,
  onNewGame,
}: {
  winner: string;
  turnCount: number;
  players: Player[];
  onNewGame: () => void;
}) {
  return (
    <div className="text-center space-y-6 py-10">
      <div className="w-20 h-20 mx-auto rounded-full bg-primary/20 flex items-center justify-center gold-glow">
        <Trophy className="w-10 h-10 text-primary" />
      </div>
      <div>
        <h1 className="text-3xl font-display font-black text-primary">{winner} Wins!</h1>
        <p className="text-muted-foreground mt-2">Game ended on Turn {turnCount}</p>
      </div>

      <div className={`grid ${players.length <= 2 ? "grid-cols-2" : players.length === 3 ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-4"} gap-3 max-w-2xl mx-auto`}>
        {players.map((p) => {
          const pColor = PLAYER_COLORS[p.id] || PLAYER_COLORS[0];
          const isWinner = p.name === winner;
          return (
            <div
              key={p.id}
              className={`rounded-xl border bg-card p-4 text-center ${
                isWinner ? `${pColor.border} ring-2 ring-primary/30` : "border-border"
              }`}
            >
              <div className="text-sm text-muted-foreground">{p.name}</div>
              <div className="text-2xl font-mono font-bold mt-1">{p.life}</div>
              <div className="text-xs text-muted-foreground">life</div>
              {p.poisonCounters > 0 && (
                <div className="text-xs text-green-400 mt-1">☠ {p.poisonCounters} poison</div>
              )}
              {isWinner && <div className="text-xs text-primary font-bold mt-1">Winner!</div>}
            </div>
          );
        })}
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
  const [players, setPlayers] = useState<Player[]>([]);
  const [turnCount, setTurnCount] = useState(1);
  const [winner, setWinner] = useState<string | null>(null);

  const handleStart = (gamePlayers: Player[]) => {
    setPlayers(gamePlayers);
    setTurnCount(1);
    setPhase("playing");
  };

  const updatePlayer = useCallback((idx: number, updates: Partial<Player>) => {
    setPlayers((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...updates };
      return next;
    });
  }, []);

  const handleReset = () => {
    setPlayers((prev) =>
      prev.map((p) => ({
        ...p,
        life: STARTING_LIFE,
        commanderDamage: {},
        poisonCounters: 0,
        energyCounters: 0,
        experienceCounters: 0,
      }))
    );
    setTurnCount(1);
  };

  // Record game result to history for each relevant deck
  const addHistory = useMutation({
    mutationFn: async ({ deckId, entry }: { deckId: number; entry: { date: string; opponent: string; result: "win" | "loss" | "draw"; notes: string } }) => {
      const res = await apiRequest("POST", `/api/decks/${deckId}/history`, entry);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/decks"] });
    },
  });

  const handleEnd = (winnerName: string) => {
    setWinner(winnerName);
    setPhase("finished");

    // Record game history for each player's deck
    const date = new Date().toISOString().split("T")[0];
    for (const player of players) {
      if (!player.deckId) continue;
      const others = players.filter((p) => p.id !== player.id).map((p) => p.name).join(", ");
      const result = player.name === winnerName ? "win" : "loss";
      addHistory.mutate({
        deckId: player.deckId,
        entry: {
          date,
          opponent: others,
          result: result as "win" | "loss" | "draw",
          notes: `Game Night — Turn ${turnCount}`,
        },
      });
    }
  };

  const handleNewGame = () => {
    setPlayers([]);
    setTurnCount(1);
    setWinner(null);
    setPhase("setup");
  };

  if (phase === "setup") {
    return <GameSetup onStart={handleStart} />;
  }

  if (phase === "finished" && players.length > 0 && winner) {
    return <GameOver winner={winner} turnCount={turnCount} players={players} onNewGame={handleNewGame} />;
  }

  if (phase === "playing" && players.length > 0) {
    return (
      <GamePlaying
        players={players}
        onUpdatePlayer={updatePlayer}
        onReset={handleReset}
        onEnd={handleEnd}
        turnCount={turnCount}
        onNextTurn={() => setTurnCount((t) => t + 1)}
      />
    );
  }

  return null;
}
