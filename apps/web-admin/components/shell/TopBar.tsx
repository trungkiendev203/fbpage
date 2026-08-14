'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, Search, Bell, User as UserIcon, Facebook, LogOut } from 'lucide-react';
import Breadcrumb from './Breadcrumb';
import SystemHealthIndicator from '../ui/SystemHealthIndicator';
import CommandPalette from './CommandPalette';

interface TopBarProps {
  onMobileMenuToggle: () => void;
}

export default function TopBar({ onMobileMenuToggle }: TopBarProps) {
  const router = useRouter();
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [pages, setPages] = useState<any[]>([]);
  const [selectedPage, setSelectedPage] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = async () => {
    await fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'include' });
    router.replace('/login');
    router.refresh();
  };

  useEffect(() => {
    const fetchPages = async () => {
      try {
        const res = await fetch('/api/v1/facebook/pages', { credentials: 'include' });
        if (!res.ok) throw new Error(`API trả về HTTP ${res.status}`);
        const data = await res.json();
        const rawPages = data.data || [];
        setPages(rawPages);
        if (rawPages.length > 0) setSelectedPage(rawPages[0].id);
      } catch (err) {
        console.error('Failed to fetch pages for TopBar:', err);
      }
    };
    fetchPages();
  }, []);

  return (
    <>
      <header className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-2xs px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left section: Mobile menu toggle + Breadcrumbs */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onMobileMenuToggle}
              className="md:hidden p-1.5 text-slate-600 hover:text-slate-900 rounded-md hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Breadcrumb />
          </div>

          {/* Right section: Controls & Profile */}
          <div className="flex items-center space-x-3">
            {/* Command Palette Trigger */}
            <button
              onClick={() => setIsPaletteOpen(true)}
              className="hidden sm:flex items-center space-x-2 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-md text-xs text-slate-500 hover:border-slate-300 transition"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Tìm kiếm hoặc gõ phím tắt...</span>
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-[10px] font-mono text-slate-600 shadow-2xs">
                Ctrl K
              </kbd>
            </button>

            {/* Target Facebook Page Selector */}
            <div className="hidden lg:flex items-center space-x-2 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md text-xs">
              <Facebook className="w-3.5 h-3.5 text-blue-600" />
              <select
                value={selectedPage}
                onChange={(e) => setSelectedPage(e.target.value)}
                className="bg-transparent font-semibold text-blue-900 focus:outline-none"
              >
                {pages.length === 0 ? (
                  <option value="">Chưa có Fanpage kết nối</option>
                ) : (
                  pages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (ID: {p.pageId})
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* System Health Indicator */}
            <div className="hidden xl:block">
              <SystemHealthIndicator apiStatus="READY" dbStatus="CONNECTED" />
            </div>

            {/* Notification Center */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-slate-600 hover:text-slate-900 rounded-md hover:bg-slate-100 relative"
              >
                <Bell className="w-4 h-4" />
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-lg shadow-xl p-3 z-50 text-xs space-y-2 animate-in fade-in zoom-in-95 duration-100">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-bold text-slate-900">Thông báo vận hành</span>
                  </div>
                  <p className="text-[11px] text-slate-500 italic p-2 text-center">Không có thông báo mới.</p>
                </div>
              )}
            </div>

            {/* User Profile */}
            <div className="flex items-center space-x-2 border-l border-slate-200 pl-3">
              <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                <UserIcon className="w-4 h-4" />
              </div>
              <div className="hidden md:block text-left leading-none">
                <p className="text-xs font-bold text-slate-900">Super Admin</p>
                <p className="text-[10px] text-slate-500 font-mono">admin@fbpage.local</p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="p-1.5 text-slate-500 hover:text-red-600 rounded-md hover:bg-red-50"
                title="Đăng xuất"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <CommandPalette isOpen={isPaletteOpen} onClose={() => setIsPaletteOpen(false)} />
    </>
  );
}
