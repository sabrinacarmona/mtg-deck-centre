import { useState } from "react";
import { useQuery, useMutation, useQueries } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Swords,
  Plus,
  ChevronDown,
  ChevronUp,
  Trash2,
  Lightbulb,
  AlertTriangle,
  Shield,
  Crosshair,
  Trophy,
  X,
} from "lucide-react";
import { ManaSymbol } from "@/components/ManaSymbols";
import type { Rival } from "@shared/schema";

/* ─── Matchup suggestion logic ────────────────────────────────── */

interface MatchupSuggestion {
  deckName: string;
  reason: string;
  artUrl: string | null;
}

function getMatchupSuggestions(
  rival: Rival,
  userDecks: { name: string; artUrl: string | null; cards: any[] }[]
): MatchupSuggestion[] {
  const suggestions: MatchupSuggestion[] = [];
  const rivalColors = rival.colors.toUpperCase();
  const stratLower = rival.strategy.toLowerCase();
  const threatStr = rival.keyThreats.join(" ").toLowerCase();
  const weakStr = rival.weaknesses.join(" ").toLowerCase();

  for (const deck of userDecks) {
    const deckLower = deck.name.toLowerCase();
    const cardNames = deck.cards.map((c: any) => (c.name || "").toLowerCase());
    const oracleTexts = deck.cards.map((c: any) => (c.oracleText || "").toLowerCase());
    const allText = [...cardNames, ...oracleTexts].join(" ");

    // Artifact-heavy opponent → suggest decks with artifact removal
    if (
      stratLower.includes("artifact") ||
      threatStr.includes("artifact")
    ) {
      if (
        allText.includes("vandalblast") ||
        allText.includes("bane of progress") ||
        allText.includes("collector ouphe") ||
        allText.includes("dismantling wave") ||
        allText.includes("destroy all artifacts")
      ) {
        const reason = allText.includes("vandalblast")
          ? "has Vandalblast to destroy all artifacts"
          : allText.includes("dismantling wave")
          ? "has Dismantling Wave for artifact removal"
          : "has artifact removal to shut down their engine";
        suggestions.push({ deckName: deck.name, reason, artUrl: deck.artUrl });
      }
    }

    // Flying-heavy opponent → suggest board wipes or big flyers
    if (
      stratLower.includes("flying") ||
      stratLower.includes("flyer") ||
      threatStr.includes("flying")
    ) {
      if (
        allText.includes("blasphemous act") ||
        allText.includes("chain reaction") ||
        allText.includes("board wipe") ||
        allText.includes("destroy all creatures")
      ) {
        suggestions.push({
          deckName: deck.name,
          reason: "has board wipes like Blasphemous Act to clear their flyers",
          artUrl: deck.artUrl,
        });
      }
      if (deckLower.includes("draconic") || allText.includes("dragon")) {
        if (!suggestions.find((s) => s.deckName === deck.name)) {
          suggestions.push({
            deckName: deck.name,
            reason: "dragons have flying + fight in the air, Dragon Tempest gives haste to outrace",
            artUrl: deck.artUrl,
          });
        }
      }
    }

    // Creature-heavy opponent → board wipes
    if (
      weakStr.includes("board wipe") ||
      weakStr.includes("creature board presence")
    ) {
      if (
        allText.includes("blasphemous act") ||
        allText.includes("damnation") ||
        allText.includes("wrath")
      ) {
        if (!suggestions.find((s) => s.deckName === deck.name)) {
          suggestions.push({
            deckName: deck.name,
            reason: "has board wipes to punish their creature-heavy strategy",
            artUrl: deck.artUrl,
          });
        }
      }
    }

    // Spellslinger with counterspells
    if (
      stratLower.includes("energy") ||
      stratLower.includes("etb") ||
      threatStr.includes("panharmonicon")
    ) {
      if (allText.includes("counterspell") || allText.includes("counter target")) {
        if (!suggestions.find((s) => s.deckName === deck.name)) {
          suggestions.push({
            deckName: deck.name,
            reason: "has counterspells to stop key combo pieces",
            artUrl: deck.artUrl,
          });
        }
      }
    }
  }

  return suggestions.slice(0, 2);
}

/* ─── Color chip helper ───────────────────────────────────────── */

function ColorPips({ colors }: { colors: string }) {
  const codes = colors.split("").filter((c) => "WUBRG".includes(c.toUpperCase()));
  if (codes.length === 0) return null;
  return (
    <span className="inline-flex items-center gap-0.5">
      {codes.map((c, i) => (
        <ManaSymbol key={i} symbol={c.toUpperCase()} size="sm" />
      ))}
    </span>
  );
}

/* ─── Add Rival Dialog ────────────────────────────────────────── */

