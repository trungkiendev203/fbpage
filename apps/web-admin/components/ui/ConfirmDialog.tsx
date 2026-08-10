'use client';

import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  warningNote?: string;
  requireReason?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: (reason?: string) => void;
  onClose: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  description,
  warningNote,
  requireReason = false,
  confirmLabel = 'Xác Nhận Thực Hiện',
  cancelLabel = 'Hủy Bỏ',
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (requireReason && !reason.trim()) {
      setError('Vui lòng nhập lý do vận hành trước khi xác nhận.');
      return;
    }
    setError('');
    onConfirm(reason);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white border border-slate-200 rounded-lg shadow-xl w-full max-w-lg overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-md">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">{title}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">{description}</p>

          {warningNote && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700 font-medium">
              ⚠️ <strong>Cảnh báo rủi ro:</strong> {warningNote}
            </div>
          )}

          {requireReason && (
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                Lý Do Vận Hành <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                placeholder="Nhập lý do chi tiết (Ví dụ: Đã kiểm tra Facebook feed không có bài, thực hiện requeue đăng lại)..."
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  setError('');
                }}
                className="w-full border border-slate-300 rounded-md p-2.5 text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-semibold rounded-md hover:bg-slate-200"
            >
              {cancelLabel}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-md hover:bg-red-700 shadow-sm"
            >
              {confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
