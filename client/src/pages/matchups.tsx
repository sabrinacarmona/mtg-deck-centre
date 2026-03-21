import { useState } from "react";
import { useQuery, useQueries, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Trophy,
  TrendingUp,
  Calendar,
  Plus,
  BarChart3,
  Trash2,
  X,
} from "lucide-react";
import type { Rival } from "@/lib/db";

interface GameHistoryEntry {
  id: number;
  deckId: number;
  date: string;
  opponent: string;
  result: "win" | "loss" | "draw";
  notes: string;
}

interface DeckInfo {
  id: number;
  name: string;
  format: string;
}

/* ─── Log Game Dialog ──────────────────────────────────────────── */

function LogGameDialog({
  decks,
  rivals,
  onClose,
  onSubmit,
}: {
  decks: DeckInfo[];
  rivals: Rival[];
  onClose: () => void;
  onSubmit: (deckId: number, entry: { date: string; opponent: string; result: "win" | "loss" | "draw"; notes: string }) => void;
}) {
  const [deckId, setDeckId] = useState(decks[0]?.id || 0);
  const [opponent, setOpponent] = useState("");
  const [result, setResult] = useState<"win" | "loss" | "draw">("win");
  const [notes, setNotes] = useState("");

  const opponentOptions = rivals.map((r) => `${r.playerName} — ${r.deckName}`);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-md p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-primary flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Log Game Result
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Your Deck</label>
            <select
              value={deckId}
              onChange={(e) => setDeckId(Number(e.target.value))}
              className="w-full h-9 rounded-lg border border-border bg-card px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {decks.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Opponent Deck</label>
            <Input
              value={opponent}
              onChange={(e) => setOpponent(e.target.value)}
              placeholder="e.g. Will — First Flight"
              className="h-9 text-sm"
              list="opponent-suggestions"
            />
            <datalist id="opponent-suggestions">
              {opponentOptions.map((o) => (
                <option key={o} value={o} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Result</label>
            <div className="flex gap-2">
              {(["win", "loss", "draw"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setResult(r)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    result === r
                      ? r === "win"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : r === "loss"
                        ? "bg-red-500/20 text-red-400 border border-red-500/30"
                        : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                      : "bg-muted text-muted-foreground border border-transparent"
                  }`}
                >
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How did it go? What worked?"
              className="w-full h-16 rounded-lg border border-border bg-card px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} className="h-9 text-sm">
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (!opponent.trim() || !deckId) return;
              onSubmit(deckId, {
                date: new Date().toISOString().split("T")[0],
                opponent: opponent.trim(),
                result,
                notes: notes.trim(),
              });
            }}
            disabled={!opponent.trim() || !deckId}
            className="h-9 text-sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            Log Game
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Page ─────────────────────────────────────────────────────── */

export default function MatchupsPage() {
  const [showLog, setShowLog] = useState(false);
  const { toast } = useToast();

  const { data: decks = [] } = useQuery<DeckInfo[]>({
    queryKey: ["/api/decks"],
  });

  const { data: rivals = [] } = useQuery<Rival[]>({
    queryKey: ["/api/rivals"],
  });

  // Load game history for ALL decks
  const historyQueries = useQueries({
    queries: decks.map((d) => ({
      queryKey: ["/api/decks", String(d.id), "history"],
      enabled: !!d.id,
    })),
  });

  // Flatten all history entries with deck info
  const allGames: (GameHistoryEntry & { deckName: string })[] = [];
  decks.forEach((d, i) => {
    const data = historyQueries[i]?.data as GameHistoryEntry[] | undefined;
    if (data) {
      for (const entry of data) {
        allGames.push({ ...entry, deckName: d.name });
      }
    }
  });

  // Sort newest first
  allGames.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const logMutation = useMutation({
    mutationFn: async ({
      deckId,
      entry,
    }: {
      deckId: number;
      entry: { date: string; opponent: string; result: "win" | "loss" | "draw"; notes: string };
    }) => {
      const res = await apiRequest("POST", `/api/decks/${deckId}/history`, entry);
      return res.json();
    },
    onSuccess: () => {
      // Invalidate all history queries
      for (const d of decks) {
        queryClient.invalidateQueries({
          queryKey: ["/api/decks", String(d.id), "history"],
        });
      }
      setShowLog(false);
      toast({ title: "Game logged!" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/game-history/${id}`);
    },
    onSuccess: () => {
      for (const d of decks) {
        queryClient.invalidateQueries({
          queryKey: ["/api/decks", String(d.id), "history"],
        });
      }
    },
  });

  // Stats
  const wins = allGames.filter((g) => g.result === "win").length;
  const losses = allGames.filter((g) => g.result === "loss").length;
  const draws = allGames.filter((g) => g.result === "draw").length;
  const totalGames = allGames.length;
  const winRate = totalGames > 0 ? ((wins / totalGames) * 100).toFixed(0) : "—";

  // Per-deck stats
  const deckStats = decks.map((d) => {
    const games = allGames.filter((g) => g.deckName === d.name);
    const w = games.filter((g) => g.result === "win").length;
    const l = games.filter((g) => g.result === "loss").length;
    const dr = games.filter((g) => g.result === "draw").length;
    return { name: d.name, wins: w, losses: l, draws: dr, total: games.length };
  }).filter((s) => s.total > 0);

  // Matchup stats (your deck vs opponent)
  const matchupMap = new Map<string, { wins: number; losses: number; draws: number }>();
  for (const g of allGames) {
    const key = `${g.deckName} vs ${g.opponent}`;
    const existing = matchupMap.get(key) || { wins: 0, losses: 0, draws: 0 };
    if (g.result === "win") existing.wins++;
    else if (g.result === "loss") existing.losses++;
    else existing.draws++;
    matchupMap.set(key, existing);
  }
  const matchupStats = Array.from(matchupMap.entries()).map(([key, stats]) => ({
    matchup: key,
    ...stats,
    total: stats.wins + stats.losses + stats.draws,
  }));

  return (
    <div className="space-y-6" data-testid="matchups-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Matchup Tracker</h1>
            <p className="text-xs text-muted-foreground">
              Log games and track your win rates
            </p>
          </div>
        </div>
        <Button
          onClick={() => setShowLog(true)}
          className="h-9 text-sm"
          disabled={decks.length === 0}
        >
          <Plus className="w-4 h-4 mr-1" />
          Log Game
        </Button>
      </div>

      {/* Overall stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card-frame p-3 text-center">
          <Trophy className="w-4 h-4 text-primary mx-auto mb-1" />
          <div className="text-lg font-bold">{winRate}%</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Win Rate</div>
        </div>
        <div className="card-frame p-3 text-center">
          <div className="text-lg font-bold text-emerald-400">{wins}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Wins</div>
        </div>
        <div className="card-frame p-3 text-center">
          <div className="text-lg font-bold text-red-400">{losses}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Losses</div>
        </div>
        <div className="card-frame p-3 text-center">
          <div className="text-lg font-bold text-yellow-400">{draws}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Draws</div>
        </div>
      </div>

      {/* Per-deck breakdown */}
      {deckStats.length > 0 && (
        <div className="card-frame p-4 space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2 border-b border-primary/20 pb-1">
            <TrendingUp className="w-4 h-4 text-primary" />
            Win Rate by Deck
          </h3>
          <div className="space-y-2">
            {deckStats.map((s) => {
              const rate = s.total > 0 ? (s.wins / s.total) * 100 : 0;
              return (
                <div key={s.name} className="flex items-center gap-3">
                  <span className="text-xs font-medium min-w-[120px] truncate">{s.name}</span>
                  <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden flex">
                    {s.wins > 0 && (
                      <div
                        className="h-full bg-emerald-500/60"
                        style={{ width: `${(s.wins / s.total) * 100}%` }}
                      />
                    )}
                    {s.losses > 0 && (
                      <div
                        className="h-full bg-red-500/60"
                        style={{ width: `${(s.losses / s.total) * 100}%` }}
                      />
                    )}
                    {s.draws > 0 && (
                      <div
                        className="h-full bg-yellow-500/60"
                        style={{ width: `${(s.draws / s.total) * 100}%` }}
                      />
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {s.wins}W-{s.losses}L{s.draws > 0 ? `-${s.draws}D` : ""} ({rate.toFixed(0)}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Matchup breakdown */}
      {matchupStats.length > 0 && (
        <div className="card-frame p-4 space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2 border-b border-primary/20 pb-1">
            <BarChart3 className="w-4 h-4 text-primary" />
            Matchup Records
          </h3>
          <div className="space-y-1.5">
            {matchupStats.map((m) => {
              const rate = m.total > 0 ? (m.wins / m.total) * 100 : 0;
              return (
                <div
                  key={m.matchup}
                  className="flex items-center gap-2 text-xs bg-muted/30 rounded-lg px-2.5 py-2"
                >
                  <span className="font-medium flex-1 min-w-0 truncate">{m.matchup}</span>
                  <span className="text-emerald-400 font-semibold">{m.wins}W</span>
                  <span className="text-red-400 font-semibold">{m.losses}L</span>
                  {m.draws > 0 && (
                    <span className="text-yellow-400 font-semibold">{m.draws}D</span>
                  )}
                  <span
                    className={`font-bold ${
                      rate >= 50 ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {rate.toFixed(0)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Game log */}
      <div className="card-frame p-4 space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2 border-b border-primary/20 pb-1">
          <Calendar className="w-4 h-4 text-primary" />
          Game Log ({allGames.length})
        </h3>
        {allGames.length === 0 ? (
          <div className="text-center py-6 space-y-2">
            <Trophy className="w-8 h-8 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">
              No games logged yet. Play a game and log the result!
            </p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
            {allGames.map((g) => (
              <div
                key={`${g.deckId}-${g.id}`}
                className="flex items-center gap-2 text-xs bg-muted/30 rounded-lg px-2.5 py-2"
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                    g.result === "win"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : g.result === "loss"
                      ? "bg-red-500/20 text-red-400"
                      : "bg-yellow-500/20 text-yellow-400"
                  }`}
                >
                  {g.result === "win" ? "W" : g.result === "loss" ? "L" : "D"}
                </span>
                <span className="text-muted-foreground shrink-0">{g.date}</span>
                <span className="font-medium text-primary shrink-0">{g.deckName}</span>
                <span className="text-muted-foreground shrink-0">vs</span>
                <span className="font-medium">{g.opponent}</span>
                {g.notes && (
                  <span className="text-muted-foreground truncate flex-1 ml-1">
                    — {g.notes}
                  </span>
                )}
                <button
                  className="text-muted-foreground hover:text-destructive ml-auto shrink-0"
                  onClick={() => deleteMutation.mutate(g.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Log dialog */}
      {showLog && (
        <LogGameDialog
          decks={decks}
          rivals={rivals}
          onClose={() => setShowLog(false)}
          onSubmit={(deckId, entry) => logMutation.mutate({ deckId, entry })}
        />
      )}
    </div>
  );
}
