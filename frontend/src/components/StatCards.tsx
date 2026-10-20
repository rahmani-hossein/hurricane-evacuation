import React from 'react';
import { Car, Zap, Users, AlertOctagon } from 'lucide-react';
import { CountyReadinessData } from '../mock/readinessData';

interface StatCardsProps {
  summary: CountyReadinessData['summary'];
}

export const StatCards: React.FC<StatCardsProps> = ({ summary }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-slate-900/60 border-b border-slate-800 shrink-0">
      {/* Zero Vehicle Households */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3">
        <div className="flex items-center justify-between text-slate-400 text-xs">
          <span>Zero-Vehicle Households</span>
          <Car className="w-4 h-4 text-amber-400" />
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-xl font-bold text-white font-mono">
            {summary.totalCarlessHouseholds.toLocaleString()}
          </span>
          <span className="text-[11px] text-amber-400 font-medium">Cannot Drive</span>
        </div>
        <p className="text-[10px] text-slate-500 mt-1">ACS 2022 Census Tracts</p>
      </div>

      {/* Power / Medical Dependent */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3">
        <div className="flex items-center justify-between text-slate-400 text-xs">
          <span>Power-Dependent Patients</span>
          <Zap className="w-4 h-4 text-rose-400" />
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-xl font-bold text-white font-mono">
            {summary.powerDependentResidents.toLocaleString()}
          </span>
          <span className="text-[11px] text-rose-400 font-medium">Electricity Critical</span>
        </div>
        <p className="text-[10px] text-slate-500 mt-1">HHS emPOWER Registry</p>
      </div>

      {/* Evacuation Shelter Capacity */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3">
        <div className="flex items-center justify-between text-slate-400 text-xs">
          <span>Available Shelter Capacity</span>
          <Users className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-xl font-bold text-white font-mono">
            {summary.totalShelterCapacity.toLocaleString()}
          </span>
          <span className="text-[11px] text-emerald-400 font-medium">Spaces</span>
        </div>
        <p className="text-[10px] text-slate-500 mt-1">FEMA NSS Pre-Landfall EVAC</p>
      </div>

      {/* Surge Zone Shelters */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3">
        <div className="flex items-center justify-between text-slate-400 text-xs">
          <span>Surge-Exposed Shelters</span>
          <AlertOctagon className="w-4 h-4 text-red-500" />
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-xl font-bold text-red-400 font-mono">
            {summary.surgeExposedSheltersCount}
          </span>
          <span className="text-[11px] text-red-400 font-medium">In SLOSH Zone!</span>
        </div>
        <p className="text-[10px] text-slate-500 mt-1">De-designation recommended</p>
      </div>
    </div>
  );
};
