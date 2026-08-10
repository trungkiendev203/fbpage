'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

const ROUTE_NAME_MAP: Record<string, string> = {
  inbox: 'Duyệt Bài Viết',
  composer: 'Soạn Thảo Thông Minh',
  calendar: 'Lịch Xuất Bản',
  reconcile: 'Đối Soát Xuất Bản',
  sources: 'Nguồn Quét Tin',
  analytics: 'Báo Cáo Phân Tích',
  'audit-logs': 'Nhật Ký Hệ Thống',
  settings: 'Cấu Hình Bảo Mật',
};

export default function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  return (
    <nav className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
      <Link href="/" className="hover:text-slate-900 flex items-center space-x-1">
        <Home className="w-3.5 h-3.5" />
        <span>Bảng Điều Khiển</span>
      </Link>

      {segments.map((segment, idx) => {
        const url = `/${segments.slice(0, idx + 1).join('/')}`;
        const isLast = idx === segments.length - 1;
        const name = ROUTE_NAME_MAP[segment] || segment;

        return (
          <React.Fragment key={url}>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            {isLast ? (
              <span className="text-slate-900 font-semibold">{name}</span>
            ) : (
              <Link href={url} className="hover:text-slate-900">
                {name}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
