import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  ClipboardPaste,
  FileText,
  Upload,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import type { ScryfallCard } from "@shared/schema";

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** If provided, imports go to this deck. Otherwise, goes to collection. */
  deckId?: number;
  /** Board for deck imports */
  board?: "main" | "side";
}

interface ParsedLine {
  quantity: number;
  name: string;
  set?: string;
}

interface ImportResult {
  added: number;
  failed: string[];
  notFound: string[];
}

/** Parse MTGO/Arena decklist format:
 *  "4 Lightning Bolt"
 *  "4x Lightning Bolt"
 *  "4 Lightning Bolt (M20)"
 *  "1x Lightning Bolt (M20) 123"
 *  Also handles "Sideboard" / "SB:" section markers
 */
function parseDecklistLine(line: string): ParsedLine | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("#")) return null;
  // Skip section headers like "Sideboard", "Mainboard", "SB:", "Deck", "Commander"
  if (/^(sideboard|mainboard|deck|commander|companion|sb:)/i.test(trimmed)) return null;

  // Match: optional quantity (with optional "x"), then card name, then optional (SET) and collector number
  const match = trimmed.match(
    /^(\d+)\s*x?\s+(.+?)(?:\s+\(([A-Za-z0-9]+)\))?(?:\s+\d+)?$/
  );
  if (match) {
    return {
      quantity: parseInt(match[1], 10),
      name: match[2].trim(),
      set: match[3] || undefined,
    };
  }

  // If no quantity prefix, treat whole line as card name (qty 1)
  const nameOnly = trimmed.replace(/\s*\([A-Za-z0-9]+\)\s*\d*\s*$/, "").trim();
  if (nameOnly.length >= 2) {
    return { quantity: 1, name: nameOnly };
  }

  return null;
}

