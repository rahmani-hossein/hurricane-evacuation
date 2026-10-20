import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { DataIntegrityAlert } from './components/DataIntegrityAlert';
import { StatCards } from './components/StatCards';
import { MapView } from './components/MapView';
import { ReadinessBrief } from './components/ReadinessBrief';
import { CopilotBar } from './components/CopilotBar';
import { MOCK_LEE_COUNTY_DATA, ShelterCandidate, VulnerableTract } from './mock/readinessData';
import { CheckCircle2, X } from 'lucide-react';

export const App: React.FC = () => {
  const [selectedCounty, setSelectedCounty] = useState('Lee County');
  const [data] = useState(MOCK_LEE_COUNTY_DATA);
  const [selectedShelter, setSelectedShelter] = useState<ShelterCandidate | undefined>(undefined);
  const [, setSelectedTract] = useState<VulnerableTract | undefined>(undefined);
  const [agentResponseModal, setAgentResponseModal] = useState<{
    query: string;
    answer: string;
    sources: Array<{ title: string; uri: string }>;
  } | null>(null);

  const handleRunQuery = (query: string) => {
    // Realistic agent response simulation with Maps grounding attribution
    if (query.toLowerCase().includes('surge')) {
      setAgentResponseModal({
        query,
        answer: "FEMA NRI and SLOSH analysis identify 3 candidate shelters in Lee County located inside Category 2 storm surge boundaries (including Shelter #1088: Sanibel Community House and Shelter #1204: Fort Myers Beach Elementary). In August planning, these facilities should be de-designated as pre-landfall evacuation shelters.",
        sources: [
          { title: "Sanibel Community House", uri: "https://maps.google.com/?cid=1088_sanibel_house" },
          { title: "Fort Myers Beach Elementary", uri: "https://maps.google.com/?cid=1204_fmb_elem" }
        ]
      });
    } else if (query.toLowerCase().includes('paratransit') || query.toLowerCase().includes('vehicle')) {
      setAgentResponseModal({
        query,
        answer: "Tract 801.02 (Pine Island/Matlacha) contains 412 zero-vehicle households and is located 11.2 km straight-line from Estero High School. Recommending staging 6 paratransit buses at Pine Island Center 36 hours prior to forecast tropical storm force winds.",
        sources: [
          { title: "Estero High School", uri: "https://maps.google.com/?cid=1042_estero_hs" }
        ]
      });
    } else {
      setAgentResponseModal({
        query,
        answer: "Based on our August pre-season brief: 87.5% of shelter accessibility data is unrecorded in federal NSS records. We recommend focusing physical ramp inspections on high-capacity inland schools like Island Coast High School (2,600 capacity) before September 1.",
        sources: [
          { title: "Island Coast High School", uri: "https://maps.google.com/?cid=1195_island_coast" }
        ]
      });
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 font-sans">
      {/* 1. Header Navigation */}
      <Navbar selectedCounty={selectedCounty} onSelectCounty={setSelectedCounty} />

      {/* 2. Critical Data Integrity Notice ("Unrecorded != No") */}
      <DataIntegrityAlert unrecordedPct={data.summary.unrecordedAccessibilityPct} />

      {/* 3. Executive Metrics Bar */}
      <StatCards summary={data.summary} />

      {/* 4. Main Operations Canvas: Split-Screen Map & Brief */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Left: Geospatial Map (60%) */}
        <div className="flex-1 h-full relative">
          <MapView
            data={data}
            selectedShelterId={selectedShelter?.id}
            onSelectShelter={setSelectedShelter}
            onSelectTract={setSelectedTract}
          />
        </div>

        {/* Right: The Official Readiness Brief Panel (40%) */}
        <div className="w-full md:w-[480px] lg:w-[540px] h-full shrink-0">
          <ReadinessBrief
            data={data}
            onSelectShelter={setSelectedShelter}
            onSelectTract={setSelectedTract}
          />
        </div>
      </div>

      {/* 5. Bottom Interactive Copilot Command Bar */}
      <CopilotBar onRunQuery={handleRunQuery} />

      {/* Agent Response Modal */}
      {agentResponseModal && (
        <div className="fixed inset-0 z-[2000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setAgentResponseModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold mb-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Preparedness Copilot Response</span>
            </div>

            <h3 className="text-white font-bold text-sm mb-3">"{agentResponseModal.query}"</h3>
            <p className="text-slate-300 text-xs leading-relaxed mb-4 bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60">
              {agentResponseModal.answer}
            </p>

            <div className="pt-3 border-t border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-2">
                Grounding Sources (<span translate="no" className="font-semibold text-slate-200">Google Maps</span>):
              </span>
              <div className="space-y-1.5">
                {agentResponseModal.sources.map((s, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs bg-slate-950 p-2 rounded border border-slate-800">
                    <span className="text-slate-200 font-medium">{s.title}</span>
                    <a
                      href={s.uri}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-400 hover:underline text-[11px]"
                    >
                      View Place →
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
