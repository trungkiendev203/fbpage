import React from 'react';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';

interface MetricBlockProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  actionLabel?: string;
  actionHref?: string;
  variant?: 'default' | 'warning' | 'danger' | 'success';
}

export default function MetricBlock({
  title,
  value,
  description,
  icon: Icon,
  actionLabel,
  actionHref,
  variant = 'default',
}: MetricBlockProps) {
  const variantStyles = {
    default: 'border-slate-200 bg-white text-slate-900',
    warning: 'border-amber-200 bg-amber-50/50 text-slate-900',
    danger: 'border-red-200 bg-red-50/50 text-slate-900',
    success: 'border-emerald-200 bg-emerald-50/50 text-slate-900',
  };

  const iconStyles = {
    default: 'bg-slate-100 text-slate-700',
    warning: 'bg-amber-100 text-amber-800',
    danger: 'bg-red-100 text-red-800',
    success: 'bg-emerald-100 text-emerald-800',
  };

  return (
    <div className={`p-5 rounded-lg border shadow-sm flex flex-col justify-between ${variantStyles[variant]}`}>
      <div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</span>
          <div className={`p-2 rounded-md ${iconStyles[variant]}`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline">
          <span className="text-3xl font-bold tracking-tight text-slate-900">{value}</span>
        </div>
        {description && <p className="mt-1 text-xs text-slate-600 font-normal">{description}</p>}
      </div>

      {actionLabel && actionHref && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <Link
            href={actionHref}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center"
          >
            {actionLabel} &rarr;
          </Link>
        </div>
      )}
    </div>
  );
}
