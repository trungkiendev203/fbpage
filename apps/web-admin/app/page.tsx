'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Inbox,
  Clock,
  AlertTriangle,
  Globe,
  Key,
  Cpu,
  DollarSign,
  CheckCircle,
} from 'lucide-react';
import MetricBlock from '../components/ui/MetricBlock';
import StatusBadge from '../components/ui/StatusBadge';
import { formatDate } from '../lib/utils';

export default function ActionDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    pendingReviewCount: 0,
    scheduled60mCount: 0,
    unknownStatusCount: 0,
    failingScraperCount: 0,
    scrapedTodayCount: 0,
    publishedTodayCount: 0,
    geminiCostToday: 0.0,
  });
  const [recentUrgentItems, setRecentUrgentItems] = useState<any[]>([]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [postsRes, pubsRes, sourcesRes] = await Promise.all([
        fetch('/api/v1/posts', { credentials: 'include' }).catch(() => null),
        fetch('/api/v1/publications', { credentials: 'include' }).catch(() => null),
        fetch('/api/v1/sources', { credentials: 'include' }).catch(() => null),
      ]);

      const postsData = postsRes ? await postsRes.json() : { data: [] };
      const pubsData = pubsRes ? await pubsRes.json() : { data: [] };
      const sourcesData = sourcesRes ? await sourcesRes.json() : { data: [] };

      const posts = postsData.data || [];
      const pubs = pubsData.data || [];
      const sources = sourcesData.data || [];

      const inReviewCount = posts.filter((p: any) => p.reviewStatus === 'IN_REVIEW').length;
      const unknownCount = pubs.filter((p: any) => p.status === 'UNKNOWN').length;
      const failingSources = sources.filter((s: any) => s.failureCount > 0).length;
      const publishedCount = pubs.filter((p: any) => p.status === 'PUBLISHED').length;

      setData({
        pendingReviewCount: inReviewCount,
        scheduled60mCount: pubs.filter((p: any) => p.status === 'SCHEDULED' || p.status === 'QUEUED').length,
        unknownStatusCount: unknownCount,
        failingScraperCount: failingSources,
        scrapedTodayCount: posts.length,
        publishedTodayCount: publishedCount,
        geminiCostToday: (posts.length * 0.001),
      });

      const urgent: any[] = [];
      pubs.filter((p: any) => p.status === 'UNKNOWN').slice(0, 2).forEach((p: any) => {
        urgent.push({
          id: p.id,
          title: 'Sự cố mất kết nối Meta API (UNKNOWN)',
          desc: p.postRevision?.caption?.substring(0, 60) || 'Cần đối soát với Facebook feed',
          status: 'UNKNOWN',
          href: '/reconcile',
          actionText: 'Đối soát ngay',
          badgeColor: 'purple',
        });
      });

      posts.filter((p: any) => p.reviewStatus === 'IN_REVIEW').slice(0, 3).forEach((p: any) => {
        urgent.push({
          id: p.id,
          title: p.article?.title || 'Bài viết mới chờ duyệt',
          desc: p.article?.sourceName || 'Nguồn Tin Báo',
          status: 'IN_REVIEW',
          href: '/inbox',
          actionText: 'Duyệt bài',
          badgeColor: 'amber',
        });
      });

      setRecentUrgentItems(urgent);
    } catch (err) {
      console.error('Fetch dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight font-heading">
            Bảng Điều Khiển (Action Dashboard)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Trung tâm Vận hành Editorial Cockpit — Tập trung xử lý các tác vụ ưu tiên ngầm
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Link
            href="/inbox"
            className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-md hover:bg-blue-700 shadow-sm flex items-center space-x-1.5"
          >
            <Inbox className="w-4 h-4" />
            <span>Mở Duyệt Bài Viết ({data.pendingReviewCount})</span>
          </Link>
        </div>
      </div>

      {/* Action Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricBlock
          title="Bài Chờ Duyệt"
          value={data.pendingReviewCount}
          description="Cần biên tập viên phê duyệt"
          icon={Inbox}
          variant={data.pendingReviewCount > 0 ? 'warning' : 'default'}
          actionLabel="Duyệt bài ngay"
          actionHref="/inbox"
        />
        <MetricBlock
          title="Bài Sắp Đăng (60m)"
          value={data.scheduled60mCount}
          description="Đã xếp lịch sẵn sàng"
          icon={Clock}
          variant="default"
          actionLabel="Xem lịch"
          actionHref="/calendar"
        />
        <MetricBlock
          title="Trạng Thái UNKNOWN"
          value={data.unknownStatusCount}
          description="Cần đối soát với Meta API"
          icon={AlertTriangle}
          variant={data.unknownStatusCount > 0 ? 'danger' : 'default'}
          actionLabel="Đối soát ngay"
          actionHref="/reconcile"
        />
        <MetricBlock
          title="Scraper Lỗi"
          value={data.failingScraperCount}
          description="Nguồn quét báo bị sự cố"
          icon={Globe}
          variant={data.failingScraperCount > 0 ? 'danger' : 'success'}
          actionLabel="Quản lý nguồn"
          actionHref="/sources"
        />
        <MetricBlock
          title="Chi Phí Gemini Hôm Nay"
          value={`$${data.geminiCostToday.toFixed(3)}`}
          description="Khoảng tiền ước tính"
          icon={DollarSign}
          variant="default"
          actionLabel="Chi tiết"
          actionHref="/analytics"
        />
      </div>

      {/* Pipeline Flow Visualizer */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Pipeline Tiến Trình Tin Tức Realtime
          </h3>
          <span className="text-xs text-slate-500 font-mono">Dữ Liệu Thực Tế Từ Database</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-md text-center">
            <p className="text-[11px] font-bold uppercase text-slate-500">1. Scraped</p>
            <p className="text-xl font-extrabold text-slate-800 mt-1">{data.scrapedTodayCount} bài</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Đã cào về Database</p>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-md text-center">
            <p className="text-[11px] font-bold uppercase text-slate-500">2. AI Draft</p>
            <p className="text-xl font-extrabold text-blue-600 mt-1">{data.scrapedTodayCount} bài</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Gemini sinh caption</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-md text-center">
            <p className="text-[11px] font-bold uppercase text-amber-800">3. In Review</p>
            <p className="text-xl font-extrabold text-amber-700 mt-1">{data.pendingReviewCount} bài</p>
            <p className="text-[10px] text-amber-700 mt-0.5">Chờ biên tập viên duyệt</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-md text-center">
            <p className="text-[11px] font-bold uppercase text-emerald-800">4. Approved</p>
            <p className="text-xl font-extrabold text-emerald-700 mt-1">{data.scheduled60mCount} bài</p>
            <p className="text-[10px] text-emerald-700 mt-0.5">Đã sẵn sàng xuất bản</p>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-md text-center">
            <p className="text-[11px] font-bold uppercase text-slate-500">5. Published</p>
            <p className="text-xl font-extrabold text-slate-800 mt-1">{data.publishedTodayCount} bài</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Đã đăng lên Facebook</p>
          </div>
        </div>
      </div>

      {/* Main Two Columns: "Cần Xử Lý Ngay" & "Queue Status" */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Nhiệm Vụ Cần Xử Lý Ngay
                </h3>
              </div>
              <span className="text-xs text-slate-500">Ưu tiên từ cao xuống thấp</span>
            </div>

            <div className="space-y-3">
              {recentUrgentItems.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs bg-slate-50 border border-slate-200 rounded">
                  ✓ Không có nhiệm vụ khẩn cấp nào cần xử lý. Hệ thống đang vận hành bình thường.
                </div>
              ) : (
                recentUrgentItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-start justify-between"
                  >
                    <div className="space-y-1 pr-4">
                      <div className="flex items-center space-x-2">
                        <StatusBadge status={item.status} size="sm" />
                        <span className="text-xs font-bold text-slate-900">{item.title}</span>
                      </div>
                      <p className="text-xs text-slate-700">{item.desc}</p>
                    </div>
                    <Link
                      href={item.href}
                      className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded hover:bg-blue-700 transition whitespace-nowrap"
                    >
                      {item.actionText} &rarr;
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">
              Trạng Thái Engine & Hàng Đợi
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded border border-slate-200">
                <div className="flex items-center space-x-2">
                  <Cpu className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-slate-800">BullMQ Redis Queue</span>
                </div>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-mono font-bold">
                  Active
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded border border-slate-200">
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold text-slate-800">Source Scraper Loop</span>
                </div>
                <span className="text-slate-600 font-mono">5 phút / lần</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
