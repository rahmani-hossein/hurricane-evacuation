import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { DataIntegrityAlert } from './components/DataIntegrityAlert';
import { StatCards } from './components/StatCards';
import { MapView } from './components/MapView';
import { ReadinessBrief } from './components/ReadinessBrief';
import { CopilotBar } from './components/CopilotBar';
import { MOCK_MIAMI_DADE_DATA, MOCK_LEE_COUNTY_DATA, CountyReadinessData, ShelterCandidate, VulnerableTract } from './mock/readinessData';
import { CheckCircle2, X, Copy, Check } from 'lucide-react';

export const App: React.FC = () => {
  const [selectedCounty, setSelectedCounty] = useState('Lee County');
  const [data, setData] = useState<CountyReadinessData>(MOCK_LEE_COUNTY_DATA);
  const [liveMiamiDadeData, setLiveMiamiDadeData] = useState<CountyReadinessData | null>(null);
  const [liveLeeCountyData, setLiveLeeCountyData] = useState<CountyReadinessData | null>(null);
  const [dataSourceLabel, setDataSourceLabel] = useState<string>('Connecting to BigQuery Gold API...');
  const [isLive, setIsLive] = useState<boolean>(false);
  const [selectedShelter, setSelectedShelter] = useState<ShelterCandidate | undefined>(undefined);
  const [, setSelectedTract] = useState<VulnerableTract | undefined>(undefined);
  const [isQueryLoading, setIsQueryLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [agentResponseModal, setAgentResponseModal] = useState<{
    query: string;
    answer: string;
    sources: Array<{ title: string; uri: string }>;
    model?: string;
    engineId?: string;
    county?: string;
    isAi?: boolean;
  } | null>(null);

  useEffect(() => {
    async function loadInitialData() {
      try {
        const res = await fetch('/api/lee/readiness');
        if (res.ok) {
          const goldData = await res.json();
          setLiveLeeCountyData(goldData);
          setData(goldData);
          setIsLive(true);
          setDataSourceLabel('Live BigQuery Views (Lee County FIPS 12071)');
        } else {
          setDataSourceLabel('Baseline Cache Active (Lee County)');
        }
      } catch (err) {
        console.warn('Could not reach live readiness API, using baseline:', err);
        setDataSourceLabel('Baseline Cache Active (Lee County)');
      }
    }
    loadInitialData();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAgentResponseModal(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCopyResponse = () => {
    if (!agentResponseModal?.answer) return;
    navigator.clipboard.writeText(agentResponseModal.answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSelectCounty = async (county: string) => {
    setSelectedCounty(county);
    if (county.includes('Lee')) {
      if (liveLeeCountyData) {
        setData(liveLeeCountyData);
        setIsLive(true);
        setDataSourceLabel('Live BigQuery Views (Lee County FIPS 12071)');
      } else {
        try {
          const res = await fetch('/api/lee/readiness');
          if (res.ok) {
            const leeData = await res.json();
            setLiveLeeCountyData(leeData);
            setData(leeData);
            setIsLive(true);
            setDataSourceLabel('Live BigQuery Views (Lee County FIPS 12071)');
          } else {
            setData(MOCK_LEE_COUNTY_DATA);
            setIsLive(false);
            setDataSourceLabel('Offline Demo Cache (Lee County)');
          }
        } catch {
          setData(MOCK_LEE_COUNTY_DATA);
          setIsLive(false);
          setDataSourceLabel('Offline Demo Cache (Lee County)');
        }
      }
    } else {
      if (liveMiamiDadeData) {
        setData(liveMiamiDadeData);
        setIsLive(true);
        setDataSourceLabel('Live BigQuery Gold API (Miami-Dade FIPS 12086)');
      } else {
        try {
          const res = await fetch('/api/miami-dade/readiness');
          if (res.ok) {
            const miamiData = await res.json();
            setLiveMiamiDadeData(miamiData);
            setData(miamiData);
            setIsLive(true);
            setDataSourceLabel('Live BigQuery Gold API (Miami-Dade FIPS 12086)');
          } else {
            setData(MOCK_MIAMI_DADE_DATA);
            setIsLive(false);
            setDataSourceLabel('Baseline Cache Active');
          }
        } catch {
          setData(MOCK_MIAMI_DADE_DATA);
          setIsLive(false);
          setDataSourceLabel('Baseline Cache Active');
        }
      }
    }
  };

  const handleRunQuery = async (query: string) => {
    setIsQueryLoading(true);
    try {
      const res = await fetch('/api/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, county: selectedCounty })
      });
      if (res.ok) {
        const payload = await res.json();
        setAgentResponseModal({
          query,
          answer: payload.answer,
          sources: payload.sources || [],
          model: payload.model,
          engineId: payload.engine_id,
          county: payload.county,
          isAi: payload.is_ai_generated
        });
        setIsQueryLoading(false);
        return;
      }
    } catch (err) {
      console.warn('Falling back to built-in reasoning:', err);
    } finally {
      setIsQueryLoading(false);
    }

    // Client-side fallback if server offline
    if (query.toLowerCase().includes('surge')) {
      setAgentResponseModal({
        query,
        answer: "FEMA NRI and SLOSH analysis confirm all candidate EVAC shelters in Miami-Dade are located outside Category 2 surge zones. In Lee County, 3 shelters are flagged in coastal flood zones.",
        sources: [
          { title: "Robert C. Morgan High School", uri: "https://maps.google.com/?cid=ChIJt2Ah773D2YgRXrgXnbOxtbI" }
        ]
      });
    } else if (query.toLowerCase().includes('paratransit') || query.toLowerCase().includes('vehicle')) {
      setAgentResponseModal({
        query,
        answer: "Tract 9807.00 (Homestead) has 65.6% zero-vehicle households and is 7.3 straight-line miles from Robert C. Morgan High. Scheduled pre-landfall paratransit depots are required.",
        sources: [
          { title: "Robert C. Morgan High School", uri: "https://maps.google.com/?cid=ChIJt2Ah773D2YgRXrgXnbOxtbI" }
        ]
      });
    } else {
      setAgentResponseModal({
        query,
        answer: "In Miami-Dade County, 95.4% (104 of 109) candidate shelters have unrecorded wheelchair accessibility. The agent designates these as unrecorded rather than inaccessible to avoid false negatives.",
        sources: [
          { title: "Miami Southridge High School", uri: "https://maps.google.com/?cid=ChIJgaqKh4PD2YgRDwc62Qyh5jc" }
        ]
      });
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 font-sans">
      {/* 1. Header Navigation */}
      <Navbar
        selectedCounty={selectedCounty}
        onSelectCounty={handleSelectCounty}
        dataSourceLabel={dataSourceLabel}
        isLive={isLive}
      />

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
      <CopilotBar onRunQuery={handleRunQuery} selectedCounty={selectedCounty} />

      {/* Loading Modal */}
      {isQueryLoading && (
        <div className="fixed inset-0 z-[2000] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-blue-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col items-center text-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <h3 className="text-white font-bold text-sm mb-1">Consulting Teammate Evacuation Agent API...</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Invoking <span className="text-blue-300 font-medium">Teammate Agent API (evacuation-agent-api)</span> with live BigQuery tools & Google Maps Grounding.
            </p>
          </div>
        </div>
      )}

      {/* Live Agent Response Modal */}
      {agentResponseModal && (
        <div className="fixed inset-0 z-[2000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[85vh] flex flex-col">
            <button
              onClick={() => setAgentResponseModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
              title="Close (Esc)"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col gap-1 mb-2 pr-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>{agentResponseModal.model || 'Teammate Evacuation Agent API'}</span>
                </div>
                <span className="text-[10px] bg-blue-950 text-blue-300 px-2 py-0.5 rounded border border-blue-800">
                  {agentResponseModal.county || selectedCounty} Grounded
                </span>
              </div>
              {agentResponseModal.engineId && (
                <div className="text-[10px] font-mono text-slate-400 bg-slate-950/80 px-2 py-1 rounded border border-slate-800 truncate">
                  Backend: <span className="text-blue-400">{agentResponseModal.engineId}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mb-3 pr-8">
              <h3 className="text-white font-bold text-sm truncate mr-2">"{agentResponseModal.query}"</h3>
              <button
                onClick={handleCopyResponse}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg border border-slate-700 transition-colors shrink-0"
                title="Copy agent brief to clipboard"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>Copy Brief</span>
                  </>
                )}
              </button>
            </div>
            <div className="overflow-y-auto pr-1 flex-1 mb-4">
              <p className="text-slate-200 text-xs leading-relaxed bg-slate-800/80 p-4 rounded-xl border border-slate-700/60 whitespace-pre-line">
                {agentResponseModal.answer}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800 shrink-0">
              <span className="text-[11px] text-slate-400 block mb-2">
                Grounding Sources (<span translate="no" className="font-semibold text-slate-200">Google Maps</span>):
              </span>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {agentResponseModal.sources.map((s, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs bg-slate-950 p-2 rounded border border-slate-800">
                    <span className="text-slate-200 font-medium truncate mr-2">{s.title}</span>
                    <a
                      href={s.uri}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-400 hover:underline text-[11px] shrink-0"
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
