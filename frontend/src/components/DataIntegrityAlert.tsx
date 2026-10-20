import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';

interface DataIntegrityAlertProps {
  unrecordedPct: number;
}

export const DataIntegrityAlert: React.FC<DataIntegrityAlertProps> = ({ unrecordedPct }) => {
  return (
    <div className="bg-amber-950/40 border-b border-amber-500/30 px-6 py-2.5 flex items-center justify-between text-xs text-amber-200">
      <div className="flex items-center space-x-2.5">
        <div className="bg-amber-500/20 p-1 rounded text-amber-400">
          <AlertTriangle className="w-4 h-4" />
        </div>
        <div>
          <strong className="font-semibold text-amber-300">Data Integrity Notice (Federal NSS Registry): </strong>
          <span>
            <strong className="text-white underline decoration-amber-400">{unrecordedPct}%</strong> of shelter accessibility records in this jurisdiction are unrecorded at source.
            This dashboard designates them as <span className="bg-amber-800/80 px-1.5 py-0.5 rounded text-amber-100 font-mono font-bold">UNRECORDED</span> rather than <span className="bg-red-950/80 line-through px-1.5 py-0.5 rounded text-red-300 font-mono">INACCESSIBLE</span> to prevent catastrophic false negatives.
          </span>
        </div>
      </div>
      <div className="hidden md:flex items-center space-x-1 text-amber-400/80 text-[11px]">
        <Info className="w-3.5 h-3.5" />
        <span>Pre-season physical ramp audits recommended</span>
      </div>
    </div>
  );
};
