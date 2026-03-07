import { Minus, Square, X, Hexagon } from 'lucide-react';

export default function TitleBar() {
  return (
    <div
      className="flex items-center justify-between h-8 bg-[#1e293b] text-white select-none"
      style={{ WebkitAppRegion: 'drag' }}
    >
      {/* Left: App icon + title */}
      <div className="flex items-center gap-2 pl-3">
        <Hexagon className="w-4 h-4 text-emerald-400" />
        <span className="text-xs font-semibold tracking-wide">AME Pro AI Workstation</span>
      </div>

      {/* Right: Window controls */}
      <div className="flex h-full" style={{ WebkitAppRegion: 'no-drag' }}>
        <button
          onClick={() => window.api?.minimizeWindow?.()}
          className="h-full px-3 hover:bg-white/10 transition-colors flex items-center justify-center"
          title="Minimize"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => window.api?.maximizeWindow?.()}
          className="h-full px-3 hover:bg-white/10 transition-colors flex items-center justify-center"
          title="Maximize"
        >
          <Square className="w-3 h-3" />
        </button>
        <button
          onClick={() => window.api?.closeWindow?.()}
          className="h-full px-3 hover:bg-red-600 transition-colors flex items-center justify-center"
          title="Close"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
