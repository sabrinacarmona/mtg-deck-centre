/**
 * Renders MTG mana symbols using official Scryfall SVG images.
 * URL pattern: https://svgs.scryfall.io/card-symbols/{CODE}.svg
 */

const sizeMap = { sm: 14, md: 18, lg: 24 } as const;

/** Render a single mana symbol as a Scryfall SVG image. */
export function ManaSymbol({
  symbol,
  size = "md",
}: {
  symbol: string;
  size?: "sm" | "md" | "lg";
}) {
  const code = symbol.replace(/[{}]/g, "").replace("/", "");
  const px = sizeMap[size];
  return (
    <img
      src={`https://svgs.scryfall.io/card-symbols/${encodeURIComponent(code)}.svg`}
      alt={`{${code}}`}
      width={px}
      height={px}
      className="inline-block"
      loading="lazy"
    />
  );
}

/** Parse a mana cost string like "{2}{R}{G}" and render each symbol. */
export function ManaCost({
  cost,
  size = "md",
}: {
  cost: string;
  size?: "sm" | "md" | "lg";
}) {
  if (!cost) return null;
  const symbols = cost.match(/\{[^}]+\}/g) || [];
  if (symbols.length === 0) return null;
  const px = sizeMap[size];
  return (
    <span className="inline-flex items-center gap-0.5">
      {symbols.map((sym, i) => {
        const code = sym.replace(/[{}]/g, "").replace("/", "");
        return (
          <img
            key={i}
            src={`https://svgs.scryfall.io/card-symbols/${encodeURIComponent(code)}.svg`}
            alt={sym}
            width={px}
            height={px}
            className="inline-block"
            loading="lazy"
          />
        );
      })}
    </span>
  );
}
