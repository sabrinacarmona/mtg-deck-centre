import { lazy, Suspense } from "react";
import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import NotFound from "@/pages/not-found";
import AppLayout from "@/components/AppLayout";
import PageLoadingSpinner from "@/components/PageLoadingSpinner";

const SearchPage = lazy(() => import("@/pages/search"));
const CollectionPage = lazy(() => import("@/pages/collection"));
const DecksPage = lazy(() => import("@/pages/decks"));
const DeckDetailPage = lazy(() => import("@/pages/deck-detail"));
const SharedDeckPage = lazy(() => import("@/pages/shared-deck"));
const ScannerPage = lazy(() => import("@/pages/scanner"));
const ComparePage = lazy(() => import("@/pages/compare"));
const WishlistPage = lazy(() => import("@/pages/wishlist"));
const LearnPage = lazy(() => import("@/pages/learn"));
const RivalsPage = lazy(() => import("@/pages/rivals"));
const GameNightPage = lazy(() => import("@/pages/game-night"));
const GoldfishPage = lazy(() => import("@/pages/goldfish"));
const MatchupsPage = lazy(() => import("@/pages/matchups"));

function AppRouter() {
  return (
    <AppLayout>
      <Suspense fallback={<PageLoadingSpinner />}>
        <Switch>
          <Route path="/" component={SearchPage} />
          <Route path="/search" component={SearchPage} />
          <Route path="/collection" component={CollectionPage} />
          <Route path="/decks" component={DecksPage} />
          <Route path="/decks/:id" component={DeckDetailPage} />
          <Route path="/shared/:data" component={SharedDeckPage} />
          <Route path="/compare" component={ComparePage} />
          <Route path="/wishlist" component={WishlistPage} />
          <Route path="/learn" component={LearnPage} />
          <Route path="/rivals" component={RivalsPage} />
          <Route path="/game-night" component={GameNightPage} />
          <Route path="/goldfish" component={GoldfishPage} />
          <Route path="/matchups" component={MatchupsPage} />
          <Route path="/scanner" component={ScannerPage} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router hook={useHashLocation}>
            <AppRouter />
          </Router>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
