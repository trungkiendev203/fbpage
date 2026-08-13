'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Inbox,
  PenTool,
  Calendar,
  Send,
  Globe,
  BarChart3,
  FileText,
  Settings,
  X,
  Facebook,
} from 'lucide-react';

interface SidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ isMobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { label: 'Bảng Điều Khiển', href: '/', icon: LayoutDashboard },
    { label: 'Duyệt Bài Viết', href: '/inbox', icon: Inbox, badge: '1' },
    { label: 'Soạn Thảo Thông Minh', href: '/composer', icon: PenTool },
    { label: 'Lịch Xuất Bản', href: '/calendar', icon: Calendar },
    { label: 'Đối Soát Xuất Bản', href: '/reconcile', icon: Send, badge: '1', badgeColor: 'bg-purple-100 text-purple-700' },
    { label: 'Nguồn Quét Tin', href: '/sources', icon: Globe },
    { label: 'Báo Cáo Phân Tích', href: '/analytics', icon: BarChart3 },
    { label: 'Nhật Ký Hệ Thống', href: '/audit-logs', icon: FileText },
    { label: 'Cấu Hình Bảo Mật', href: '/settings', icon: Settings },
  ];

  const content = (
    <div className="h-full flex flex-col justify-between bg-slate-900 text-slate-300 w-64 border-r border-slate-800">
      <div>
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-600/30">
              <Facebook className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight">Tools FB</h1>
              <p className="text-[10px] text-slate-400 font-mono font-medium">Trung Tâm Vận Hành</p>
            </div>
          </div>
          {onMobileClose && (
            <button onClick={onMobileClose} className="md:hidden text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            Hệ Thống Vận Hành
          </p>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onMobileClose}
                className={`flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-semibold transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                      item.badgeColor || 'bg-amber-500 text-slate-900'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-400 space-y-1 font-mono">
        <p className="font-semibold text-slate-300">Động Cơ Monorepo v1.0</p>
        <p className="text-emerald-400 flex items-center space-x-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping mr-1"></span>
          PostgreSQL 5433 • Đã Kết Nối
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden md:block fixed left-0 top-0 bottom-0 z-30">{content}</aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-slate-900/80 backdrop-blur-xs flex">
          <div className="w-64 h-full animate-in slide-in-from-left duration-200">{content}</div>
          <div className="flex-1" onClick={onMobileClose}></div>
        </div>
      )}
    </>
  );
}
