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
import SharedDeckPage from "@/pages/shared-deck";
import ScannerPage from "@/pages/scanner";
import ComparePage from "@/pages/compare";
import WishlistPage from "@/pages/wishlist";
import LearnPage from "@/pages/learn";
import RivalsPage from "@/pages/rivals";
import GameNightPage from "@/pages/game-night";
import GoldfishPage from "@/pages/goldfish";
import MatchupsPage from "@/pages/matchups";
import AppLayout from "@/components/AppLayout";

function AppRouter() {
  return (
    <Switch>
      <Route path="/shared/:data">
        <AppLayout>
          <SharedDeckPage />
        </AppLayout>
      </Route>
      <Route>
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
            <Route path="/matchups" component={MatchupsPage} />
            <Route path="/scanner" component={ScannerPage} />
            <Route component={NotFound} />
          </Switch>
        </AppLayout>
      </Route>
    </Switch>
  );
}

function App() {
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
