import React from 'react';

export type AnyBadgeStatus =
  | 'DRAFT'
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'INVALIDATED'
  | 'SCHEDULED'
  | 'QUEUED'
  | 'PUBLISHING'
  | 'PUBLISHED'
  | 'RETRY_WAIT'
  | 'UNKNOWN'
  | 'FAILED_PERMANENT'
  | 'CANCELLED'
  | 'ACTIVE'
  | 'PAUSED'
  | 'ERROR_DISABLED';

interface StatusBadgeProps {
  status: AnyBadgeStatus;
  size?: 'sm' | 'md';
}

const BADGE_CONFIG: Record<AnyBadgeStatus, { label: string; bg: string; text: string; border: string }> = {
  DRAFT: { label: 'Bản Nháp', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
  IN_REVIEW: { label: 'Chờ Duyệt', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  APPROVED: { label: 'Đã Duyệt', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  REJECTED: { label: 'Từ Chối', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  INVALIDATED: { label: 'Hủy Hiệu Lực', bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-300' },
  SCHEDULED: { label: 'Đã Lên Lịch', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  QUEUED: { label: 'Trong Hàng Đợi', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  PUBLISHING: { label: 'Đang Đăng...', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  PUBLISHED: { label: 'Đã Đăng', bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-300' },
  RETRY_WAIT: { label: 'Chờ Thử Lại', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  UNKNOWN: { label: 'Cần Đối Soát (UNKNOWN)', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-300' },
  FAILED_PERMANENT: { label: 'Thất Bại Vĩnh Viễn', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-300' },
  CANCELLED: { label: 'Đã Hủy', bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
  ACTIVE: { label: 'Hoạt Động', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  PAUSED: { label: 'Tạm Dừng', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  ERROR_DISABLED: { label: 'Lỗi Tắt Quét', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
};

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = BADGE_CONFIG[status] || {
    label: status,
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs font-medium' : 'px-2.5 py-1 text-xs font-semibold';

  return (
    <span
      className={`inline-flex items-center rounded-md border ${config.bg} ${config.text} ${config.border} ${sizeClasses}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-75"></span>
      {config.label}
    </span>
  );
}
