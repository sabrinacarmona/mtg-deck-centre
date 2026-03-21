import { useState, useEffect } from "react";
import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import SearchPage from "@/pages/search";
import CollectionPage from "@/pages/collection";
import DecksPage from "@/pages/decks";
import DeckDetailPage from "@/pages/deck-detail";
import ScannerPage from "@/pages/scanner";
import ComparePage from "@/pages/compare";
import WishlistPage from "@/pages/wishlist";
import LearnPage from "@/pages/learn";
import RivalsPage from "@/pages/rivals";
import GameNightPage from "@/pages/game-night";
import GoldfishPage from "@/pages/goldfish";
import AppLayout from "@/components/AppLayout";
import { initSeedIfNeeded } from "./lib/db";

function SeedingScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-primary/20 flex items-center justify-center gold-glow">
          <svg width="32" height="32" viewBox="0 0 28 28" fill="none" className="text-primary">
            <path d="M14 2L25.5 10.5L21 24H7L2.5 10.5L14 2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M14 7L17.5 13L14 19L10.5 13L14 7Z" fill="currentColor" opacity="0.25" />
            <path d="M14 7L17.5 13L14 19L10.5 13L14 7Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-primary">Opening the Vault...</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          Loading your Commander decks from Scryfall.
          This only happens once.
        </p>
        <div className="flex items-center justify-center gap-2 pt-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

function AppRouter() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={SearchPage} />
        <Route path="/search" component={SearchPage} />
        <Route path="/collection" component={CollectionPage} />
        <Route path="/decks" component={DecksPage} />
        <Route path="/decks/:id" component={DeckDetailPage} />
        <Route path="/compare" component={ComparePage} />
        <Route path="/wishlist" component={WishlistPage} />
        <Route path="/learn" component={LearnPage} />
        <Route path="/rivals" component={RivalsPage} />
        <Route path="/game-night" component={GameNightPage} />
        <Route path="/goldfish" component={GoldfishPage} />
        <Route path="/scanner" component={ScannerPage} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  const [seeding, setSeeding] = useState(true);

  useEffect(() => {
    initSeedIfNeeded().then(() => {
      setSeeding(false);
    });
  }, []);

  if (seeding) {
    return <SeedingScreen />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router hook={useHashLocation}>
          <AppRouter />
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
