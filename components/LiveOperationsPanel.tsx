
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Mission, User, MissionStatus } from '../types';
import { Card, Badge, Button } from './Shared';
import { Radio, AlertCircle, Users, ChevronLeft, ChevronRight, GripVertical, Minimize2, Maximize2, Crosshair, Zap, Plus, DollarSign, ScanLine, CloudLightning, Skull, WifiOff, Target, Navigation, Shield, PlayCircle, X, Briefcase, ZoomIn, ZoomOut, ChevronDown, ChevronUp, Maximize, Minimize, Bookmark, CheckCircle2, Activity, Radar, Server, Signal } from 'lucide-react';
import { STATUS_COLORS, DIFFICULTY_COLORS } from '../constants';

interface LiveOperationsPanelProps {
  missions: Mission[];
  currentUser: User;
  customStatusColors: Record<string, string>;
  onUpdateStatus: (missionId: string, status: MissionStatus, reason?: string) => void;
  onSelectMission?: (id: string) => void;
}

interface IncomingSignal {
    id: string;
    x: number;
    y: number;
    title: string;
    reward: number;
    expiresAt: number;
}

interface Hazard {
    id: string;
    x: number;
    y: number;
    type: 'storm' | 'monster' | 'interference';
    severity: 'low' | 'medium' | 'high';
}

const GENERATE_COORDS = (seed: string) => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    // Keep away from very edges (10% padding)
    return (Math.abs(hash) % 80) + 10;
};

