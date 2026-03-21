import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { Plus, Layers3, Trash2 } from "lucide-react";
import type { Deck } from "@shared/schema";

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {deckList.map((deck) => (
            <div
              key={deck.id}
              className="bg-card border border-card-border rounded-xl p-4 hover:border-primary/30 transition-colors group relative"
              data-testid={`deck-card-${deck.id}`}
            >
              <Link href={`/decks/${deck.id}`}>
                <div className="cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 mb-2">
                      <Layers3 className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold text-sm">{deck.name}</h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-muted px-2 py-0.5 rounded capitalize">
                      {deck.format}
                    </span>
                  </div>
                </div>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-3 right-3 w-7 h-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  deleteDeck.mutate(deck.id);
                }}
                data-testid={`delete-deck-${deck.id}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && deckList.length === 0 && (
        <div className="text-center py-16">
          <div className="text-4xl mb-4">🃏</div>
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
