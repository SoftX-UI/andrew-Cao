import React, { useState, useEffect, useRef } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { Mission, MissionStatus } from '../types';
import { Badge, Button, Card } from './Shared';
import { 
  MapPin, 
  Navigation, 
  ShieldAlert, 
  Compass, 
  Key, 
  CheckCircle2, 
  Lock, 
  Radio, 
  Crosshair, 
  Layers, 
  Settings, 
  ExternalLink, 
  Route, 
  Zap, 
  Clock, 
  AlertTriangle, 
  ChevronRight, 
  Flag, 
  Maximize2, 
  RefreshCw,
  Eye,
  Check
} from 'lucide-react';
import { STATUS_COLORS, DIFFICULTY_COLORS } from '../constants';

interface RealmMapProps {
  missions: Mission[];
  selectedMissionId: string | null;
  onSelectMission: (id: string | null) => void;
  onUpdateStatus?: (missionId: string, status: MissionStatus, reason?: string) => void;
}

// Convert string mission ID / location to deterministic lat/lng coordinates
const locationToLatLng = (seed: string, index: number): { lat: number; lng: number; address: string } => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Base coordinates around San Francisco / Bay Area or Global Hubs
  const baseLat = 37.7749;
  const baseLng = -122.4194;
  
  const latOffset = ((Math.abs(hash) % 200) - 100) / 1000; // ~10km radius
  const lngOffset = ((Math.abs(hash * 3) % 200) - 100) / 1000;
  
  return {
    lat: Number((baseLat + latOffset).toFixed(4)),
    lng: Number((baseLng + lngOffset).toFixed(4)),
    address: `Sector ${(Math.abs(hash) % 89) + 10}-${String.fromCharCode(65 + (index % 6))}`
  };
};

// Route polyline drawer component for Google Maps
const RoutePolyline: React.FC<{
  path: { lat: number; lng: number }[];
}> = ({ path }) => {
  const map = useMap();
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!map || path.length < 2) return;

    if (polylineRef.current) {
      polylineRef.current.setMap(null);
    }

    const polyline = new google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: '#06b6d4', // Cyan 500
      strokeOpacity: 0.8,
      strokeWeight: 4,
      icons: [{
        icon: {
          path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: 3,
          strokeColor: '#22d3ee',
          fillColor: '#22d3ee',
          fillOpacity: 1,
        },
        offset: '50%',
        repeat: '100px'
      }],
      map
    });

    polylineRef.current = polyline;

    // Fit bounds
    const bounds = new google.maps.LatLngBounds();
    path.forEach(p => bounds.extend(p));
    map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });

    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
      }
    };
  }, [map, path]);

  return null;
};

