const manaColors: Record<string, { bg: string; text: string }> = {
  W: { bg: "#f0e6b6", text: "#6b5c2e" },
  U: { bg: "#0e68ab", text: "#ffffff" },
  B: { bg: "#150b00", text: "#ffffff" },
  R: { bg: "#d3202a", text: "#ffffff" },
  G: { bg: "#00733e", text: "#ffffff" },
};

function getSymbolStyle(symbol: string): { bg: string; text: string } {
  if (manaColors[symbol]) return manaColors[symbol];
  // Colorless / generic numbers
  return { bg: "#cbc2bf", text: "#333333" };
}

export function ManaCost({ cost, small }: { cost: string; small?: boolean }) {
  if (!cost) return null;

  // Parse mana cost string like "{2}{R}{G}" into symbols
  const symbols = cost.match(/\{([^}]+)\}/g);
  if (!symbols) return <span className="text-xs text-muted-foreground">{cost}</span>;

  const cls = small ? "mana-symbol-sm" : "mana-symbol";

  return (
    <span className="inline-flex items-center gap-0.5">
      {symbols.map((raw, i) => {
        const symbol = raw.replace(/[{}]/g, "");
        const style = getSymbolStyle(symbol);
        return (
          <span
            key={i}
            className={cls}
            style={{ backgroundColor: style.bg, color: style.text }}
          >
            {symbol}
          </span>
        );
      })}
    </span>
  );
}
