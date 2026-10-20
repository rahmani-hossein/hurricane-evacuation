import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
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
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Initialize map centered on Lee County (Fort Myers / Cape Coral / Sanibel)
      const map = L.map(mapContainerRef.current, {
        center: [26.58, -81.95],
        zoom: 11,
        zoomControl: true,
      });

      // Dark / modern operational basemap
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19
      }).addTo(map);

      const markersGroup = L.layerGroup().addTo(map);
      markersLayerRef.current = markersGroup;
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    // 1. Draw connection polylines from critical tracts to inland shelters
    data.tracts.forEach(tract => {
      // Find nearest shelter
      let nearestShelter = data.shelters[0];
      let minDistance = 999;
      data.shelters.forEach(s => {
        const d = Math.hypot(s.lat - tract.lat, s.lon - tract.lon);
        if (d < minDistance) {
          minDistance = d;
          nearestShelter = s;
        }
      });

      if (nearestShelter && tract.riskTier === 'CRITICAL') {
        const latlngs: [number, number][] = [
          [tract.lat, tract.lon],
          [nearestShelter.lat, nearestShelter.lon]
        ];
        const line = L.polyline(latlngs, {
          color: '#f97316',
          weight: 2,
          opacity: 0.7,
          dashArray: '6, 8'
        });
        line.bindTooltip(`Transit Gap: ${tract.distanceToShelterKm} km straight-line`, { sticky: true });
        markersGroup.addLayer(line);
      }
    });

    // 2. Plot Vulnerable Tracts (Circles)
    data.tracts.forEach(tract => {
      const isCritical = tract.riskTier === 'CRITICAL';
      const circle = L.circleMarker([tract.lat, tract.lon], {
        radius: isCritical ? 14 : 10,
        fillColor: isCritical ? '#dc2626' : '#ea580c',
        color: '#ffffff',
        weight: 2,
        opacity: 0.9,
        fillOpacity: 0.65
      });

      const popupContent = `
        <div style="font-family: system-ui, sans-serif; font-size: 12px; line-height: 1.4; color: #1e293b;">
          <div style="font-weight: 700; color: #b91c1c; font-size: 13px;">${tract.name}</div>
          <div style="margin-top: 4px; padding-bottom: 4px; border-bottom: 1px solid #e2e8f0;">
            <strong>Risk Classification:</strong> <span style="background: #fee2e2; color: #991b1b; padding: 1px 4px; border-radius: 4px; font-weight: 600;">${tract.riskTier}</span>
          </div>
          <div style="margin-top: 4px;">
            <div>• <strong>No-Vehicle Households:</strong> ${tract.householdsNoVehicle} (${tract.pctNoVehicle}%)</div>
            <div>• <strong>Age 65+ Population:</strong> ${tract.pctAge65Plus}%</div>
            <div>• <strong>Mobile Homes:</strong> ${tract.mobileHomes}</div>
            <div>• <strong>Distance to Nearest Shelter:</strong> ${tract.distanceToShelterKm} km</div>
          </div>
        </div>
      `;

      circle.bindPopup(popupContent);
      circle.on('click', () => onSelectTract && onSelectTract(tract));
      markersGroup.addLayer(circle);
    });

    // 3. Plot Candidate Shelters
    data.shelters.forEach(shelter => {
      let pinColor = '#10b981'; // Green = Safe / verified
      let statusBadge = '🟢 Verified Safe & Open';

      if (shelter.inSurgeZone) {
        pinColor = '#ef4444'; // Red = Surge danger
        statusBadge = '🔴 SURGE ZONE HAZARD';
      } else if (shelter.wheelchairStatus === 'UNRECORDED') {
        pinColor = '#f59e0b'; // Amber = Unrecorded
        statusBadge = '🟡 Unrecorded Accessibility';
      }

      // Custom SVG Marker Icon
      const svgIcon = L.divIcon({
        className: 'custom-shelter-pin',
        html: `
          <div style="
            background-color: ${pinColor};
            width: 28px;
            height: 28px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 12px;
            font-weight: bold;
          ">
            ${shelter.inSurgeZone ? '!' : (shelter.isMedical ? '+' : 'S')}
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -14]
      });

      const marker = L.marker([shelter.lat, shelter.lon], { icon: svgIcon });

      const popupHtml = `
        <div style="font-family: system-ui, sans-serif; font-size: 12px; line-height: 1.4; color: #1e293b; min-width: 240px;">
          <div style="font-weight: 700; font-size: 13px; color: #0f172a;">${shelter.name}</div>
          <div style="color: #64748b; font-size: 11px;">${shelter.address}</div>
          
          <div style="margin-top: 6px; padding: 4px 6px; border-radius: 4px; font-weight: 600; font-size: 11px; background: ${shelter.inSurgeZone ? '#fee2e2; color: #991b1b;' : '#f1f5f9; color: #334155;'}">
            ${statusBadge}
          </div>

          <div style="margin-top: 6px; border-top: 1px solid #e2e8f0; padding-top: 4px;">
            <div>• <strong>Evacuation Capacity:</strong> ${shelter.capacity.toLocaleString()}</div>
            <div>• <strong>Wheelchair Access:</strong> 
              ${shelter.wheelchairStatus === 'YES' ? '<span style="color:#15803d; font-weight:bold;">Recorded YES</span>' : 
                (shelter.wheelchairStatus === 'UNRECORDED' ? '<span style="color:#b45309; font-weight:bold;">UNRECORDED (Unassessed)</span>' : '<span style="color:#b91c1c; font-weight:bold;">Recorded NO</span>')}
            </div>
            <div>• <strong>Backup Generator:</strong> ${shelter.generatorOnsite ? 'Yes (Equipped)' : 'No'}</div>
            <div>• <strong>Medical Designation:</strong> ${shelter.isMedical ? 'Medical-Needs Shelter' : 'General Population'}</div>
          </div>

          <div style="margin-top: 8px; padding-top: 6px; border-top: 1px dashed #cbd5e1; font-size: 10px; color: #475569;">
            <div>Verified live via <strong translate="no" style="color: #1e293b;">Google Maps</strong></div>
            <a href="${shelter.mapsPlaceUri}" target="_blank" style="color: #2563eb; text-decoration: underline; font-weight: 600; display: inline-block; margin-top: 2px;">
              View on Google Maps →
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      marker.on('click', () => onSelectShelter && onSelectShelter(shelter));
      markersGroup.addLayer(marker);
    });

  }, [data, selectedShelterId, onSelectShelter, onSelectTract]);

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950">
      {/* Map Legend Overlay */}
      <div className="absolute top-3 left-3 z-[1000] bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-lg p-3 text-xs text-slate-200 shadow-xl max-w-xs">
        <h3 className="font-bold text-white uppercase tracking-wider text-[11px] mb-2 border-b border-slate-800 pb-1">
          Geospatial Readiness Layers
        </h3>
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2">
            <span className="w-3.5 h-3.5 rounded-full bg-red-600 border border-white inline-block"></span>
            <span>Critical Vulnerability Tract (High No-Car & Senior)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3.5 h-3.5 rounded-full bg-orange-500 border border-white inline-block"></span>
            <span>High Vulnerability Tract</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 border border-white inline-block"></span>
            <span>Verified Shelter (Outside Surge Zone)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3.5 h-3.5 rounded-full bg-amber-500 border border-white inline-block"></span>
            <span>Unrecorded Wheelchair Status (Audit Target)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3.5 h-3.5 rounded-full bg-red-600 border border-white inline-block"></span>
            <span>In SLOSH Surge Zone (Unsafe for Landfall)</span>
          </div>
          <div className="flex items-center space-x-2 pt-1 border-t border-slate-800 text-orange-400 font-mono text-[10px]">
            <span>- - - Transit Gap Vector (Distance to Inland Shelter)</span>
          </div>
        </div>
      </div>

      {/* Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />
    </div>
  );
};