export const RealmMap: React.FC<RealmMapProps> = ({
  missions,
  selectedMissionId,
  onSelectMission,
  onUpdateStatus
}) => {
  // Permission & API Key State
  const [permissionGranted, setPermissionGranted] = useState<boolean>(() => {
    return localStorage.getItem('realm_map_permission') === 'true';
  });
  const [showPermissionModal, setShowPermissionModal] = useState<boolean>(false);
  const [mapMode, setMapMode] = useState<'google' | 'tactical'>('google');
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid' | 'terrain'>('hybrid');

  const API_KEY = process.env.GOOGLE_MAPS_PLATFORM_KEY || 
                  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY || 
                  '';

  const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

  const handleGrantPermission = () => {
    setPermissionGranted(true);
    localStorage.setItem('realm_map_permission', 'true');
    setShowPermissionModal(false);
  };

  const handleRevokePermission = () => {
    setPermissionGranted(false);
    localStorage.setItem('realm_map_permission', 'false');
  };

  // Map missions to lat/lng
  const mappedMissions = missions.map((m, idx) => {
    const coords = locationToLatLng(m.id + m.title, idx);
    return {
      ...m,
      lat: coords.lat,
      lng: coords.lng,
      sectorName: coords.address
    };
  });

  const selectedMission = mappedMissions.find(m => m.id === selectedMissionId) || mappedMissions[0];

  // Generate route waypoints for selected mission
  const routeWaypoints = selectedMission ? [
    { name: 'Guild Staging HQ', lat: 37.7749, lng: -122.4194, type: 'start', desc: 'Equipment dispatch & mission brief' },
    { name: 'Checkpoint Alpha', lat: (37.7749 + selectedMission.lat) / 2 + 0.005, lng: (-122.4194 + selectedMission.lng) / 2 - 0.005, type: 'waypoint', desc: 'Tactical resupply & comms link' },
    { name: `Target: ${selectedMission.title}`, lat: selectedMission.lat, lng: selectedMission.lng, type: 'target', desc: selectedMission.location },
    { name: 'Exfil Zone Bravo', lat: selectedMission.lat - 0.008, lng: selectedMission.lng + 0.01, type: 'exfil', desc: 'Secure extraction point' }
  ] : [];

  const routePath = routeWaypoints.map(w => ({ lat: w.lat, lng: w.lng }));

  // Calculate approximate route distance
  const routeDistanceKm = selectedMission ? (
    Math.sqrt(Math.pow(selectedMission.lat - 37.7749, 2) + Math.pow(selectedMission.lng - (-122.4194), 2)) * 111
  ).toFixed(1) : '12.4';

  const estDurationMin = Math.round(Number(routeDistanceKm) * 2.5 + 5);

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* Header Bar */}
      <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-950/80 border border-cyan-800/50 rounded-lg text-cyan-400">
            <Route size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold font-mono text-sm tracking-wide text-slate-100 uppercase">
                REALM_MAP // ROUTE_NETWORK
              </h3>
              <Badge className={permissionGranted ? "bg-emerald-950/80 text-emerald-400 border-emerald-800" : "bg-amber-950/80 text-amber-400 border-amber-800"}>
                {permissionGranted ? "LIVE UPLINK ACTIVE" : "LOCAL MODE"}
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Displaying real-world tactical coordinates & mission routes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Permission Toggle / Connection Dialog Button */}
          <button
            onClick={() => setShowPermissionModal(true)}
            className={`px-3 py-1.5 rounded text-xs font-mono border flex items-center gap-1.5 transition-all ${
              permissionGranted 
                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' 
                : 'bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/30'
            }`}
          >
            <Key size={13} />
            {permissionGranted ? 'Map Permissions & Key' : 'Connect Map Apps'}
          </button>

          {/* Toggle View Mode */}
          <div className="flex bg-slate-950 p-0.5 rounded border border-slate-800">
            <button
              onClick={() => setMapMode('google')}
              className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                mapMode === 'google' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Google Map
            </button>
            <button
              onClick={() => setMapMode('tactical')}
              className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                mapMode === 'tactical' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tactical Grid
            </button>
          </div>
        </div>
      </div>

      {/* Main Map Body */}
      <div className="flex-1 flex flex-col lg:flex-row relative overflow-hidden min-h-[420px]">
        {/* Permission Request Modal / Overlay if prompted */}
        {showPermissionModal && (
          <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-md p-6 flex items-center justify-center animate-in fade-in duration-200">
            <Card className="max-w-lg w-full bg-slate-900 border-cyan-800/60 p-6 space-y-5 shadow-2xl relative">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-cyan-950 rounded-xl border border-cyan-800 text-cyan-400">
                    <Navigation size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold font-mono text-slate-100">
                      Connect Google Maps & Realm Map
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                      Location & Cartography Permission Request
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowPermissionModal(false)}
                  className="text-slate-500 hover:text-slate-300 font-mono text-sm"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-300 leading-relaxed bg-slate-950/80 p-4 rounded-lg border border-slate-800 font-mono">
                <p className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-cyan-400 shrink-0 mt-0.5" />
                  <span><strong>Mission Route Navigation:</strong> Renders real-world satellite terrain, multi-stage waypoints, and travel vectors for active missions.</span>
                </p>
                <p className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-cyan-400 shrink-0 mt-0.5" />
                  <span><strong>Google Maps API Key Integration:</strong> Connects to Google Maps Platform API using your <code>GOOGLE_MAPS_PLATFORM_KEY</code>.</span>
                </p>
                <p className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-cyan-400 shrink-0 mt-0.5" />
                  <span><strong>Privacy First:</strong> No personal tracking data is sent externally. Route calculations are processed client-side.</span>
                </p>
              </div>

              {/* API Key Setup Instructions */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2 text-xs font-mono">
                <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">
                  Google Maps API Key Setup Instructions:
                </span>
                <ol className="list-decimal list-inside space-y-1 text-slate-300">
                  <li>Get an API key from <a href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" target="_blank" rel="noreferrer" className="text-cyan-400 underline inline-flex items-center gap-1">Google Cloud Console <ExternalLink size={10}/></a></li>
                  <li>In AI Studio top toolbar, click <strong>Settings (⚙️)</strong> → <strong>Secrets</strong></li>
                  <li>Add Secret Name: <code>GOOGLE_MAPS_PLATFORM_KEY</code></li>
                  <li>Paste your API Key and press <strong>Enter</strong> to auto-rebuild</li>
                </ol>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button 
                  onClick={handleGrantPermission}
                  className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs h-10 justify-center"
                >
                  <Check size={16} /> GRANT PERMISSION & CONNECT
                </Button>
                {permissionGranted && (
                  <Button 
                    onClick={handleRevokePermission}
                    variant="secondary"
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs h-10 justify-center"
                  >
                    REVOKE PERMISSION
                  </Button>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Left Side: Map Render Area */}
        <div className="flex-1 relative bg-slate-950 min-h-[380px]">
          {mapMode === 'google' && permissionGranted && hasValidKey ? (
            <APIProvider apiKey={API_KEY} version="weekly">
              <Map
                defaultCenter={{ lat: selectedMission?.lat || 37.7749, lng: selectedMission?.lng || -122.4194 }}
                defaultZoom={12}
                mapId="REALM_TACTICAL_MAP"
                mapTypeId={mapType}
                internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                style={{ width: '100%', height: '100%', minHeight: '380px' }}
                options={{
                  disableDefaultUI: false,
                  zoomControl: true,
                  mapTypeControl: true,
                  streetViewControl: false
                }}
              >
                {/* Mission Markers */}
                {mappedMissions.map((m) => {
                  const isSelected = m.id === selectedMissionId;
                  return (
                    <AdvancedMarker
                      key={m.id}
                      position={{ lat: m.lat, lng: m.lng }}
                      onClick={() => onSelectMission(m.id)}
                      title={m.title}
                    >
                      <div className={`cursor-pointer transition-transform duration-200 ${isSelected ? 'scale-125 z-20' : 'hover:scale-110'}`}>
                        <Pin
                          background={isSelected ? '#06b6d4' : m.status === MissionStatus.Urgent ? '#ef4444' : '#10b981'}
                          borderColor={isSelected ? '#ffffff' : '#0284c7'}
                          glyphColor="#ffffff"
                        />
                      </div>
                    </AdvancedMarker>
                  );
                })}

                {/* Draw Route Polyline if mission selected */}
                {selectedMission && (
                  <RoutePolyline path={routePath} />
                )}

                {/* Info Window for Selected Mission */}
                {selectedMission && (
                  <InfoWindow
                    position={{ lat: selectedMission.lat, lng: selectedMission.lng }}
                    onCloseClick={() => onSelectMission(null)}
                  >
                    <div className="p-2 max-w-xs text-slate-900 font-sans">
                      <span className="text-[10px] font-bold text-cyan-700 block uppercase">{selectedMission.type}</span>
                      <h4 className="font-bold text-sm leading-tight text-slate-900">{selectedMission.title}</h4>
                      <p className="text-xs text-slate-600 mt-1">{selectedMission.location}</p>
                      <div className="mt-2 pt-2 border-t flex justify-between items-center text-xs">
                        <span className="font-bold text-emerald-700">{selectedMission.reward} CR</span>
                        <span className="font-mono text-[10px] text-slate-500">{selectedMission.difficulty}</span>
                      </div>
                    </div>
                  </InfoWindow>
                )}
              </Map>
            </APIProvider>
          ) : (
            /* Fallback Tactical Canvas Map or Key Setup Guide */
            <div className="w-full h-full relative bg-slate-950 flex flex-col items-center justify-center p-6 border-r border-slate-800">
              {/* Animated Tactical Grid Map Background */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.1)_1px,transparent_1px)] bg-[size:32px_32px]"></div>
              
              {/* SVG Tactical Route Canvas */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <line x1="20%" y1="70%" x2="45%" y2="40%" stroke="#06b6d4" strokeWidth="3" strokeDasharray="6 4" className="animate-pulse" />
                <line x1="45%" y1="40%" x2="75%" y2="30%" stroke="#06b6d4" strokeWidth="3" />
                <line x1="75%" y1="30%" x2="85%" y2="60%" stroke="#e11d48" strokeWidth="2" strokeDasharray="4 4" />
                
                {/* SVG Waypoint Nodes */}
                <circle cx="20%" cy="70%" r="8" fill="#10b981" />
                <circle cx="45%" cy="40%" r="6" fill="#06b6d4" />
                <circle cx="75%" cy="30%" r="10" fill="#06b6d4" stroke="#ffffff" strokeWidth="2" />
                <circle cx="85%" cy="60%" r="7" fill="#f43f5e" />
              </svg>

              {/* Centered Notice & Action Banner */}
              <div className="relative z-10 max-w-md w-full text-center bg-slate-900/90 backdrop-blur-md border border-slate-800 p-6 rounded-xl shadow-2xl space-y-4">
                <div className="w-12 h-12 mx-auto rounded-full bg-cyan-950 border border-cyan-700/50 flex items-center justify-center text-cyan-400">
                  <Compass size={24} className="animate-spin-slow" />
                </div>
                
                <div>
                  <h4 className="text-base font-bold font-mono text-slate-100">
                    {!permissionGranted ? "Realm Map Connection Pending" : "Google Maps Key Setup Needed"}
                  </h4>
                  <p className="text-xs text-slate-400 font-mono mt-1">
                    {!permissionGranted 
                      ? "Grant map permission to sync real-world coordinates and live Google Maps satellite routing."
                      : "Add your `GOOGLE_MAPS_PLATFORM_KEY` in Secrets to unlock Google Maps satellite tiles & live route computation."
                    }
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  {!permissionGranted ? (
                    <Button 
                      onClick={() => setShowPermissionModal(true)}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs h-9 justify-center"
                    >
                      <Key size={14} /> AUTHORIZE MAP & ROUTING UPLINK
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => setShowPermissionModal(true)}
                      className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs h-9 justify-center"
                    >
                      <Settings size={14} /> CONFIGURE GOOGLE MAPS API KEY
                    </Button>
                  )}
                  
                  <button
                    onClick={() => setMapMode('tactical')}
                    className="text-xs text-slate-400 hover:text-cyan-400 font-mono underline"
                  >
                    Continue in Tactical Grid Mode
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Map Overlay Controls */}
          <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
            <div className="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-lg p-1 flex gap-1 font-mono text-[10px]">
              {(['hybrid', 'satellite', 'roadmap', 'terrain'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setMapType(t)}
                  className={`px-2 py-1 rounded capitalize transition-colors ${
                    mapType === t ? 'bg-cyan-950 text-cyan-400 border border-cyan-800' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Mission Route Breakdown & Intel Panel */}
        <div className="w-full lg:w-80 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col overflow-y-auto custom-scrollbar">
          {selectedMission ? (
            <div className="p-4 space-y-4 font-mono">
              {/* Mission Intel Header */}
              <div className="border-b border-slate-800 pb-3">
                <div className="flex justify-between items-center mb-1.5">
                  <Badge className={`${STATUS_COLORS[selectedMission.status]} border-none`}>
                    {selectedMission.status}
                  </Badge>
                  <span className="text-[10px] text-slate-400">{selectedMission.sectorName}</span>
                </div>
                <h4 className="font-bold text-sm text-slate-100 uppercase tracking-wide">
                  {selectedMission.title}
                </h4>
                <p className="text-xs text-cyan-400 mt-1 flex items-center gap-1">
                  <MapPin size={12} /> {selectedMission.location}
                </p>
              </div>

              {/* Route Summary Metrics */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                  <span className="text-[9px] text-slate-500 uppercase block mb-0.5">Route Distance</span>
                  <span className="text-cyan-400 font-bold flex items-center gap-1">
                    <Navigation size={12} /> {routeDistanceKm} km
                  </span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                  <span className="text-[9px] text-slate-500 uppercase block mb-0.5 font-mono">Est. Transport</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <Clock size={12} /> {estDurationMin} mins
                  </span>
                </div>
              </div>

              {/* Waypoints Flow */}
              <div>
                <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Route size={12} className="text-cyan-400" /> TACTICAL WAYPOINT STAGES
                </h5>
                <div className="space-y-2 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                  {routeWaypoints.map((wp, idx) => (
                    <div key={idx} className="relative pl-7 group">
                      <div className={`absolute left-1.5 top-1.5 -translate-x-1/2 w-3 h-3 rounded-full border-2 ${
                        wp.type === 'start' ? 'bg-emerald-500 border-emerald-300' :
                        wp.type === 'target' ? 'bg-cyan-500 border-white animate-pulse' :
                        wp.type === 'exfil' ? 'bg-rose-500 border-rose-300' :
                        'bg-slate-700 border-slate-500'
                      }`} />
                      <div className="bg-slate-950/80 p-2 rounded border border-slate-800/80 group-hover:border-slate-700 transition-colors">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-200">{wp.name}</span>
                          <span className="text-[9px] text-slate-500">STAGE {idx + 1}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">{wp.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mission Actions */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                {onUpdateStatus && selectedMission.status === MissionStatus.Open && (
                  <Button 
                    onClick={() => onUpdateStatus(selectedMission.id, MissionStatus.Claimed, "Claimed from Realm Map")}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs h-9 justify-center"
                  >
                    <Flag size={14} /> CLAIM MISSION & LOCK ROUTE
                  </Button>
                )}
                <Button 
                  onClick={() => {
                    const googleNavUrl = `https://www.google.com/maps/dir/?api=1&destination=${selectedMission.lat},${selectedMission.lng}`;
                    window.open(googleNavUrl, '_blank', 'noopener,noreferrer');
                  }}
                  variant="secondary"
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 font-mono text-xs h-9 justify-center"
                >
                  <ExternalLink size={14} /> OPEN IN GOOGLE MAPS APP
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-slate-500 font-mono text-xs my-auto">
              SELECT A MISSION FROM THE MAP TO VIEW ITS ROUTE & WAYPOINTS
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
