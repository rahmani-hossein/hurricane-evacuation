import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { DataIntegrityAlert } from './components/DataIntegrityAlert';
import { StatCards } from './components/StatCards';
import { MapView } from './components/MapView';
import { ReadinessBrief } from './components/ReadinessBrief';
import { CopilotBar } from './components/CopilotBar';
import { MOCK_LEE_COUNTY_DATA, CountyReadinessData, ShelterCandidate, VulnerableTract } from './mock/readinessData';
import { ChevronDown, Maximize2, MessageCircle, Minus, Send, X } from 'lucide-react';
import { MarkdownAnswer } from './components/MarkdownAnswer';

type AgentMessage = {
  id: number;
  query: string;
  answer: string;
  sources: Array<{ title: string; uri: string }>;
  model?: string;
  engineId?: string;
  county?: string;
};

export const App: React.FC = () => {
  const [selectedCounty, setSelectedCounty] = useState('Lee County');
  const [data, setData] = useState<CountyReadinessData>(MOCK_LEE_COUNTY_DATA);
  const [liveLeeCountyData, setLiveLeeCountyData] = useState<CountyReadinessData | null>(null);
  const [dataSourceLabel, setDataSourceLabel] = useState<string>('Connecting to BigQuery Gold API...');
  const [isLive, setIsLive] = useState<boolean>(false);
  const [selectedShelter, setSelectedShelter] = useState<ShelterCandidate | undefined>(undefined);
  const [, setSelectedTract] = useState<VulnerableTract | undefined>(undefined);
  const [isQueryLoading, setIsQueryLoading] = useState(false);
  const [conversation, setConversation] = useState<AgentMessage[]>([]);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isCopilotMinimized, setIsCopilotMinimized] = useState(false);
  const [followUp, setFollowUp] = useState('');

  useEffect(() => {
    async function loadInitialData() {
      try {
        const res = await fetch('/api/lee/readiness');
        if (res.ok) {
          const leeData = await res.json();
          setData(leeData);
          setIsLive(true);
          setDataSourceLabel('Live BigQuery Views (Lee County FIPS 12071)');
        } else {
          setDataSourceLabel('Baseline Cache Active');
        }
      } catch (err) {
        console.warn('Could not reach live readiness API, using baseline:', err);
        setDataSourceLabel('Baseline Cache Active');
      }
    }
    loadInitialData();
  }, []);

  const handleSelectCounty = async (county: string) => {
    setSelectedCounty(county);
    if (liveLeeCountyData) {
      setData(liveLeeCountyData);
      setIsLive(true);
      setDataSourceLabel('Live BigQuery Views (Lee County FIPS 12071)');
      return;
    }
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
  };

  const handleRunQuery = async (query: string) => {
    setIsCopilotOpen(true);
    setIsCopilotMinimized(false);
    setIsQueryLoading(true);
    try {
      const res = await fetch('/api/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, county: selectedCounty })
      });
      if (res.ok) {
        const payload = await res.json();
        setConversation((current) => [...current, {
          id: Date.now(),
          query,
          answer: payload.answer,
          sources: payload.sources || [],
          model: payload.model,
          engineId: payload.engine_id,
          county: payload.county
        }]);
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
      setConversation((current) => [...current, {
        id: Date.now(), query,
        answer: "FEMA NRI and SLOSH analysis flags 3 Lee County candidate shelters in coastal flood zones. Route residents to inland candidates and keep barrier-island sites out of the pre-landfall plan.",
        sources: [
          { title: "Estero High School", uri: "https://maps.google.com/?q=21900+River+Ranch+Rd,+Estero,+FL+33928" }
        ]
      }]);
    } else if (query.toLowerCase().includes('paratransit') || query.toLowerCase().includes('vehicle')) {
      setConversation((current) => [...current, {
        id: Date.now(), query,
        answer: "Lee County’s highest-priority tracts include Pine Island / Matlacha, where 412 households have no personal vehicle and the nearest verified inland shelter is 11.2 km away. Scheduled pre-landfall paratransit is required.",
        sources: [
          { title: "Estero High School", uri: "https://maps.google.com/?q=21900+River+Ranch+Rd,+Estero,+FL+33928" }
        ]
      }]);
    } else {
      setConversation((current) => [...current, {
        id: Date.now(), query,
        answer: "In Lee County, most candidate shelters have unrecorded wheelchair accessibility. The agent designates these as unrecorded rather than inaccessible, creating a verify-first inspection list.",
        sources: [
          { title: "Island Coast High School", uri: "https://maps.google.com/?q=2125+De+Navarra+Pkwy,+Cape+Coral,+FL+33909" }
        ]
      }]);
    }
  };

  const submitFollowUp = (event: React.FormEvent) => {
    event.preventDefault();
    if (!followUp.trim() || isQueryLoading) return;
    const query = followUp.trim();
    setFollowUp('');
    handleRunQuery(query);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 font-sans">
      {/* 1. Header Navigation */}
      <Navbar
        selectedCounty={selectedCounty}
        onSelectCounty={handleSelectCounty}
        dataSourceLabel={dataSourceLabel}
        isLive={isLive}
        onGenerateBrief={() => handleRunQuery('Generate the August Readiness Brief for Lee County')}
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

      {isCopilotOpen && (
        <aside className={`fixed z-[2000] border border-slate-700 bg-slate-900/98 shadow-2xl backdrop-blur-xl ${isCopilotMinimized ? 'bottom-20 right-4 w-72 rounded-xl' : 'inset-y-4 right-4 w-[min(560px,calc(100vw-2rem))] rounded-2xl'} flex flex-col`}>
          <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-emerald-400" />
              <div><div className="text-sm font-semibold text-white">Readiness Copilot</div><div className="text-[10px] text-slate-400">Lee County · follow-up enabled</div></div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setIsCopilotMinimized((value) => !value)} className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white" aria-label={isCopilotMinimized ? 'Expand copilot' : 'Minimize copilot'}>{isCopilotMinimized ? <Maximize2 className="h-4 w-4" /> : <Minus className="h-4 w-4" />}</button>
              <button onClick={() => setIsCopilotOpen(false)} className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white" aria-label="Close copilot"><X className="h-4 w-4" /></button>
            </div>
          </div>
          {!isCopilotMinimized && <>
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {!conversation.length && <div className="rounded-xl border border-dashed border-slate-700 p-4 text-xs text-slate-400">Ask a preparedness question to start a grounded conversation. Follow-up questions stay in this panel.</div>}
              {conversation.map((message) => <div key={message.id} className="space-y-2">
                <div className="ml-8 rounded-xl rounded-tr-sm bg-blue-600/20 px-3 py-2 text-xs text-blue-100">{message.query}</div>
                <div className="rounded-xl rounded-tl-sm border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs"><MarkdownAnswer content={message.answer} />
                  {message.sources.length > 0 && <div className="mt-3 border-t border-slate-700 pt-2"><div className="mb-1 text-[10px] uppercase tracking-wider text-slate-500">Google Maps grounding</div>{message.sources.map((source, index) => <div key={index} className="flex items-center justify-between gap-2 py-1"><span className="truncate text-slate-300">{source.title}</span><a href={source.uri} target="_blank" rel="noreferrer" className="shrink-0 text-[11px] text-blue-300 hover:underline">View place →</a></div>)}</div>}
                </div>
              </div>)}
              {isQueryLoading && <div className="flex items-center gap-2 text-xs text-slate-400"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" /> Consulting Lee County Agent Engine…</div>}
            </div>
            <form onSubmit={submitFollowUp} className="flex gap-2 border-t border-slate-700 p-3"><input value={followUp} onChange={(event) => setFollowUp(event.target.value)} placeholder="Ask a follow-up…" className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-blue-500" /><button disabled={isQueryLoading} className="rounded-lg bg-blue-600 px-3 text-white disabled:opacity-50" aria-label="Send follow-up"><Send className="h-4 w-4" /></button></form>
          </>}
        </aside>
      )}
    </div>
  );
};

export default App;
