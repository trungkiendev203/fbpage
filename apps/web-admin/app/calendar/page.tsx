'use client';

import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';
import DetailDrawer from '../../components/ui/DetailDrawer';
import { Publication } from '../../types';
import { formatDate } from '../../lib/utils';

export default function ContentCalendarPage() {
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [selectedPub, setSelectedPub] = useState<Publication | null>(null);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCalendarPubs = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:4000/api/v1/publications', { credentials: 'include' });
      const data = await res.json();
      setPublications(data.data || []);
    } catch (err) {
      console.error('Lỗi nạp lịch xuất bản:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarPubs();
  }, []);

  const daysOfWeek = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Lịch Xuất Bản (Content Calendar)</h1>
          <p className="text-xs text-slate-500">
            Lịch Xuất Bản & Kiểm Soát Tần Suất Đăng Bài Fanpage
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1 bg-white border border-slate-200 rounded-md p-1 text-xs">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 rounded font-semibold ${
                viewMode === 'month' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Tháng
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 rounded font-semibold ${
                viewMode === 'week' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Tuần
            </button>
          </div>

          <div className="flex items-center space-x-1 border border-slate-200 rounded-md bg-white p-1 text-xs font-semibold">
            <button className="p-1 hover:bg-slate-100 rounded">
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <span className="px-2 text-slate-900">Tháng 8, 2026</span>
            <button className="p-1 hover:bg-slate-100 rounded">
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Collision Warning Alert Bar */}
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0" />
          <span>
            <strong>Khuyến cáo tần suất đăng bài:</strong> Giữ khoảng cách giữa các bài đăng tối thiểu 30 phút để đạt Reach cao nhất từ thuật toán Facebook.
          </span>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-bold text-slate-600 py-2.5">
          {daysOfWeek.map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-200 text-xs">
          {Array.from({ length: 28 }).map((_, idx) => {
            const dayNum = idx + 1;
            const isToday = dayNum === 7;
            const dayPubs = publications.filter((p) => new Date(p.scheduledAt).getDate() === dayNum);

            return (
              <div
                key={idx}
                className={`min-h-[100px] p-2 flex flex-col justify-between transition ${
                  isToday ? 'bg-blue-50/40' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`font-bold ${
                      isToday
                        ? 'w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs'
                        : 'text-slate-700'
                    }`}
                  >
                    {dayNum}
                  </span>
                </div>

                <div className="space-y-1.5 mt-2">
                  {dayPubs.map((pub) => (
                    <button
                      key={pub.id}
                      onClick={() => setSelectedPub(pub)}
                      className="w-full text-left p-1.5 bg-blue-600 text-white rounded text-[11px] font-semibold truncate hover:bg-blue-700 transition block shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate">
                          {pub.postRevision?.caption.substring(0, 20)}...
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail Drawer */}
      <DetailDrawer
        isOpen={!!selectedPub}
        title="Chi Tiết Lịch Xuất Bản Bài Đăng"
        subtitle={selectedPub?.id}
        onClose={() => setSelectedPub(null)}
      >
        {selectedPub && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Trạng thái:</span>
                <StatusBadge status={selectedPub.status} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Thời gian xếp lịch:</span>
                <span className="font-semibold text-slate-900">{formatDate(selectedPub.scheduledAt)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Fanpage đăng:</span>
                <span className="font-semibold text-slate-900">{selectedPub.facebookPage?.name}</span>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-1">Nội dung bài viết:</h4>
              <p className="p-3 bg-slate-50 border border-slate-200 rounded text-slate-800 whitespace-pre-wrap leading-relaxed">
                {selectedPub.postRevision?.caption}
              </p>
            </div>
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}
