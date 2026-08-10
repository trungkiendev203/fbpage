import React from 'react';
import { Activity, Server, Database, Cpu } from 'lucide-react';

interface SystemHealthProps {
  apiStatus?: 'READY' | 'UNHEALTHY';
  dbStatus?: 'CONNECTED' | 'DISCONNECTED';
}

export default function SystemHealthIndicator({
  apiStatus = 'READY',
  dbStatus = 'CONNECTED',
}: SystemHealthProps) {
  const isHealthy = apiStatus === 'READY' && dbStatus === 'CONNECTED';

  return (
    <div className="flex items-center space-x-3 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-md text-xs">
      <div className="flex items-center space-x-1.5">
        <span
          className={`w-2 h-2 rounded-full ${
            isHealthy ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
          }`}
        ></span>
        <span className="font-semibold text-slate-700">System Pipeline:</span>
      </div>

      <div className="flex items-center space-x-2 text-slate-600 font-mono text-[11px]">
        <span className="flex items-center space-x-1" title="API Server Probe">
          <Server className="w-3 h-3 text-slate-500" />
          <span className={apiStatus === 'READY' ? 'text-emerald-700 font-semibold' : 'text-red-600'}>
            API
          </span>
        </span>

        <span>•</span>

        <span className="flex items-center space-x-1" title="PostgreSQL Database Probe">
          <Database className="w-3 h-3 text-slate-500" />
          <span className={dbStatus === 'CONNECTED' ? 'text-emerald-700 font-semibold' : 'text-red-600'}>
            DB
          </span>
        </span>

        <span>•</span>

        <span className="flex items-center space-x-1" title="BullMQ / Outbox Worker Engine Probe">
          <Cpu className="w-3 h-3 text-slate-500" />
          <span className="text-emerald-700 font-semibold">Worker</span>
        </span>
      </div>
    </div>
  );
}
