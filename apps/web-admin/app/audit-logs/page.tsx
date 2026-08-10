'use client';

import React from 'react';
import { FileText, Shield, User, Clock } from 'lucide-react';
import { formatDate } from '../../lib/utils';

export default function AuditLogsPage() {
  const auditLogs = [
    {
      id: 'audit-1',
      action: 'OPERATOR_RECONCILE_MARK_PUBLISHED',
      userName: 'Super Administrator',
      resourceType: 'PUBLICATION',
      resourceId: 'pub-201',
      ipAddress: '127.0.0.1',
      timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    },
    {
      id: 'audit-2',
      action: 'POST_APPROVAL',
      userName: 'Super Administrator',
      resourceType: 'POST',
      resourceId: 'post-102',
      ipAddress: '127.0.0.1',
      timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-3">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Audit Logs</h1>
        <p className="text-xs text-slate-500">
          Nhật Ký Ghi Nhận Mọi Thao Tác Vận Hành & Bảo Mật Hệ Thống
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase">
            <tr>
              <th className="px-4 py-3">Hành Động (Action)</th>
              <th className="px-4 py-3">Người Thao Tác</th>
              <th className="px-4 py-3">Loại Tài Nguyên</th>
              <th className="px-4 py-3">Resource ID</th>
              <th className="px-4 py-3">IP Address</th>
              <th className="px-4 py-3">Thời Gian</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
            {auditLogs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50 transition">
                <td className="px-4 py-3 font-bold text-blue-700">{log.action}</td>
                <td className="px-4 py-3 font-sans text-slate-900 font-semibold">{log.userName}</td>
                <td className="px-4 py-3 text-slate-700">{log.resourceType}</td>
                <td className="px-4 py-3 text-slate-500">{log.resourceId}</td>
                <td className="px-4 py-3 text-slate-500">{log.ipAddress}</td>
                <td className="px-4 py-3 text-slate-600 font-sans">{formatDate(log.timestamp)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
