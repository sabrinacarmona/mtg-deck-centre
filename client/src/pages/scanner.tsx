import { Camera, Zap } from "lucide-react";

export default function ScannerPage() {
  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-6" data-testid="scanner-page">
      <div className="relative">
        <div className="w-48 h-64 rounded-2xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center bg-card">
          <Camera className="w-12 h-12 text-muted-foreground/40" />
        </div>
        {/* Corner brackets */}
        <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-primary rounded-tl-lg" />
        <div className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2 border-primary rounded-tr-lg" />
        <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-2 border-l-2 border-primary rounded-bl-lg" />
        <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-primary rounded-br-lg" />
      </div>

      <div className="text-center space-y-2">
        <h2 className="text-lg font-semibold">Card Scanner</h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          Camera-based card recognition with OCR is coming in Phase 2. Point
          your camera at any MTG card for instant identification.
        </p>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted rounded-full px-4 py-2">
        <Zap className="w-3.5 h-3.5 text-primary" />
        Powered by Tesseract.js OCR
      </div>
    </div>
  );
}
