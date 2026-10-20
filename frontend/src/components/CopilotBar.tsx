import React, { useState } from 'react';
import { Send, Sparkles, Compass } from 'lucide-react';
import { VoiceConversation } from './VoiceConversation';

interface CopilotBarProps {
  onRunQuery: (query: string) => void;
  selectedCounty?: string;
}

export const CopilotBar: React.FC<CopilotBarProps> = ({ onRunQuery, selectedCounty = 'Lee County' }) => {
  const [input, setInput] = useState('');

  const quickPrompts = [
    "📋 August Readiness Brief",
    "⚖️ Equity Audit",
    "What are the top 3 stranded tracts in Lee County?",
    "Candidate shelters within 2 km of Tract 12071020801",
    "How many residents rely on medical electricity (emPOWER)?",
    "State B verify-first checklist for unrecorded shelters"
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onRunQuery(input);
    setInput('');
  };

  const handlePromptClick = (q: string) => {
    if (q.includes('Readiness Brief')) {
      onRunQuery("Generate the August Readiness Brief for Lee County");
    } else if (q.includes('Equity Audit')) {
      onRunQuery("Run the equity audit on Lee County prioritized tracts and explain whether the plan landed where people cannot leave or where forms were filled in.");
    } else {
      onRunQuery(q);
    }
  };

  return (
    <div className="bg-slate-900 border-t border-slate-800 p-3 shrink-0">
      {/* Quick Prompt Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs">
        <span className="text-slate-500 font-mono text-[11px] flex items-center gap-1 shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          Preparedness Queries:
        </span>
        {quickPrompts.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handlePromptClick(q)}
            className={`border rounded-full px-3 py-1 whitespace-nowrap text-xs transition-colors shrink-0 ${
              q.includes('Readiness Brief')
                ? 'bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 hover:text-white border-blue-500/60 font-semibold'
                : q.includes('Equity Audit')
                ? 'bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 hover:text-white border-purple-500/60 font-semibold'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
            }`}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input bar */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-1">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <Compass className="w-4 h-4 text-emerald-400" />
          </div>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Preparedness Copilot (e.g., 'What should we fix in Matlacha before September?')..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-sans"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
        >
          <span>Query</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
      <VoiceConversation county={selectedCounty} />
    </div>
  );
};
