import React from 'react';
import { ExternalLink, CheckCircle2 } from 'lucide-react';

interface MapsAttributionProps {
  title: string;
  address: string;
  placeUri: string;
  placeId?: string;
  groundingStatus: string;
  lastVerified?: string;
}

export const MapsAttribution: React.FC<MapsAttributionProps> = ({
  title,
  address,
  placeUri,
  placeId,
  groundingStatus,
  lastVerified
}) => {
  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-lg p-3 my-2 text-xs shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="font-semibold text-slate-100 text-sm">{title}</h4>
          <p className="text-slate-400 mt-0.5">{address}</p>
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-full whitespace-nowrap">
          <CheckCircle2 className="w-3 h-3" />
          {groundingStatus}
        </span>
      </div>

      <div className="mt-2.5 pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-slate-400 text-[11px]">
        <div className="flex items-center space-x-1.5">
          <span>Verified live via</span>
          <span translate="no" className="font-bold text-white tracking-wide">
            Google Maps
          </span>
          {placeId && (
            <span className="font-mono text-slate-500 text-[10px] hidden sm:inline">
              ({placeId})
            </span>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {lastVerified && <span className="text-slate-500">{lastVerified}</span>}
          <a
            href={placeUri}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-0.5 hover:underline"
          >
            <span>View Place</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
