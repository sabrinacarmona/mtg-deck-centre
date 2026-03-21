import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import {
  ArrowLeft,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  BookOpen,
  Import,
  Share2,
} from "lucide-react";
import { getDeckGuide } from "@/lib/deck-guides";
import type { Deck, DeckCard } from "@shared/schema";

interface DeckHeaderProps {
  deck: Deck;
  mainCards: DeckCard[];
  sideCards: DeckCard[];
  totalPrice: number;
  statsOpen: boolean;
  guideOpen: boolean;
  onToggleStats: () => void;
  onToggleGuide: () => void;
  onCopy: () => void;
  onExport: () => void;
  onImport: () => void;
  onShare?: () => void;
}

export default function DeckHeader({
  deck,
  mainCards,
  sideCards,
  totalPrice,
  statsOpen,
  guideOpen,
  onToggleStats,
  onToggleGuide,
  onCopy,
  onExport,
  onImport,
  onShare,
}: DeckHeaderProps) {
  const totalMain = mainCards.reduce((s, c) => s + (c.quantity || 1), 0);
  const totalSide = sideCards.reduce((s, c) => s + (c.quantity || 1), 0);
  const avgCmc =
    mainCards.length > 0
      ? (
          mainCards.reduce((s, c) => s + (c.cmc || 0) * (c.quantity || 1), 0) /
          totalMain
        ).toFixed(1)
      : "0.0";

  return (
    <>
      <div className="flex items-center gap-3">
        <Link href="/decks">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="w-8 h-8" data-testid="back-btn" aria-label="Back to Decks">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Back to Decks</TooltipContent>
          </Tooltip>
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold">{deck.name}</h1>
          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
            <Badge variant="outline" className="text-[10px] capitalize">
              {deck.format}
            </Badge>
            <span>{totalMain} main</span>
            <span>{totalSide} side</span>
            <span>Avg CMC: {avgCmc}</span>
            {totalPrice > 0 && (
              <span className="text-primary font-medium">
                Est. ${totalPrice.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="secondary"
              size="sm"
              className="gap-1 h-8 px-2 sm:px-3 text-xs"
              onClick={onToggleStats}
              data-testid="toggle-stats-btn"
              aria-label="View Stats"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Stats</span>
              {statsOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>View Stats</TooltipContent>
        </Tooltip>
        {onShare && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                className="gap-1 h-8 px-2 sm:px-3 text-xs"
                onClick={onShare}
                aria-label="Share Deck"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Share</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Share Deck via URL</TooltipContent>
          </Tooltip>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="secondary"
              size="sm"
              className="gap-1 h-8 px-2 sm:px-3 text-xs"
              onClick={onCopy}
              aria-label="Copy Decklist"
            >
              <Copy className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Copy</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy Decklist</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="secondary"
              size="sm"
              className="gap-1 h-8 px-2 sm:px-3 text-xs"
              onClick={onExport}
              aria-label="Export Deck"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Export Deck</TooltipContent>
        </Tooltip>
        {getDeckGuide(deck.name) && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                className="gap-1 h-8 px-2 sm:px-3 text-xs"
                onClick={onToggleGuide}
                aria-label="Strategy Guide"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Guide</span>
                {guideOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Strategy Guide</TooltipContent>
          </Tooltip>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="secondary"
              size="sm"
              className="gap-1 h-8 px-2 sm:px-3 text-xs"
              onClick={onImport}
              data-testid="import-deck-btn"
              aria-label="Import Cards"
            >
              <Import className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Import</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Import Cards</TooltipContent>
        </Tooltip>
      </div>
    </>
  );
}
