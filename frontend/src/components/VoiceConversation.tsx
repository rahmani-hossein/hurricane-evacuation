import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, PhoneOff, Volume2 } from 'lucide-react';

type VoiceEvent = { type: string; text?: string; message?: string };

interface VoiceConversationProps {
  county: string;
}

const pcmBase64 = (samples: Float32Array) => {
  const buffer = new ArrayBuffer(samples.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < samples.length; i += 1) {
    const value = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(i * 2, value < 0 ? value * 0x8000 : value * 0x7fff, true);
  }
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
};

export const VoiceConversation: React.FC<VoiceConversationProps> = ({ county }) => {
  const [status, setStatus] = useState<'offline' | 'connecting' | 'ready' | 'listening' | 'thinking' | 'error'>('offline');
  const [transcript, setTranscript] = useState('');
  const [answer, setAnswer] = useState('');
  const socketRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const inputContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextAudioTimeRef = useRef(0);

  const playPcm = (base64: string, mimeType?: string) => {
    const context = outputContextRef.current || new AudioContext();
    outputContextRef.current = context;
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const samples = new Int16Array(bytes.buffer);
    const sampleRate = Number(mimeType?.match(/rate=(\d+)/)?.[1] || 24000);
    const audio = context.createBuffer(1, samples.length, sampleRate);
    const channel = audio.getChannelData(0);
    for (let i = 0; i < samples.length; i += 1) channel[i] = samples[i] / 32768;
    const source = context.createBufferSource();
    source.buffer = audio;
    source.connect(context.destination);
    const startAt = Math.max(context.currentTime, nextAudioTimeRef.current);
    source.start(startAt);
    nextAudioTimeRef.current = startAt + audio.duration;
  };

  const stopCapture = () => {
    processorRef.current?.disconnect();
    processorRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (socketRef.current?.readyState === WebSocket.OPEN) socketRef.current.send(JSON.stringify({ type: 'audio_end' }));
    if (status === 'listening') setStatus('thinking');
  };

  const startCapture = async () => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const context = inputContextRef.current || new AudioContext({ sampleRate: 16000 });
    inputContextRef.current = context;
    const source = context.createMediaStreamSource(stream);
    const processor = context.createScriptProcessor(4096, 1, 1);
    processor.onaudioprocess = (event) => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: 'audio', data: pcmBase64(event.inputBuffer.getChannelData(0)), mimeType: 'audio/pcm;rate=16000' }));
      }
    };
    source.connect(processor);
    const muteMonitor = context.createGain();
    muteMonitor.gain.value = 0;
    processor.connect(muteMonitor);
    muteMonitor.connect(context.destination);
    streamRef.current = stream;
    processorRef.current = processor;
    setStatus('listening');
  };

  const connect = () => {
    setStatus('connecting');
    setTranscript('');
    setAnswer('');
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const socket = new WebSocket(`${protocol}://${window.location.host}/api/voice`);
    socket.onopen = () => socket.send(JSON.stringify({ type: 'start', county, userId: 'coordinator_voice' }));
    socket.onmessage = (event) => {
      const message = JSON.parse(event.data) as VoiceEvent & { data?: string; mimeType?: string };
      if (message.type === 'session_started') setStatus('ready');
      if (message.type === 'user_transcript') setTranscript(message.text || '');
      if (message.type === 'agent_transcript') setAnswer((current) => `${current} ${message.text || ''}`.trim());
      if (message.type === 'audio' && message.data) playPcm(message.data, message.mimeType);
      if (message.type === 'tool_started') setStatus('thinking');
      if (message.type === 'agent_turn_complete') setStatus('ready');
      if (message.type === 'error') setStatus('error');
    };
    socket.onerror = () => setStatus('error');
    socket.onclose = () => setStatus('offline');
    socketRef.current = socket;
  };

  const disconnect = () => {
    stopCapture();
    socketRef.current?.send(JSON.stringify({ type: 'stop' }));
    socketRef.current?.close();
    socketRef.current = null;
    nextAudioTimeRef.current = 0;
    setStatus('offline');
  };

  useEffect(() => () => disconnect(), []);

  const isActive = status !== 'offline' && status !== 'error';
  const label = status === 'listening' ? 'Listening… release to send' : status === 'thinking' ? 'Agent is checking readiness…' : status === 'connecting' ? 'Connecting…' : 'Talk to readiness agent';

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-emerald-900/60 bg-emerald-950/20 px-3 py-2">
      <button
        type="button"
        onClick={isActive ? (status === 'listening' ? stopCapture : startCapture) : connect}
        disabled={status === 'connecting' || status === 'thinking'}
        className={`flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition-colors ${status === 'listening' ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white hover:bg-emerald-500 disabled:bg-slate-700'}`}
        aria-label={status === 'listening' ? 'Stop recording' : label}
      >
        {status === 'listening' ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
        {label}
      </button>
      {isActive && <button type="button" onClick={disconnect} className="text-slate-400 hover:text-white" aria-label="End voice session"><PhoneOff className="h-4 w-4" /></button>}
      <div className="min-w-[220px] flex-1 text-[11px] text-slate-400">
        <div className="flex items-center gap-1 text-emerald-300"><Volume2 className="h-3 w-3" /> Voice context: {county}</div>
        {transcript && <div className="mt-1 truncate text-slate-300">You: {transcript}</div>}
        {answer && <div className="mt-1 line-clamp-2 text-slate-200">Agent: {answer}</div>}
        {status === 'error' && <div className="mt-1 text-amber-300">Voice is unavailable; use text chat or try again.</div>}
      </div>
    </div>
  );
};
