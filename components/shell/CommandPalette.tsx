'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Command, X, LayoutDashboard, Inbox, PenTool, Calendar, Send, Globe, BarChart3, Settings } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const commands = [
    { label: 'Go to Action Dashboard', href: '/', icon: LayoutDashboard },
    { label: 'Open Review Inbox (Pending Reviews)', href: '/inbox', icon: Inbox },
    { label: 'Create New Post in Smart Composer', href: '/composer', icon: PenTool },
    { label: 'Open Content Calendar', href: '/calendar', icon: Calendar },
    { label: 'Publishing Operations & Reconcile', href: '/reconcile', icon: Send },
    { label: 'Source Control Center', href: '/sources', icon: Globe },
    { label: 'View Operational Analytics', href: '/analytics', icon: BarChart3 },
    { label: 'System & Security Settings', href: '/settings', icon: Settings },
  ];

  const filtered = commands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // parent toggles
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-start justify-center pt-20 p-4 z-50">
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-3.5 border-b border-slate-200 flex items-center space-x-3 bg-slate-50">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            autoFocus
            placeholder="Type a command or search screens... (Ctrl+K)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-slate-900 text-sm focus:outline-none placeholder-slate-400 font-medium"
          />
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="p-4 text-xs text-slate-500 text-center">No commands found matching "{query}"</p>
          ) : (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.href}
                  onClick={() => {
                    router.push(item.href);
                    onClose();
                  }}
                  className="w-full text-left flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition"
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-4 h-4 text-slate-500" />
                    <span>{item.label}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">Jump</span>
                </button>
              );
            })
          )}
        </div>

        <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between font-mono">
          <span>
            Press <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded shadow-2xs font-sans">Esc</kbd> to close
          </span>
          <span className="flex items-center space-x-1">
            <Command className="w-3 h-3" />
            <span>K Palette</span>
          </span>
        </div>
      </div>
    </div>
  );
}
