import React from 'react';
import { MessageSquare, X } from 'lucide-react';

// Floating bottom-right button. Hidden when the sidebar is open on desktop
// because the sidebar's own close button takes over. On mobile we keep it
// hidden when open since the sidebar is full-screen.
export default function ToggleButton({ isOpen, onToggle }) {
  if (isOpen) return null;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label="Open Claude assistant"
      className="fixed bottom-5 right-5 z-[60] flex items-center gap-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg px-4 py-3 transition-transform hover:scale-105"
    >
      <MessageSquare className="w-5 h-5" />
      <span className="text-sm font-semibold hidden sm:inline">Claude</span>
    </button>
  );
}