export const LiveOperationsPanel: React.FC<LiveOperationsPanelProps> = ({ 
    missions, 
    currentUser, 
    customStatusColors, 
    onUpdateStatus,
    onSelectMission
}) => {
    const [layoutMode, setLayoutMode] = useState<'split' | 'expanded' | 'compressed'>('split');
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [isFeedCollapsed, setIsFeedCollapsed] = useState(false);
    const [mapZoom, setMapZoom] = useState(1);
    
    const [isScanning, setIsScanning] = useState(false);
    const [incomingSignals, setIncomingSignals] = useState<IncomingSignal[]>([]);
    const [hazards, setHazards] = useState<Hazard[]>([]);
    const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null);
    const [commsLog, setCommsLog] = useState<{id: string, text: string, type: 'info' | 'alert' | 'success', time: string}[]>([
        { id: 'init', text: 'Tactical Uplink Established. Standing by.', type: 'success', time: new Date().toLocaleTimeString() }
    ]);
    
    // Telemetry Mock Data
    const [telemetry, setTelemetry] = useState({ cpu: 12, uplink: 98, latency: 24 });

    // Update Telemetry Randomly
    useEffect(() => {
        const interval = setInterval(() => {
            setTelemetry({
                cpu: Math.floor(Math.random() * 30) + 10,
                uplink: Math.floor(Math.random() * 5) + 95,
                latency: Math.floor(Math.random() * 20) + 15
            });
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    // Filter active/urgent missions including Claimed ones for full lifecycle visibility
    const activeMissions = useMemo(() => missions.filter(m => 
        m.status === MissionStatus.InProgress || 
        m.status === MissionStatus.Urgent || 
        m.status === MissionStatus.Verifying ||
        m.status === MissionStatus.Open ||
        m.status === MissionStatus.Claimed
    ).map(m => ({
        ...m,
        x: GENERATE_COORDS(m.id + 'x'),
        y: GENERATE_COORDS(m.id + 'y')
    })), [missions]);

    const selectedMission = activeMissions.find(m => m.id === selectedMissionId);

    const addToLog = (text: string, type: 'info' | 'alert' | 'success' = 'info') => {
        setCommsLog(prev => [{
            id: Date.now().toString(),
            text,
            type,
            time: new Date().toLocaleTimeString()
        }, ...prev].slice(0, 50));
    };

    // Simulate "Income Quests" / Signals / Hazards appearing
    useEffect(() => {
        let interval: any;
        if (isScanning) {
            interval = setInterval(() => {
                const rand = Math.random();
                // 20% chance signal
                if (rand > 0.8) {
                    const newSignal: IncomingSignal = {
                        id: `sig_${Date.now()}`,
                        x: 10 + Math.random() * 80, 
                        y: 10 + Math.random() * 80,
                        title: 'Weak Signal',
                        reward: Math.floor(Math.random() * 500) + 100,
                        expiresAt: Date.now() + 15000 
                    };
                    setIncomingSignals(prev => [...prev, newSignal]);
                    addToLog(`Unidentified Signal at Sector ${Math.floor(newSignal.x)}-${Math.floor(newSignal.y)}.`, 'info');
                }
                // 10% chance hazard
                else if (rand < 0.1) {
                    const types: Hazard['type'][] = ['storm', 'monster', 'interference'];
                    const newHazard: Hazard = {
                        id: `haz_${Date.now()}`,
                        x: 10 + Math.random() * 80,
                        y: 10 + Math.random() * 80,
                        type: types[Math.floor(Math.random() * types.length)],
                        severity: Math.random() > 0.5 ? 'high' : 'medium'
                    };
                    setHazards(prev => [...prev, newHazard]);
                    addToLog(`ALERT: ${newHazard.type.toUpperCase()} manifest near Sector ${Math.floor(newHazard.x)}-${Math.floor(newHazard.y)}!`, 'alert');
                    
                    // Remove hazard after 20s
                    setTimeout(() => {
                        setHazards(prev => prev.filter(h => h.id !== newHazard.id));
                    }, 20000);
                }
            }, 2000);
        }
        return () => clearInterval(interval);
    }, [isScanning]);

    // Clean up expired signals
    useEffect(() => {
        const interval = setInterval(() => {
            setIncomingSignals(prev => prev.filter(s => s.expiresAt > Date.now()));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleAcceptSignal = (signalId: string, reward: number) => {
        setIncomingSignals(prev => prev.filter(s => s.id !== signalId));
        addToLog(`Signal Decoded. Asset Secured. +${reward} Credits transferred.`, 'success');
    };

    const handleClaim = (mission: Mission) => {
        onUpdateStatus(mission.id, MissionStatus.Claimed, "Claimed via Live Ops");
        addToLog(`Mission ${mission.id} claimed. Awaiting deployment sequence.`, 'success');
    };

    const handleDeploy = (mission: Mission) => {
        onUpdateStatus(mission.id, MissionStatus.InProgress, "Deployed via Live Ops");
        addToLog(`Unit deployed to Mission ${mission.id}. Status: ACTIVE`, 'success');
    };

    const handleSupportAction = (action: string) => {
        addToLog(`Support Action: ${action} executed for ${selectedMission?.id || 'General Area'}.`, 'info');
    };

    // Mission Detail Card Component
    const MissionIntelCard = ({ mission, isFloating = false }: { mission: any, isFloating?: boolean }) => (
        <Card className={`flex-1 flex flex-col bg-slate-950 border-slate-800 animate-in slide-in-from-right-4 duration-300 ${isFloating ? 'h-auto max-h-[500px] shadow-2xl border border-cyan-900/50' : ''}`}>
            <div className={`p-4 border-b border-slate-800 ${isFloating ? 'bg-slate-900/95 backdrop-blur' : 'bg-slate-950/50'}`}>
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                        <Badge className={`${STATUS_COLORS[mission.status]} border-none ring-1 ring-inset ring-current`}>{mission.status}</Badge>
                        <span className="text-[10px] text-slate-500 font-mono">SECTOR {Math.floor(mission.x)}-{Math.floor(mission.y)}</span>
                    </div>
                    <button onClick={() => setSelectedMissionId(null)} className="text-slate-500 hover:text-slate-300"><X size={16}/></button>
                </div>
                <h3 className="font-bold text-slate-100 leading-tight tracking-wide font-mono text-sm">{mission.title.toUpperCase()}</h3>
                <p className="text-xs text-cyan-700 mt-1 font-mono">ID: {mission.id}</p>
            </div>
            
            <div className={`flex-1 p-4 overflow-y-auto space-y-6 ${isFloating ? 'bg-slate-900/90 backdrop-blur' : ''}`}>
                {/* Intel Grid */}
                <div className="grid grid-cols-2 gap-px bg-slate-800 border border-slate-800 rounded overflow-hidden">
                    <div className="bg-slate-900 p-3">
                        <span className="text-[9px] text-slate-500 uppercase block mb-1">Target Loc</span>
                        <span className="text-slate-300 font-mono text-xs truncate flex items-center gap-1"><Navigation size={10} className="text-cyan-500"/> {mission.location}</span>
                    </div>
                    <div className="bg-slate-900 p-3">
                        <span className="text-[9px] text-slate-500 uppercase block mb-1">Bounty</span>
                        <span className="text-emerald-400 font-mono text-xs font-bold">{mission.reward} CR</span>
                    </div>
                    <div className="bg-slate-900 p-3">
                        <span className="text-[9px] text-slate-500 uppercase block mb-1">Hazard Lvl</span>
                        <Badge className={`scale-90 origin-left ${DIFFICULTY_COLORS[mission.difficulty]}`}>{mission.difficulty}</Badge>
                    </div>
                    <div className="bg-slate-900 p-3">
                        <span className="text-[9px] text-slate-500 uppercase block mb-1">Operative</span>
                        <span className="text-slate-300 text-xs truncate">{mission.assigneeId || 'UNASSIGNED'}</span>
                    </div>
                </div>

                {/* Actions */}
                <div>
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-3 flex items-center gap-2"><Target size={12}/> Command Protocols</h4>
                    <div className="space-y-2">
                        {(mission.status === MissionStatus.Open || mission.status === MissionStatus.Urgent) && (
                            <Button onClick={() => handleClaim(mission)} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white border-none font-mono text-xs h-9">
                                <Bookmark size={14} /> ACQUIRE TARGET
                            </Button>
                        )}
                        {mission.status === MissionStatus.Claimed && (
                            <Button onClick={() => handleDeploy(mission)} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white border-none font-mono text-xs h-9">
                                <RocketIcon /> INITIATE DEPLOYMENT
                            </Button>
                        )}
                        {mission.status === MissionStatus.InProgress && (
                            <>
                                {mission.assigneeId === currentUser.id && (
                                    <Button 
                                        onClick={() => onSelectMission && onSelectMission(mission.id)} 
                                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white border-none font-mono text-xs h-9 mb-2"
                                    >
                                        <CheckCircle2 size={14} /> COMPLETE & EXFIL
                                    </Button>
                                )}
                                <div className="grid grid-cols-2 gap-2">
                                    <Button onClick={() => handleSupportAction("Satellite Scan")} variant="secondary" className="justify-center bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 text-[10px] h-8">
                                        <ScanLine size={12}/> SAT SCAN
                                    </Button>
                                    <Button onClick={() => handleSupportAction("Supply Drop")} variant="secondary" className="justify-center bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 text-[10px] h-8">
                                        <Briefcase size={12}/> SUPPLY DROP
                                    </Button>
                                </div>
                                <Button onClick={() => handleSupportAction("Emergency Evac")} variant="danger" className="w-full justify-center bg-red-950/30 border-red-900/50 text-red-400 hover:bg-red-900/20 font-mono text-xs h-8 mt-2">
                                    <Shield size={12}/> EMERGENCY BEACON
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );

    return (
        <div className={`flex flex-col lg:flex-row gap-4 transition-all ${isFullScreen ? 'fixed inset-0 z-50 bg-black p-2' : 'h-[calc(100vh-140px)] relative'}`}>
            {/* Main Tactical View Container */}
            <div 
                className={`
                    flex flex-col min-h-0 relative transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
                    ${isFullScreen ? 'w-full h-full' : layoutMode === 'expanded' ? 'w-full' : layoutMode === 'compressed' ? 'lg:w-[30%]' : 'flex-1'}
                `}
            >
                <Card className={`flex-1 relative overflow-hidden bg-black border-slate-800 flex flex-col z-10 shadow-2xl ${isFullScreen ? 'rounded-none border-0' : 'border'}`}>
                    {/* Tactical Header */}
                    <div className="p-3 border-b border-slate-800 flex justify-between items-center bg-slate-950 z-20">
                        <div className="flex items-center gap-4">
                            <h3 className="text-slate-200 font-bold font-mono text-sm flex items-center gap-2">
                                <Radio className={`text-red-500 ${isScanning ? 'animate-pulse' : ''}`} size={16} />
                                LIVE_OPS // <span className="text-slate-500">SECTOR_7G</span>
                            </h3>
                            <button 
                                onClick={() => setIsScanning(!isScanning)}
                                className={`text-[10px] px-3 py-1 rounded-sm border transition-all flex items-center gap-2 font-mono tracking-wider ${
                                    isScanning 
                                    ? 'bg-red-950/30 text-red-400 border-red-900 shadow-[0_0_10px_rgba(239,68,68,0.2)]' 
                                    : 'bg-slate-900 text-slate-500 border-slate-700 hover:text-slate-300'
                                }`}
                            >
                                {isScanning ? <Activity size={10} className="animate-spin" /> : <PlayCircle size={10} />}
                                {isScanning ? 'SCANNING' : 'START_SCAN'}
                            </button>
                        </div>
                        
                        <div className="flex gap-4 items-center">
                            {/* Threat Level Indicator */}
                            <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-800 rounded">
                                <span className="text-[9px] font-bold text-slate-500 uppercase">Threat Lvl</span>
                                <div className="flex gap-0.5">
                                    <div className={`w-1.5 h-3 rounded-sm ${hazards.length > 0 ? 'bg-emerald-500' : 'bg-emerald-900'}`}></div>
                                    <div className={`w-1.5 h-3 rounded-sm ${hazards.length > 1 ? 'bg-yellow-500' : 'bg-yellow-900'}`}></div>
                                    <div className={`w-1.5 h-3 rounded-sm ${hazards.length > 3 ? 'bg-red-500 animate-pulse' : 'bg-red-900'}`}></div>
                                </div>
                            </div>

                            <div className="h-4 w-px bg-slate-800 hidden sm:block"></div>

                            {/* View Controls */}
                            <div className="flex bg-slate-900 rounded border border-slate-800 p-0.5">
                                <button 
                                    onClick={() => setIsFullScreen(!isFullScreen)}
                                    className={`p-1.5 rounded-sm transition-colors ${isFullScreen ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    {isFullScreen ? <Minimize size={12} /> : <Maximize size={12} />}
                                </button>
                                
                                {!isFullScreen && (
                                    <>
                                        <div className="w-px bg-slate-800 my-1 mx-1"></div>
                                        <button 
                                            onClick={() => setLayoutMode('compressed')}
                                            className={`p-1.5 rounded-sm transition-colors ${layoutMode === 'compressed' ? 'bg-slate-800 text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}
                                        >
                                            <Minimize2 size={12} />
                                        </button>
                                        <button 
                                            onClick={() => setLayoutMode('split')}
                                            className={`p-1.5 rounded-sm transition-colors ${layoutMode === 'split' ? 'bg-slate-800 text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}
                                        >
                                            <GripVertical size={12} />
                                        </button>
                                        <button 
                                            onClick={() => setLayoutMode('expanded')}
                                            className={`p-1.5 rounded-sm transition-colors ${layoutMode === 'expanded' ? 'bg-slate-800 text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}
                                        >
                                            <Maximize2 size={12} />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Visual Map Area */}
                    <div 
                        className="flex-1 relative bg-black overflow-hidden group cursor-crosshair"
                        onClick={() => setSelectedMissionId(null)}
                        onWheel={(e) => setMapZoom(prev => Math.max(0.5, Math.min(3, prev + e.deltaY * -0.001)))}
                    >
                        {/* Container for zoomed content */}
                        <div 
                            className="absolute inset-0 transition-transform duration-200 ease-out origin-center"
                            style={{ transform: `scale(${mapZoom})` }}
                        >
                            {/* Technical Grid Background */}
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(30,41,59,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(30,41,59,0.3)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
                            <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.5)_1px,transparent_1px)] bg-[size:160px_160px] pointer-events-none"></div>
                            
                            {/* Radial Glow */}
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_transparent_20%,_rgba(0,0,0,0.8)_100%)] pointer-events-none"></div>

                            {/* Radar Sweep Effect */}
                            {isScanning && (
                                <div className="absolute inset-[-50%] top-[-50%] left-[-50%] w-[200%] h-[200%] pointer-events-none opacity-20">
                                    <div className="w-full h-full bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,transparent_340deg,rgba(16,185,129,0.8)_360deg)] animate-[spin_4s_linear_infinite] rounded-full"></div>
                                </div>
                            )}

                            {/* Mission Pins */}
                            {activeMissions.map((mission) => {
                                const isSelected = selectedMissionId === mission.id;
                                return (
                                    <div 
                                        key={mission.id}
                                        className={`absolute flex flex-col items-center group/pin cursor-pointer transition-all duration-300 z-10 ${isSelected ? 'z-30 scale-125' : ''}`}
                                        style={{ top: `${mission.y}%`, left: `${mission.x}%` }}
                                        onClick={(e) => { e.stopPropagation(); setSelectedMissionId(mission.id); }}
                                    >
                                        {/* Selection Reticle */}
                                        {isSelected && (
                                            <div className="absolute -inset-4 border border-cyan-500/50 rounded-full animate-ping pointer-events-none"></div>
                                        )}
                                        
                                        {/* Pin Icon */}
                                        <div className={`
                                            relative flex items-center justify-center w-6 h-6 transition-colors
                                            ${mission.status === MissionStatus.Urgent ? 'text-red-500' : mission.status === MissionStatus.Claimed ? 'text-purple-500' : 'text-emerald-500'}
                                            ${isSelected ? 'text-cyan-400' : ''}
                                        `}>
                                            <Crosshair size={24} className={`opacity-90 ${isSelected ? 'animate-spin-slow' : ''}`} />
                                            {/* Center Dot */}
                                            <div className="absolute w-1.5 h-1.5 bg-current rounded-full shadow-[0_0_8px_currentColor]"></div>
                                        </div>
                                        
                                        {/* Label (Holo style) */}
                                        <div className={`
                                            absolute top-6 px-2 py-0.5 bg-slate-900/80 backdrop-blur border border-slate-700/50 text-[9px] font-mono tracking-wide text-cyan-100 whitespace-nowrap
                                            transition-all duration-200 pointer-events-none
                                            ${isSelected ? 'opacity-100 translate-y-0 border-cyan-500/50' : 'opacity-0 -translate-y-1 group-hover/pin:opacity-100 group-hover/pin:translate-y-0'}
                                        `}>
                                            {mission.title.length > 15 ? mission.title.substring(0, 15) + '...' : mission.title}
                                            <div className="h-0.5 w-full bg-cyan-500/50 mt-0.5"></div>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Incoming Signals (Ripple Effect) */}
                            {incomingSignals.map((signal) => (
                                <div
                                    key={signal.id}
                                    className="absolute z-20 cursor-pointer"
                                    style={{ top: `${signal.y}%`, left: `${signal.x}%` }}
                                    onClick={(e) => { e.stopPropagation(); handleAcceptSignal(signal.id, signal.reward); }}
                                >
                                    <div className="relative flex items-center justify-center group/signal">
                                        <div className="absolute w-12 h-12 border border-amber-500/40 rounded-full animate-ping"></div>
                                        <div className="absolute w-8 h-8 border border-amber-500/60 rounded-full animate-ping delay-75"></div>
                                        
                                        <div className="w-6 h-6 bg-amber-950/80 border border-amber-500 text-amber-500 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.5)] hover:scale-110 transition-transform z-10">
                                            <Signal size={12} />
                                        </div>
                                        
                                        <div className="absolute left-8 bg-black/80 px-2 py-1 text-[9px] text-amber-400 font-mono whitespace-nowrap border-l-2 border-amber-500 opacity-0 group-hover/signal:opacity-100 transition-opacity pointer-events-none">
                                            SIGNAL_DETECTED<br/>VAL: {signal.reward} CR
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Hazards */}
                            {hazards.map((hazard) => (
                                <div
                                    key={hazard.id}
                                    className="absolute z-10 pointer-events-none animate-in fade-in zoom-in duration-500"
                                    style={{ top: `${hazard.y}%`, left: `${hazard.x}%` }}
                                >
                                    <div className={`flex flex-col items-center justify-center ${hazard.severity === 'high' ? 'text-red-500' : 'text-orange-500'}`}>
                                        <div className="mb-1 animate-bounce drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]">
                                            {hazard.type === 'storm' && <CloudLightning size={24} />}
                                            {hazard.type === 'monster' && <Skull size={24} />}
                                            {hazard.type === 'interference' && <WifiOff size={24} />}
                                        </div>
                                        <span className="text-[9px] font-bold bg-black/50 px-1 uppercase tracking-widest border border-current">{hazard.type}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Floating Mission Details (Overlay mode) */}
                        {selectedMission && (isFullScreen || layoutMode === 'expanded') && (
                            <div className="absolute right-4 top-4 w-80 z-40 max-h-[calc(100%-2rem)] flex flex-col">
                                <MissionIntelCard mission={selectedMission} isFloating />
                            </div>
                        )}

                        {/* Map Controls */}
                        <div className="absolute right-4 bottom-24 flex flex-col gap-2 z-30">
                            <div className="bg-slate-900/90 backdrop-blur border border-slate-700 rounded-lg flex flex-col overflow-hidden">
                                <button onClick={() => setMapZoom(prev => Math.min(3, prev + 0.5))} className="p-2 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors border-b border-slate-700"><ZoomIn size={16} /></button>
                                <button onClick={() => setMapZoom(prev => Math.max(0.5, prev - 0.5))} className="p-2 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors border-b border-slate-700"><ZoomOut size={16} /></button>
                                <button onClick={() => setMapZoom(1)} className="p-2 text-xs font-mono text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">1x</button>
                            </div>
                        </div>
                    </div>
                    
                    {/* Active Operations List (Collapsible Bottom Overlay) */}
                    {layoutMode !== 'compressed' && (
                        <div className={`bg-slate-950 border-t border-slate-800 overflow-hidden z-20 transition-all duration-300 ${isFeedCollapsed ? 'h-9' : 'h-48'}`}>
                            <div 
                                className="sticky top-0 bg-slate-950/95 backdrop-blur p-2 border-b border-slate-800 flex justify-between items-center px-4 cursor-pointer hover:bg-slate-900 transition-colors"
                                onClick={() => setIsFeedCollapsed(!isFeedCollapsed)}
                            >
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    {isFeedCollapsed ? <ChevronUp size={12}/> : <ChevronDown size={12}/>}
                                    ACTIVE_OPERATIONS_FEED
                                </h4>
                                <Badge className="bg-slate-800 text-slate-400 border-slate-700">{activeMissions.length} UNITS</Badge>
                            </div>
                            <div className="overflow-y-auto h-full pb-10 custom-scrollbar">
                                <div className="divide-y divide-slate-800/50">
                                    {activeMissions.map(m => (
                                        <div 
                                            key={m.id} 
                                            className={`px-4 py-2 flex justify-between items-center hover:bg-slate-900 transition-colors cursor-pointer border-l-2 ${selectedMissionId === m.id ? 'bg-slate-900 border-l-cyan-500' : 'border-l-transparent'}`}
                                            onClick={(e) => { e.stopPropagation(); setSelectedMissionId(m.id); }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-1.5 h-1.5 rounded-full ${m.status === MissionStatus.Urgent ? 'bg-red-500 animate-pulse' : 'bg-slate-600'}`}></div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-300 font-mono">{m.title}</p>
                                                    <p className="text-[10px] text-slate-500 flex items-center gap-2 font-mono">
                                                        <Crosshair size={8}/> {Math.floor(m.x)}-{Math.floor(m.y)} 
                                                        <span className="text-slate-700">|</span>
                                                        <Users size={8}/> {m.assigneeId || 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <Badge className={`scale-75 origin-right ${STATUS_COLORS[m.status]}`}>{m.status}</Badge>
                                            </div>
                                        </div>
                                    ))}
                                    {activeMissions.length === 0 && (
                                        <div className="p-8 text-center text-slate-600 italic text-xs font-mono">
                                            NO ACTIVE SIGNALS. SCANNING...
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </Card>
            </div>

            {/* Sidebar: Mission Command / Log */}
            {layoutMode !== 'expanded' && !isFullScreen && (
                <div 
                    className={`
                        flex flex-col gap-4 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
                        ${layoutMode === 'compressed' ? 'flex-1' : 'w-full lg:w-80 shrink-0'}
                    `}
                >
                    {selectedMission ? (
                        <MissionIntelCard mission={selectedMission} />
                    ) : (
                        <Card className="flex-1 flex flex-col bg-slate-950 text-slate-300 border-slate-800 transition-all duration-500 overflow-hidden">
                            <div className="p-3 border-b border-slate-800 font-mono text-xs font-bold text-slate-400 uppercase tracking-wider flex justify-between items-center bg-slate-900/50">
                                <span className="flex items-center gap-2"><Zap size={12} className="text-amber-500"/> COMMS_LOG</span>
                                <span className="text-emerald-500 animate-pulse text-[9px]">ONLINE</span>
                            </div>
                            <div className="flex-1 overflow-y-auto p-3 space-y-2 font-mono text-[10px] custom-scrollbar bg-black/20">
                                {commsLog.map((log) => (
                                    <div key={log.id} className="flex gap-2 animate-in slide-in-from-left-2 duration-300 items-start opacity-80 hover:opacity-100">
                                        <span className="text-slate-600 shrink-0 select-none">[{log.time}]</span>
                                        <span className={`${
                                            log.type === 'alert' ? 'text-red-400 font-bold' : 
                                            log.type === 'success' ? 'text-emerald-400' : 
                                            'text-slate-300'
                                        }`}>
                                            {log.type === 'alert' && <span className="bg-red-950/50 text-red-500 px-1 mr-1">> ALERT:</span>}
                                            {log.text}
                                        </span>
                                    </div>
                                ))}
                                {/* Scanline Effect */}
                                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%]"></div>
                            </div>
                        </Card>
                    )}
                    
                    <Card className="p-0 bg-slate-950 border border-slate-800 shrink-0">
                        <div className="p-3 border-b border-slate-800 bg-slate-900/50">
                            <h3 className="font-bold text-xs text-slate-300 flex items-center gap-2 font-mono">
                                <Activity size={12} className="text-cyan-500"/> SYSTEM_DIAGNOSTICS
                            </h3>
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <div className="flex justify-between text-[10px] text-slate-500 mb-1 font-mono uppercase">
                                    <span>Core Uplink</span>
                                    <span className="text-emerald-500">{telemetry.uplink}%</span>
                                </div>
                                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                                    <div className="bg-emerald-600 h-full transition-all duration-500" style={{width: `${telemetry.uplink}%`}}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-[10px] text-slate-500 mb-1 font-mono uppercase">
                                    <span>Processing Load</span>
                                    <span className="text-amber-500">{telemetry.cpu}%</span>
                                </div>
                                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                                    <div className="bg-amber-600 h-full transition-all duration-500" style={{width: `${telemetry.cpu}%`}}></div>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                <div className="bg-slate-900 p-2 rounded border border-slate-800 text-center">
                                    <span className="block text-[9px] text-slate-600 uppercase font-bold mb-1"><Server size={10} className="inline mr-1"/> Ping</span>
                                    <span className="text-xs font-mono text-slate-300">{telemetry.latency}ms</span>
                                </div>
                                <div className="bg-slate-900 p-2 rounded border border-slate-800 text-center">
                                    <span className="block text-[9px] text-slate-600 uppercase font-bold mb-1"><Radar size={10} className="inline mr-1"/> Range</span>
                                    <span className="text-xs font-mono text-cyan-400">GLOBAL</span>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

const RocketIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>
);
