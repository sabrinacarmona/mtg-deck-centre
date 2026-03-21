import { useState, useRef, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Camera, Keyboard, Search, Loader2, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ScryfallCard, Deck } from "@shared/schema";

type ScanMode = "camera" | "text";

export default function ScannerPage() {
  const [mode, setMode] = useState<ScanMode>("text");
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [ocrText, setOcrText] = useState("");
  const [manualQuery, setManualQuery] = useState("");
  const [matchedCard, setMatchedCard] = useState<ScryfallCard | null>(null);
  const [searching, setSearching] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  const { data: decks = [] } = useQuery<Deck[]>({
    queryKey: ["/api/decks"],
  });

  const [selectedDeckId, setSelectedDeckId] = useState<string>("");

  const addToCollection = useMutation({
    mutationFn: async (card: ScryfallCard) => {
      const res = await apiRequest("POST", "/api/collection", {
        scryfallId: card.id,
        name: card.name,
        typeLine: card.type_line,
        manaCost: card.mana_cost || null,
        cmc: card.cmc ? Math.floor(card.cmc) : 0,
        imageSmall: card.image_uris?.small || card.card_faces?.[0]?.image_uris?.small || null,
        imageNormal: card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal || null,
        priceUsd: card.prices?.usd || null,
        colors: JSON.stringify(card.colors || []),
        colorIdentity: JSON.stringify(card.color_identity || []),
        rarity: card.rarity || null,
        setName: card.set_name || null,
        setCode: card.set || null,
        oracleText: card.oracle_text || null,
        power: card.power || null,
        toughness: card.toughness || null,
        quantity: 1,
      });
      return res.json();
    },
    onSuccess: (_data, card) => {
      queryClient.invalidateQueries({ queryKey: ["/api/collection"] });
      toast({ title: `${card.name} added to collection` });
    },
  });

  const addToDeck = useMutation({
    mutationFn: async ({ card, deckId }: { card: ScryfallCard; deckId: number }) => {
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
        board: "main",
      });
      return res.json();
    },
    onSuccess: (_data, { card, deckId }) => {
      const deckName = decks.find((d) => d.id === deckId)?.name || "deck";
      queryClient.invalidateQueries({ queryKey: ["/api/decks", deckId, "cards"] });
      toast({ title: `${card.name} added to ${deckName}` });
    },
  });

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      setCameraError(
        err.name === "NotAllowedError"
          ? "Camera access denied. Please allow camera access in your browser settings."
          : "Could not access camera. Try the manual text input instead."
      );
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
      setCameraStream(null);
    }
  }, [cameraStream]);

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [cameraStream]);

  const captureAndOCR = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setScanning(true);
    setOcrText("");

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng");
      const { data } = await worker.recognize(canvas);
      await worker.terminate();

      const text = data.text.trim();
      setOcrText(text);

      if (text) {
        // Try to extract a card name — usually the first line or the most prominent text
        const lines = text.split("\n").filter((l) => l.trim().length > 2);
        const cardNameGuess = lines[0]?.trim() || text.slice(0, 50);
        await searchForCard(cardNameGuess);
      } else {
        toast({ title: "No text detected", description: "Try holding the card closer", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "OCR failed", description: err.message, variant: "destructive" });
    } finally {
      setScanning(false);
    }
  }, []);

  const searchForCard = async (query: string) => {
    setSearching(true);
    setMatchedCard(null);
    try {
      const res = await apiRequest(
        "GET",
        `/api/scryfall/search?q=${encodeURIComponent(query)}`
      );
      const data = await res.json();
      if (data.data?.length > 0) {
        setMatchedCard(data.data[0]);
      } else {
        toast({ title: "No card found", description: `"${query}" didn't match any cards` });
      }
    } catch {
      toast({ title: "Search failed", variant: "destructive" });
    } finally {
      setSearching(false);
    }
  };

  const handleManualSearch = () => {
    if (manualQuery.trim().length < 2) return;
    searchForCard(manualQuery.trim());
  };

  return (
    <div className="space-y-4" data-testid="scanner-page">
      <h1 className="text-xl font-bold">Card Scanner</h1>

      {/* Mode toggle — gold active state */}
      <div className="flex gap-2">
        <Button
          variant={mode === "camera" ? "default" : "secondary"}
          size="sm"
          className="gap-1.5"
          onClick={() => {
            setMode("camera");
            if (!cameraStream) startCamera();
          }}
        >
          <Camera className="w-3.5 h-3.5" />
          Camera
        </Button>
        <Button
          variant={mode === "text" ? "default" : "secondary"}
          size="sm"
          className="gap-1.5"
          onClick={() => {
            setMode("text");
            stopCamera();
          }}
        >
          <Keyboard className="w-3.5 h-3.5" />
          Manual Input
        </Button>
      </div>

      {/* Camera mode */}
      {mode === "camera" && (
        <div className="space-y-3">
          {cameraError ? (
            <div className="bg-destructive/10 text-destructive rounded-xl p-4 text-sm">
              {cameraError}
              <Button
                variant="secondary"
                size="sm"
                className="mt-2"
                onClick={() => setMode("text")}
              >
                Use manual input instead
              </Button>
            </div>
          ) : (
            <>
              <div className="relative rounded-xl overflow-hidden bg-black aspect-video card-frame-gold">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {/* Viewfinder overlay — gold corners */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-3/4 h-1/2 border-2 border-primary/40 rounded-xl">
                    <div className="absolute -top-px -left-px w-6 h-6 border-t-2 border-l-2 border-primary rounded-tl-lg" />
                    <div className="absolute -top-px -right-px w-6 h-6 border-t-2 border-r-2 border-primary rounded-tr-lg" />
                    <div className="absolute -bottom-px -left-px w-6 h-6 border-b-2 border-l-2 border-primary rounded-bl-lg" />
                    <div className="absolute -bottom-px -right-px w-6 h-6 border-b-2 border-r-2 border-primary rounded-br-lg" />
                  </div>
                </div>
                <canvas ref={canvasRef} className="hidden" />
              </div>
              <Button
                className="w-full gap-2"
                onClick={captureAndOCR}
                disabled={scanning || !cameraStream}
              >
                {scanning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" />
                    Scan Card
                  </>
                )}
              </Button>
              {ocrText && (
                <div className="bg-muted rounded-lg p-2 text-xs">
                  <span className="text-muted-foreground">OCR result: </span>
                  {ocrText}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Manual text mode */}
      {mode === "text" && (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Type a card name..."
              value={manualQuery}
              onChange={(e) => setManualQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleManualSearch()}
              className="pl-10 h-10 bg-card border-border"
            />
          </div>
          <Button onClick={handleManualSearch} disabled={searching || manualQuery.trim().length < 2}>
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
          </Button>
        </div>
      )}

      {/* Matched card display */}
      {matchedCard && (
        <div className="card-frame p-4">
          <div className="flex gap-4">
            {(matchedCard.image_uris?.normal || matchedCard.card_faces?.[0]?.image_uris?.normal) && (
              <img
                src={matchedCard.image_uris?.normal || matchedCard.card_faces?.[0]?.image_uris?.normal}
                alt={matchedCard.name}
                className="w-40 rounded-lg"
              />
            )}
            <div className="flex-1 space-y-2">
              <h3 className="font-semibold">{matchedCard.name}</h3>
              <p className="text-xs text-muted-foreground">{matchedCard.type_line}</p>
              {matchedCard.prices?.usd && (
                <p className="text-sm text-primary font-medium">${matchedCard.prices.usd}</p>
              )}

              <div className="flex flex-col gap-2 pt-2">
                <Button
                  size="sm"
                  onClick={() => addToCollection.mutate(matchedCard)}
                >
                  Add to Collection
                </Button>

                {decks.length > 0 && (
                  <div className="flex gap-2">
                    <Select value={selectedDeckId} onValueChange={setSelectedDeckId}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select deck" />
                      </SelectTrigger>
                      <SelectContent>
                        {decks.map((d) => (
                          <SelectItem key={d.id} value={String(d.id)}>
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={!selectedDeckId}
                      onClick={() =>
                        addToDeck.mutate({
                          card: matchedCard,
                          deckId: Number(selectedDeckId),
                        })
                      }
                    >
                      Add to Deck
                    </Button>
                  </div>
                )}

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setMatchedCard(null)}
                >
                  <X className="w-3.5 h-3.5 mr-1" />
                  Clear
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help text */}
      {!matchedCard && (
        <div className="text-center py-6 text-sm text-muted-foreground">
          {mode === "camera"
            ? "Point your camera at a Magic card and tap Scan"
            : "Type a card name to look it up instantly"}
        </div>
      )}
    </div>
  );
}
