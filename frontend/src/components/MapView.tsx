import React, { useEffect, useRef, useState } from 'react';
import { CountyReadinessData, ShelterCandidate, VulnerableTract } from '../mock/readinessData';

interface MapViewProps {
  data: CountyReadinessData;
  selectedShelterId?: number;
  onSelectShelter?: (shelter: ShelterCandidate) => void;
  onSelectTract?: (tract: VulnerableTract) => void;
}

export const MapView: React.FC<MapViewProps> = ({
  data,
  selectedShelterId,
  onSelectShelter,
  onSelectTract
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const overlaysRef = useRef<any[]>([]);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapsReady, setMapsReady] = useState(Boolean((window as any).google?.maps));
  const apiKey = ((window as any).__APP_CONFIG__?.googleMapsApiKey || import.meta.env.VITE_GOOGLE_MAPS_API_KEY) as string | undefined;

  useEffect(() => {
    if (!apiKey) return;
    if ((window as any).google?.maps) { setMapsReady(true); return; }
    const scriptId = 'google-maps-javascript-api';
    const existing = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => setMapsReady(true), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly`;
    script.onload = () => setMapsReady(true);
    script.onerror = () => setMapError('Google Maps could not load. Check the API key, billing, and Maps JavaScript API access.');
    document.head.appendChild(script);
  }, [apiKey]);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (!apiKey) { setMapError('Add VITE_GOOGLE_MAPS_API_KEY to frontend/.env.local to render the live map.'); return; }
    if (!mapsReady || !(window as any).google?.maps) { setMapError(apiKey ? 'Loading Google Maps…' : null); return; }
    setMapError(null);

    const googleMaps = (window as any).google.maps;
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new googleMaps.Map(mapContainerRef.current, {
        center: { lat: data.county.includes('Lee') ? 26.58 : 25.76, lng: data.county.includes('Lee') ? -81.95 : -80.19 },
        zoom: 10,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        clickableIcons: false,
      });
    }

    const map = mapInstanceRef.current;
    overlaysRef.current.forEach((overlay) => overlay.setMap(null));
    overlaysRef.current = [];
    const bounds = new googleMaps.LatLngBounds();
    const riskColor: Record<string, string> = { CRITICAL: '#ef4444', HIGH: '#f97316', MODERATE: '#f59e0b' };
    const infoWindow = new googleMaps.InfoWindow();
    const openInfo = (position: { lat: number; lng: number }, html: string) => { infoWindow.setPosition(position); infoWindow.setContent(html); infoWindow.open({ map }); };

    data.tracts.forEach((tract) => {
      const color = riskColor[tract.riskTier] || riskColor.MODERATE;
      const position = { lat: tract.lat, lng: tract.lon };
      const circle = new googleMaps.Circle({ map, center: position, radius: tract.riskTier === 'CRITICAL' ? 1050 : tract.riskTier === 'HIGH' ? 850 : 650, fillColor: color, fillOpacity: 0.28, strokeColor: color, strokeOpacity: 0.95, strokeWeight: 2, zIndex: tract.riskTier === 'CRITICAL' ? 3 : 2 });
      circle.addListener('click', () => { onSelectTract?.(tract); openInfo(position, `<div style="font:13px system-ui;min-width:220px"><strong>${tract.name}</strong><div style="margin-top:6px;color:${color};font-weight:700">${tract.riskTier} · Gold score ${tract.riskScore ?? 'n/a'}</div><div style="margin-top:6px">${tract.householdsNoVehicle.toLocaleString()} no-vehicle households (${tract.pctNoVehicle}%)<br/>${tract.pctAge65Plus}% age 65+ · ${tract.distanceToShelterKm} km to shelter</div></div>`); });
      overlaysRef.current.push(circle); bounds.extend(position);

      if (tract.riskTier !== 'MODERATE' && data.shelters.length) {
        const nearest = data.shelters.reduce((best, shelter) => Math.hypot(shelter.lat - tract.lat, shelter.lon - tract.lon) < Math.hypot(best.lat - tract.lat, best.lon - tract.lon) ? shelter : best, data.shelters[0]);
        const line = new googleMaps.Polyline({ map, path: [position, { lat: nearest.lat, lng: nearest.lon }], strokeColor: '#fb923c', strokeOpacity: 0.7, strokeWeight: 2, icons: [{ icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 3 }, offset: '0', repeat: '12px' }] });
        overlaysRef.current.push(line);
      }
    });

    data.shelters.forEach((shelter) => {
      const position = { lat: shelter.lat, lng: shelter.lon };
      const color = shelter.inSurgeZone ? '#ef4444' : shelter.wheelchairStatus === 'UNRECORDED' ? '#f59e0b' : '#10b981';
      const marker = new googleMaps.Marker({ map, position, title: shelter.name, icon: { path: googleMaps.SymbolPath.CIRCLE, scale: shelter.isMedical ? 10 : 8, fillColor: color, fillOpacity: 1, strokeColor: '#ffffff', strokeWeight: 2 } });
      marker.addListener('click', () => { onSelectShelter?.(shelter); openInfo(position, `<div style="font:13px system-ui;min-width:240px"><strong>${shelter.name}</strong><div style="color:#64748b;margin-top:2px">${shelter.address}</div><div style="margin-top:6px;color:${color};font-weight:700">${shelter.inSurgeZone ? 'SURGE ZONE HAZARD' : shelter.wheelchairStatus === 'UNRECORDED' ? 'Accessibility needs validation' : 'Verified candidate shelter'}</div><div style="margin-top:6px">Capacity: ${shelter.capacity.toLocaleString()}<br/>${shelter.isMedical ? 'Medical-needs shelter' : 'General population'} · Generator: ${shelter.generatorOnsite ? 'yes' : 'no'}</div><a href="${shelter.mapsPlaceUri}" target="_blank" style="display:inline-block;margin-top:8px">Open in Google Maps →</a></div>`); });
      overlaysRef.current.push(marker); bounds.extend(position);
    });
    if (!bounds.isEmpty()) map.fitBounds(bounds, { top: 90, right: 40, bottom: 40, left: 40 });
    return () => infoWindow.close();
  }, [apiKey, data, mapsReady, onSelectShelter, onSelectTract]);

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950">
      {/* Map Legend Overlay */}
      <div className="absolute top-3 left-3 z-[1000] bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-lg p-3 text-xs text-slate-200 shadow-xl max-w-xs">
        <h3 className="font-bold text-white uppercase tracking-wider text-[11px] mb-2 border-b border-slate-800 pb-1">
          Geospatial Readiness Layers
        </h3>
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2">
            <span className="w-3.5 h-3.5 rounded-full bg-red-600/80 border border-red-200 inline-block"></span>
            <span>Critical tract · gold mobility score ≥ 38</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3.5 h-3.5 rounded-full bg-orange-500/80 border border-orange-200 inline-block"></span>
            <span>High tract · gold score ≥ 30</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3.5 h-3.5 rounded-full bg-amber-400/80 border border-amber-200 inline-block"></span>
            <span>Moderate tract · outreach context</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 border border-white inline-block"></span>
            <span>Verified Shelter (Outside Surge Zone)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3.5 h-3.5 rounded-full bg-amber-500 border border-white inline-block"></span>
            <span>Unrecorded Wheelchair Status (Audit Target)</span>
          </div>
          <div className="flex items-center space-x-2 pt-1 border-t border-slate-800 text-orange-400 font-mono text-[10px]">
            <span>- - - Transit Gap Vector (Distance to Inland Shelter)</span>
          </div>
        </div>
      </div>

      {/* Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />
      {mapError && <div className="absolute inset-0 z-[900] flex items-center justify-center bg-slate-950/92 p-6 text-center"><div className="max-w-md rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"><div className="text-sm font-bold text-white">Google Maps layer unavailable</div><div className="mt-2 text-xs leading-5 text-slate-400">{mapError}</div><div className="mt-4 text-[10px] uppercase tracking-wider text-slate-500">The gold risk layer is ready; configure the Maps JavaScript API key to render it.</div></div></div>}
    </div>
  );
};
