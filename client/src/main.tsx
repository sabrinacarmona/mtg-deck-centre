import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Handle Supabase OAuth redirect tokens before hash router takes over.
// Supabase appends tokens to the URL (e.g. #access_token=...). We need to
// let the Supabase client process them, then clean the URL so wouter's
// hash-based router works correctly.
function handleAuthRedirect() {
  const hash = window.location.hash;
  if (hash && hash.includes("access_token")) {
    // Supabase JS client auto-detects tokens in the URL on init,
    // so we just need to clean up the hash after a brief delay.
    // The AuthProvider's onAuthStateChange listener will pick up the session.
    setTimeout(() => {
      window.location.hash = "#/";
    }, 100);
    return;
  }
  if (!window.location.hash) {
    window.location.hash = "#/";
  }
}

handleAuthRedirect();

createRoot(document.getElementById("root")!).render(<App />);
