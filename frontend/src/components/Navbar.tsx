import React from 'react';
import { ShieldAlert, Compass, MapPin, Database } from 'lucide-react';

interface NavbarProps {
  selectedCounty: string;
  onSelectCounty: (county: string) => void;
  dataSourceLabel?: string;
  isLive?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ selectedCounty, onSelectCounty, dataSourceLabel, isLive }) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white px-6 py-3 flex flex-wrap items-center justify-between gap-4 select-none shrink-0">
      <div className="flex items-center space-x-3">
        <div className="bg-red-500/20 border border-red-500/50 p-2 rounded-lg text-red-400">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-lg tracking-tight text-white">Florida Adaptive Evacuation Readiness</h1>
            <span className="bg-blue-500/20 text-blue-300 text-xs px-2 py-0.5 rounded font-mono border border-blue-500/30">
              August Pre-Season
            </span>
            {dataSourceLabel && (
              <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full font-mono border ${
                isLive ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                {dataSourceLabel}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">
            County Emergency Management Preparedness Copilot • Planning Horizon: 3 Weeks Pre-Landfall
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Target County Scope: Lee County Only */}
        <div className="flex items-center space-x-2 bg-slate-800/90 border border-emerald-500/40 rounded-lg px-3 py-1.5 shadow-sm">
          <MapPin className="w-4 h-4 text-emerald-400" />
          <span className="text-xs text-slate-400">Scope:</span>
          <span className="text-sm font-semibold text-white">Lee County, FL</span>
          <span className="text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800/80 px-1.5 py-0.5 rounded font-bold">FIPS 12071</span>
        </div>

        {/* Engine indicators */}
        <div className="hidden lg:flex items-center space-x-3 text-xs text-slate-400 border-l border-slate-800 pl-4">
          <span className="inline-flex items-center gap-1">
            <Database className="w-3.5 h-3.5 text-blue-400" />
            BigQuery <code className="text-slate-300 font-mono">evacuation_readiness</code>
          </span>
          <span className="inline-flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            <span translate="no" className="font-semibold text-slate-200">Google Maps Grounding</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></span>
            Agent API: <code className="text-purple-300 font-mono text-[11px]">evacuation-agent-api</code>
          </span>
        </div>
      </div>
    </header>
  );
};