function AddRivalDialog({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (rival: Omit<Rival, "id">) => void;
}) {
  const [playerName, setPlayerName] = useState("");
  const [deckName, setDeckName] = useState("");
  const [commander, setCommander] = useState("");
  const [colors, setColors] = useState<Set<string>>(new Set());
  const [strategy, setStrategy] = useState("");
  const [threats, setThreats] = useState("");
  const [weaknesses, setWeaknesses] = useState("");
  const [tips, setTips] = useState("");

  const toggleColor = (c: string) => {
    const next = new Set(colors);
    if (next.has(c)) next.delete(c);
    else next.add(c);
    setColors(next);
  };

  const handleSubmit = () => {
    if (!playerName.trim() || !deckName.trim()) return;
    onSave({
      playerName: playerName.trim(),
      deckName: deckName.trim(),
      commander: commander.trim(),
      colors: Array.from(colors).join(""),
      strategy: strategy.trim(),
      keyThreats: threats
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean),
      weaknesses: weaknesses
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean),
      counterTips: tips
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean),
      notes: "",
    });
  };

  const colorOptions: { code: string; label: string }[] = [
    { code: "W", label: "White" },
    { code: "U", label: "Blue" },
    { code: "B", label: "Black" },
    { code: "R", label: "Red" },
    { code: "G", label: "Green" },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-primary flex items-center gap-2">
            <Swords className="w-5 h-5" />
            Add Opponent Deck
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Player Name *</label>
              <Input
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="e.g. Will"
                className="h-9 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Deck Name *</label>
              <Input
                value={deckName}
                onChange={(e) => setDeckName(e.target.value)}
                placeholder="e.g. First Flight"
                className="h-9 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Commander</label>
            <Input
              value={commander}
              onChange={(e) => setCommander(e.target.value)}
              placeholder="e.g. Isperia, Supreme Judge"
              className="h-9 text-sm"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Colors</label>
            <div className="flex gap-2">
              {colorOptions.map((c) => (
                <button
                  key={c.code}
                  onClick={() => toggleColor(c.code)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                    colors.has(c.code)
                      ? "border-primary/50 bg-primary/15 text-primary"
                      : "border-border bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <ManaSymbol symbol={c.code} size="sm" />
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Strategy Overview</label>
            <textarea
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              placeholder="Describe the deck's gameplan..."
              className="w-full h-20 rounded-lg border border-border bg-card px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Key Threats (one per line)
            </label>
            <textarea
              value={threats}
              onChange={(e) => setThreats(e.target.value)}
              placeholder={"Card Name — Description\nCard Name — Description"}
              className="w-full h-20 rounded-lg border border-border bg-card px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Weaknesses (one per line)
            </label>
            <textarea
              value={weaknesses}
              onChange={(e) => setWeaknesses(e.target.value)}
              placeholder={"Weak to board wipes\nNo graveyard recursion"}
              className="w-full h-20 rounded-lg border border-border bg-card px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              Counter-Tips (one per line)
            </label>
            <textarea
              value={tips}
              onChange={(e) => setTips(e.target.value)}
              placeholder={"Kill their commander on sight\nSave removal for key pieces"}
              className="w-full h-20 rounded-lg border border-border bg-card px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} className="h-9 text-sm">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!playerName.trim() || !deckName.trim()}
            className="h-9 text-sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Rival
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Rival Card (expandable) ─────────────────────────────────── */

function RivalCard({
  rival,
  matchups,
  onDelete,
  onUpdateNotes,
}: {
  rival: Rival;
  matchups: MatchupSuggestion[];
  onDelete: () => void;
  onUpdateNotes: (notes: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState(rival.notes || "");
  const [notesEdited, setNotesEdited] = useState(false);

  return (
    <div className="rounded-xl border border-red-500/20 bg-gradient-to-br from-card to-red-950/10 overflow-hidden">
      {/* Header — always visible */}
      <button
        className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-red-500/5 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="w-9 h-9 rounded-full bg-red-500/15 flex items-center justify-center shrink-0">
          <Swords className="w-4 h-4 text-red-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-sm">{rival.playerName}</span>
            <span className="text-muted-foreground text-xs">—</span>
            <span className="text-sm text-foreground/80">{rival.deckName}</span>
            <ColorPips colors={rival.colors} />
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {rival.commander}
          </p>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-red-500/10">
          {/* Strategy */}
          <div className="pt-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
              <Crosshair className="w-3 h-3" />
              Strategy
            </h4>
            <p className="text-sm text-foreground/80 leading-relaxed">{rival.strategy}</p>
          </div>

          {/* Key Threats */}
          {rival.keyThreats.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-red-400/80 mb-1.5 flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3" />
                Key Threats
              </h4>
              <ul className="space-y-1">
                {rival.keyThreats.map((t, i) => (
                  <li key={i} className="text-xs text-foreground/70 flex items-start gap-2">
                    <span className="text-red-400/60 mt-0.5">&#9679;</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Weaknesses */}
          {rival.weaknesses.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400/80 mb-1.5 flex items-center gap-1.5">
                <Shield className="w-3 h-3" />
                Weaknesses
              </h4>
              <ul className="space-y-1">
                {rival.weaknesses.map((w, i) => (
                  <li key={i} className="text-xs text-foreground/70 flex items-start gap-2">
                    <span className="text-amber-400/60 mt-0.5">&#9679;</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Counter-Tips */}
          {rival.counterTips.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-1.5 flex items-center gap-1.5">
                <Lightbulb className="w-3 h-3" />
                Counter-Strategy Tips
              </h4>
              <div className="space-y-1.5">
                {rival.counterTips.map((tip, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 text-xs bg-primary/5 border border-primary/15 rounded-lg px-2.5 py-1.5"
                  >
                    <Crosshair className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                    <span className="text-foreground/80">{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Best Matchup */}
          {matchups.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-green-400/80 mb-1.5 flex items-center gap-1.5">
                <Trophy className="w-3 h-3" />
                Best Matchup From Your Decks
              </h4>
              <div className="space-y-2">
                {matchups.map((m, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 bg-green-500/5 border border-green-500/15 rounded-lg p-2.5"
                  >
                    {m.artUrl && (
                      <img
                        src={m.artUrl}
                        alt={m.deckName}
                        className="w-10 h-14 object-cover object-top rounded"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-green-400">{m.deckName}</p>
                      <p className="text-xs text-foreground/60">{m.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
              Notes
            </h4>
            <textarea
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                setNotesEdited(true);
              }}
              onBlur={() => {
                if (notesEdited) {
                  onUpdateNotes(notes);
                  setNotesEdited(false);
                }
              }}
              placeholder="Add your notes about this matchup..."
              className="w-full h-16 rounded-lg border border-border bg-card/50 px-3 py-2 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Delete button */}
          <div className="flex justify-end">
            <button
              onClick={onDelete}
              className="flex items-center gap-1.5 text-xs text-red-400/70 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remove Rival
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────── */

export default function RivalsPage() {
  const [showAdd, setShowAdd] = useState(false);
  const { toast } = useToast();

  const { data: rivals = [] } = useQuery<Rival[]>({
    queryKey: ["/api/rivals"],
  });

  // Load user decks + their cards for matchup suggestions
  const { data: userDecks = [] } = useQuery<any[]>({
    queryKey: ["/api/decks"],
  });

  const deckCardQueries = useQueries({
    queries: userDecks.map((d: any) => ({
      queryKey: ["/api/decks", String(d.id), "cards"],
      enabled: !!d.id,
    })),
  });

  const userDecksWithCards = userDecks.map((d: any, i: number) => {
    const cards = (deckCardQueries[i]?.data as any[]) || [];
    const commander = cards.find((c: any) => c.isCommander);
    const artCard = commander || cards[0];
    return {
      name: d.name,
      artUrl: artCard?.imageNormal || artCard?.imageSmall || null,
      cards,
    };
  });

  const addMutation = useMutation({
    mutationFn: async (rival: Omit<Rival, "id">) => {
      const res = await apiRequest("POST", "/api/rivals", rival);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rivals"] });
      setShowAdd(false);
      toast({ title: "Rival added", description: "Opponent deck has been tracked." });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/rivals/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rivals"] });
      toast({ title: "Rival removed" });
    },
  });

  const updateNotesMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes: string }) => {
      await apiRequest("PATCH", `/api/rivals/${id}`, { notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rivals"] });
    },
  });

  return (
    <div className="space-y-6" data-testid="rivals-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-500/15 flex items-center justify-center">
            <Swords className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold">Rivals & Counter-Strategy</h1>
            <p className="text-xs text-muted-foreground">
              Track opponent decks and plan how to beat them
            </p>
          </div>
        </div>
        <Button onClick={() => setShowAdd(true)} className="h-9 text-sm">
          <Plus className="w-4 h-4 mr-1" />
          Add Opponent
        </Button>
      </div>

      {/* Rival list */}
      {rivals.length === 0 ? (
        <div className="card-frame p-8 text-center space-y-2">
          <Swords className="w-8 h-8 text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">
            No opponent decks tracked yet. Add a rival to start planning counter-strategies.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rivals.map((rival) => (
            <RivalCard
              key={rival.id}
              rival={rival}
              matchups={getMatchupSuggestions(rival, userDecksWithCards)}
              onDelete={() => rival.id && deleteMutation.mutate(rival.id)}
              onUpdateNotes={(notes) =>
                rival.id && updateNotesMutation.mutate({ id: rival.id, notes })
              }
            />
          ))}
        </div>
      )}

      {/* Add dialog */}
      {showAdd && (
        <AddRivalDialog
          onClose={() => setShowAdd(false)}
          onSave={(rival) => addMutation.mutate(rival)}
        />
      )}
    </div>
  );
}