/** Parse CSV content. Expects columns: name/card_name, quantity/qty/count (optional), set (optional) */
function parseCSV(text: string): ParsedLine[] {
  const lines = text.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];

  const header = lines[0].toLowerCase().split(",").map((h) => h.trim().replace(/"/g, ""));
  const nameIdx = header.findIndex((h) =>
    ["name", "card_name", "card name", "card"].includes(h)
  );
  const qtyIdx = header.findIndex((h) =>
    ["quantity", "qty", "count", "amount", "copies"].includes(h)
  );
  const setIdx = header.findIndex((h) => ["set", "set_code", "set code", "edition"].includes(h));

  if (nameIdx === -1) return [];

  const results: ParsedLine[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    const name = cols[nameIdx]?.trim();
    if (!name) continue;

    results.push({
      name,
      quantity: qtyIdx !== -1 ? parseInt(cols[qtyIdx], 10) || 1 : 1,
      set: setIdx !== -1 ? cols[setIdx]?.trim() || undefined : undefined,
    });
  }
  return results;
}

/** Basic CSV line parser that handles quoted fields */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

/** Convert a Scryfall card to the shape our DB expects */
function scryfallToDbCard(
  card: ScryfallCard,
  quantity: number,
  board?: string
): Record<string, any> {
  const base: Record<string, any> = {
    scryfallId: card.id,
    name: card.name,
    typeLine: card.type_line,
    manaCost: card.mana_cost || null,
    cmc: card.cmc ? Math.floor(card.cmc) : 0,
    imageSmall:
      card.image_uris?.small || card.card_faces?.[0]?.image_uris?.small || null,
    imageNormal:
      card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal || null,
    colors: JSON.stringify(card.colors || []),
    colorIdentity: JSON.stringify(card.color_identity || []),
    rarity: card.rarity || null,
    oracleText: card.oracle_text || null,
    power: card.power || null,
    toughness: card.toughness || null,
    quantity,
  };
  // Collection-specific fields
  if (!board) {
    base.priceUsd = card.prices?.usd || null;
    base.setName = card.set_name || null;
    base.setCode = card.set || null;
  }
  // Deck-specific fields
  if (board) {
    base.board = board;
  }
  return base;
}

export default function ImportDialog({
  open,
  onOpenChange,
  deckId,
  board = "main",
}: ImportDialogProps) {
  const [tab, setTab] = useState("decklist");
  const [decklistText, setDecklistText] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<ParsedLine[]>([]);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const target = deckId ? "deck" : "collection";
  const importEndpoint = deckId
    ? `/api/import/deck/${deckId}`
    : "/api/import/collection";
  const invalidateKey = deckId
    ? ["/api/decks", deckId, "cards"]
    : ["/api/collection"];

  const importMutation = useMutation({
    mutationFn: async (parsed: ParsedLine[]) => {
      setResult(null);

      // Dedupe by name (sum quantities)
      const deduped = new Map<string, ParsedLine>();
      for (const p of parsed) {
        const key = p.name.toLowerCase();
        const existing = deduped.get(key);
        if (existing) {
          existing.quantity += p.quantity;
        } else {
          deduped.set(key, { ...p });
        }
      }
      const entries = Array.from(deduped.values());

      // Resolve all card names via Scryfall collection endpoint
      const identifiers = entries.map((e) =>
        e.set ? { name: e.name, set: e.set } : { name: e.name }
      );

      const resolveRes = await apiRequest("POST", "/api/scryfall/collection", {
        identifiers,
      });
      const resolveData = await resolveRes.json();
      const found: ScryfallCard[] = resolveData.data || [];
      const notFoundRaw: any[] = resolveData.not_found || [];

      // Build a map from lowercase name to resolved card
      const resolvedMap = new Map<string, ScryfallCard>();
      for (const card of found) {
        resolvedMap.set(card.name.toLowerCase(), card);
        // Also map front face name for DFCs
        if (card.card_faces && card.card_faces.length > 0) {
          resolvedMap.set(card.card_faces[0].name.toLowerCase(), card);
        }
      }

      // Build import cards array
      const importCards: Record<string, any>[] = [];
      const notFoundNames: string[] = notFoundRaw.map((nf: any) => nf.name || "Unknown");
      const failedNames: string[] = [];

      for (const entry of entries) {
        const resolved = resolvedMap.get(entry.name.toLowerCase());
        if (!resolved) {
          // Check if already in not_found
          if (!notFoundNames.some((n) => n.toLowerCase() === entry.name.toLowerCase())) {
            notFoundNames.push(entry.name);
          }
          continue;
        }
        importCards.push(
          scryfallToDbCard(resolved, entry.quantity, deckId ? board : undefined)
        );
      }

      // Send to bulk import endpoint
      if (importCards.length > 0) {
        const importRes = await apiRequest("POST", importEndpoint, {
          cards: importCards,
        });
        const importData = await importRes.json();
        return {
          added: importData.added || 0,
          failed: [...failedNames, ...(importData.failed || [])],
          notFound: notFoundNames,
        } as ImportResult;
      }

      return {
        added: 0,
        failed: failedNames,
        notFound: notFoundNames,
      } as ImportResult;
    },
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: invalidateKey });
      if (data.added > 0) {
        toast({
          title: `Imported ${data.added} card${data.added !== 1 ? "s" : ""}`,
          description:
            data.notFound.length > 0
              ? `${data.notFound.length} card${data.notFound.length !== 1 ? "s" : ""} not found`
              : undefined,
        });
      }
    },
    onError: (err: Error) => {
      toast({
        title: "Import failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const handleDecklistImport = () => {
    const lines = decklistText.split("\n");
    const parsed = lines.map(parseDecklistLine).filter(Boolean) as ParsedLine[];
    if (parsed.length === 0) {
      toast({
        title: "No cards found",
        description: "Check your format: \"4 Lightning Bolt\" or \"4x Lightning Bolt\"",
        variant: "destructive",
      });
      return;
    }
    importMutation.mutate(parsed);
  };

  const handleBulkImport = () => {
    const lines = bulkText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length >= 2);
    // Each line is just a card name, qty 1
    const parsed: ParsedLine[] = lines.map((name) => ({ quantity: 1, name }));
    if (parsed.length === 0) {
      toast({
        title: "No card names found",
        description: "Enter one card name per line",
        variant: "destructive",
      });
      return;
    }
    importMutation.mutate(parsed);
  };

  const handleCSVImport = () => {
    if (csvPreview.length === 0) {
      toast({
        title: "No cards found in CSV",
        description: "Make sure your CSV has a 'name' column",
        variant: "destructive",
      });
      return;
    }
    importMutation.mutate(csvPreview);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFile(file);
    const text = await file.text();
    const parsed = parseCSV(text);
    setCsvPreview(parsed);
  };

  const resetState = () => {
    setResult(null);
    setDecklistText("");
    setBulkText("");
    setCsvFile(null);
    setCsvPreview([]);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) resetState();
    onOpenChange(open);
  };

  const isPending = importMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto" data-testid="import-dialog">
        <DialogHeader>
          <DialogTitle className="text-base">
            Import Cards {deckId ? "to Deck" : "to Collection"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Paste a decklist, enter card names, or upload a CSV file.
          </DialogDescription>
        </DialogHeader>

        {/* Results view */}
        {result && (
          <div className="space-y-3" data-testid="import-results">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="font-medium">
                {result.added} card{result.added !== 1 ? "s" : ""} imported
              </span>
            </div>

            {result.notFound.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-sm text-amber-500">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-medium">
                    {result.notFound.length} not found
                  </span>
                </div>
                <div className="bg-muted rounded-lg p-2.5 max-h-32 overflow-y-auto">
                  {result.notFound.map((name, i) => (
                    <div key={i} className="text-xs text-muted-foreground">
                      {name}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.failed.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <XCircle className="w-4 h-4" />
                  <span className="font-medium">
                    {result.failed.length} failed
                  </span>
                </div>
                <div className="bg-muted rounded-lg p-2.5 max-h-32 overflow-y-auto">
                  {result.failed.map((name, i) => (
                    <div key={i} className="text-xs text-muted-foreground">
                      {name}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button
                variant="secondary"
                size="sm"
                onClick={resetState}
                className="flex-1"
                data-testid="import-another-btn"
              >
                Import More
              </Button>
              <Button
                size="sm"
                onClick={() => handleOpenChange(false)}
                className="flex-1"
                data-testid="import-done-btn"
              >
                Done
              </Button>
            </div>
          </div>
        )}

        {/* Import tabs */}
        {!result && (
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="w-full">
              <TabsTrigger value="decklist" className="flex-1 text-xs gap-1.5">
                <ClipboardPaste className="w-3.5 h-3.5" />
                Decklist
              </TabsTrigger>
              <TabsTrigger value="bulk" className="flex-1 text-xs gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                Bulk
              </TabsTrigger>
              <TabsTrigger value="csv" className="flex-1 text-xs gap-1.5">
                <Upload className="w-3.5 h-3.5" />
                CSV
              </TabsTrigger>
            </TabsList>

            {/* DECKLIST TAB */}
            <TabsContent value="decklist" className="space-y-3 mt-3">
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">
                  Paste a decklist in MTGO/Arena format. Each line should be a
                  quantity followed by the card name.
                </p>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="secondary" className="text-[10px]">4 Lightning Bolt</Badge>
                  <Badge variant="secondary" className="text-[10px]">4x Counterspell</Badge>
                  <Badge variant="secondary" className="text-[10px]">1 Sol Ring (C21)</Badge>
                </div>
              </div>
              <Textarea
                placeholder={"4 Lightning Bolt\n4x Counterspell\n1 Sol Ring\n2 Swords to Plowshares\n\nSideboard\n2 Rest in Peace\n1 Tormod's Crypt"}
                value={decklistText}
                onChange={(e) => setDecklistText(e.target.value)}
                className="min-h-[180px] font-mono text-xs bg-card border-border resize-none"
                data-testid="decklist-textarea"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {decklistText
                    .split("\n")
                    .map(parseDecklistLine)
                    .filter(Boolean).length}{" "}
                  card entries detected
                </span>
                <Button
                  size="sm"
                  onClick={handleDecklistImport}
                  disabled={isPending || !decklistText.trim()}
                  data-testid="import-decklist-btn"
                >
                  {isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  ) : null}
                  Import
                </Button>
              </div>
            </TabsContent>

            {/* BULK TAB */}
            <TabsContent value="bulk" className="space-y-3 mt-3">
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">
                  Enter one card name per line. Each card will be looked up via
                  Scryfall fuzzy matching and added with quantity 1.
                </p>
              </div>
              <Textarea
                placeholder={"Lightning Bolt\nCounterspell\nSol Ring\nSwords to Plowshares\njace bele\nblack lotus"}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                className="min-h-[180px] font-mono text-xs bg-card border-border resize-none"
                data-testid="bulk-textarea"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {bulkText
                    .split("\n")
                    .map((l) => l.trim())
                    .filter((l) => l.length >= 2).length}{" "}
                  card names detected
                </span>
                <Button
                  size="sm"
                  onClick={handleBulkImport}
                  disabled={isPending || !bulkText.trim()}
                  data-testid="import-bulk-btn"
                >
                  {isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  ) : null}
                  Import
                </Button>
              </div>
            </TabsContent>

            {/* CSV TAB */}
            <TabsContent value="csv" className="space-y-3 mt-3">
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">
                  Upload a CSV file with at least a <code className="text-[10px] bg-muted px-1 py-0.5 rounded">name</code> column.
                  Optional columns: <code className="text-[10px] bg-muted px-1 py-0.5 rounded">quantity</code>,{" "}
                  <code className="text-[10px] bg-muted px-1 py-0.5 rounded">set</code>.
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Compatible with exports from Moxfield, Archidekt, Deckbox, and other collection managers.
                </p>
              </div>

              <div
                className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileRef.current?.click()}
                data-testid="csv-drop-zone"
              >
                <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-xs font-medium">
                  {csvFile ? csvFile.name : "Click to select CSV file"}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  .csv files only
                </p>
                <Input
                  ref={fileRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileSelect}
                  data-testid="csv-file-input"
                />
              </div>

              {csvPreview.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-medium">
                    Preview ({csvPreview.length} cards)
                  </div>
                  <div className="bg-muted rounded-lg p-2 max-h-40 overflow-y-auto space-y-0.5">
                    {csvPreview.slice(0, 20).map((p, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 text-xs"
                      >
                        <span className="text-muted-foreground w-6 text-right font-mono">
                          {p.quantity}x
                        </span>
                        <span className="truncate">{p.name}</span>
                        {p.set && (
                          <Badge variant="outline" className="text-[9px] h-3.5 uppercase">
                            {p.set}
                          </Badge>
                        )}
                      </div>
                    ))}
                    {csvPreview.length > 20 && (
                      <div className="text-[10px] text-muted-foreground pt-1">
                        ...and {csvPreview.length - 20} more
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {csvPreview.length} cards from CSV
                </span>
                <Button
                  size="sm"
                  onClick={handleCSVImport}
                  disabled={isPending || csvPreview.length === 0}
                  data-testid="import-csv-btn"
                >
                  {isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  ) : null}
                  Import
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
