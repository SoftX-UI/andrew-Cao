
import React, { useState } from 'react';
import { X, BookOpen, Shield, Zap, MapPin, CheckCircle2, Circle, Layout, Users, Activity, BarChart2, Briefcase, HelpCircle, ArrowRight } from 'lucide-react';
import { Card, Button, Badge } from './Shared';
import { TYPE_ICONS, TYPE_COLORS, STATUS_COLORS, DIFFICULTY_COLORS } from '../constants';
import { MissionType, MissionStatus, MissionDifficulty } from '../types';

interface UserGuideModalProps {
  onClose: () => void;
}

const SECTIONS = [
  { id: 'basics', label: 'Guild Basics', icon: BookOpen },
  { id: 'types', label: 'Mission Archetypes', icon: Briefcase },
  { id: 'ranks', label: 'Ranks & Difficulty', icon: BarChart2 },
  { id: 'protocols', label: 'Operational Protocols', icon: Shield },
];

export const UserGuideModal: React.FC<UserGuideModalProps> = ({ onClose }) => {
  const [activeSection, setActiveSection] = useState('basics');

  const renderContent = () => {
    switch (activeSection) {
      case 'basics':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-guild-50 p-4 rounded-xl border border-guild-100 dark:bg-guild-900/20 dark:border-guild-800">
              <h3 className="font-bold text-guild-800 dark:text-guild-200 text-lg mb-2">Welcome to Nexus Nova Core</h3>
              <p className="text-sm text-guild-700 dark:text-guild-300 leading-relaxed">
                Nexus Nova Core is the central operating system for the modern Adventurer's Guild. We connect skilled freelancers (Adventurers) with clients (Issuers) through a gamified mission distribution network.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="p-4 rounded-lg border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-3 dark:bg-blue-900/30 dark:text-blue-400">
                     <Layout size={18} />
                  </div>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-1">Mission Board</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    The central hub where available quests are posted. Use filters to find tasks matching your skills and location.
                  </p>
               </div>
               <div className="p-4 rounded-lg border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700">
                  <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mb-3 dark:bg-purple-900/30 dark:text-purple-400">
                     <Users size={18} />
                  </div>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-1">Reputation</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Completing missions earns EXP and Credits. Higher reputation unlocks exclusive 'Rank S' missions and premium tools.
                  </p>
               </div>
               <div className="p-4 rounded-lg border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700">
                  <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-3 dark:bg-amber-900/30 dark:text-amber-400">
                     <Zap size={18} />
                  </div>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-1">Live Ops</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Real-time monitoring for high-stakes missions. Agents can broadcast telemetry back to HQ for support.
                  </p>
               </div>
               <div className="p-4 rounded-lg border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700">
                  <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-3 dark:bg-green-900/30 dark:text-green-400">
                     <MapPin size={18} />
                  </div>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-1">Tactical Map</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Accessible via Mission Details. Provides geographical intel, safe routes, and guild outpost locations.
                  </p>
               </div>
            </div>
          </div>
        );
      case 'types':
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300 h-full overflow-y-auto pr-2 custom-scrollbar">
             <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                Missions are categorized by archetype to help you identify the nature of the task and required gear.
             </p>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.values(MissionType).sort().map((type) => (
                   <div key={type} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-white shadow-sm dark:bg-slate-800 dark:border-slate-700">
                      <div className="text-2xl shrink-0 w-10 text-center">{TYPE_ICONS[type]}</div>
                      <div>
                         <Badge className={`${TYPE_COLORS[type]} mb-1`}>{type}</Badge>
                         <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                            {getMissionTypeDescription(type)}
                         </p>
                      </div>
                   </div>
                ))}
             </div>
          </div>
        );
      case 'ranks':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
             <p className="text-sm text-slate-500 dark:text-slate-400">
                Mission difficulty determines the risk level, required clearance, and reward multiplier.
             </p>
             <div className="space-y-3">
                {Object.values(MissionDifficulty).map((rank) => (
                   <div key={rank} className="flex items-center gap-4 p-3 rounded-lg border border-slate-100 bg-white dark:bg-slate-800 dark:border-slate-700">
                      <Badge className={`${DIFFICULTY_COLORS[rank]} w-16 justify-center shrink-0`}>{rank}</Badge>
                      <div className="flex-1">
                         <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-0.5">{getRankTitle(rank)}</p>
                         <p className="text-[10px] text-slate-500 dark:text-slate-400">{getRankDescription(rank)}</p>
                      </div>
                   </div>
                ))}
             </div>
          </div>
        );
      case 'protocols':
        return (
           <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="relative pl-8 border-l-2 border-slate-200 dark:border-slate-700 space-y-8">
                 <div className="relative">
                    <div className="absolute -left-[41px] top-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center border-4 border-white dark:border-slate-900 dark:bg-blue-900/30 dark:text-blue-400">1</div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-100">Claim & Start</h4>
                    <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">
                       Find an <Badge className={STATUS_COLORS[MissionStatus.Open]}>Open</Badge> mission. Once claimed, the status moves to <Badge className={STATUS_COLORS[MissionStatus.Claimed]}>Claimed</Badge>. You must explicitly "Start Mission" to signal deployment (<Badge className={STATUS_COLORS[MissionStatus.InProgress]}>InProgress</Badge>).
                    </p>
                 </div>
                 <div className="relative">
                    <div className="absolute -left-[41px] top-0 w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center border-4 border-white dark:border-slate-900 dark:bg-amber-900/30 dark:text-amber-400">2</div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-100">Execution</h4>
                    <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">
                       Complete the objectives. Use the "Tactical Map" for intel. If issues arise, use the "Hold" function to pause the timer (<Badge className={STATUS_COLORS[MissionStatus.Hold]}>Hold</Badge>).
                    </p>
                 </div>
                 <div className="relative">
                    <div className="absolute -left-[41px] top-0 w-8 h-8 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center border-4 border-white dark:border-slate-900 dark:bg-cyan-900/30 dark:text-cyan-400">3</div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-100">Verification</h4>
                    <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">
                       Upload proof (image/data). Status shifts to <Badge className={STATUS_COLORS[MissionStatus.Verifying]}>Verifying</Badge>. The Issuer or Guild Admin will review your work.
                    </p>
                 </div>
                 <div className="relative">
                    <div className="absolute -left-[41px] top-0 w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center border-4 border-white dark:border-slate-900 dark:bg-green-900/30 dark:text-green-400">4</div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-100">Rewards</h4>
                    <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">
                       Upon approval (<Badge className={STATUS_COLORS[MissionStatus.Verified]}>Verified</Badge>), credits are transferred to your wallet instantly.
                    </p>
                 </div>
              </div>
           </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
       <Card className="w-full max-w-4xl h-[80vh] flex flex-col md:flex-row overflow-hidden shadow-2xl relative border-0 bg-white dark:bg-slate-900">
          
          {/* Sidebar */}
          <div className="w-full md:w-64 bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col">
             <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                   <BookOpen className="text-guild-600" /> Handbook
                </h2>
                <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">Official Guild Documentation</p>
             </div>
             <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
                {SECTIONS.map((section) => (
                   <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all ${
                         activeSection === section.id 
                         ? 'bg-white text-guild-700 shadow-sm border border-slate-200 dark:bg-slate-800 dark:text-guild-400 dark:border-slate-700' 
                         : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800/50'
                      }`}
                   >
                      <section.icon size={18} />
                      {section.label}
                   </button>
                ))}
             </nav>
             <div className="p-4 border-t border-slate-200 dark:border-slate-800 text-center">
                <p className="text-[10px] text-slate-400">Nexus Nova Core v2.5</p>
             </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900">
             <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center md:hidden">
                <span className="font-bold text-slate-700 dark:text-slate-200">
                   {SECTIONS.find(s => s.id === activeSection)?.label}
                </span>
                <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full">
                   <X size={20} />
                </button>
             </div>
             
             {/* Desktop Close Button */}
             <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 rounded-full hover:text-slate-600 transition-colors hidden md:block dark:hover:bg-slate-800 dark:hover:text-slate-200">
                <X size={20} />
             </button>

             <div className="flex-1 overflow-y-auto p-6 md:p-10">
                <h2 className="text-2xl font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4 dark:text-slate-100 dark:border-slate-800">
                   {SECTIONS.find(s => s.id === activeSection)?.label}
                </h2>
                {renderContent()}
             </div>
          </div>
       </Card>
    </div>
  );
};

// Helper descriptions
const getMissionTypeDescription = (type: string) => {
   switch(type) {
      case 'Logistics': return "Transport, delivery, and supply chain tasks. Speed is key.";
      case 'Analysis': return "Data deciphering, translation, and investigation.";
      case 'Security': return "Protection, escort, and perimeter defense. Combat gear recommended.";
      case 'Critical Ops': return "High-stakes emergency response. Expert level only.";
      case 'HR/Guidance': return "Mentorship, recruiting, and conflict resolution.";
      case 'Engineering': return "Construction, repair, and mechanical maintenance.";
      case 'Audit/Debug': return "System checks, financial verification, and code review.";
      case 'Exploration': return "Mapping unknown territories and scouting new routes.";
      case 'Diplomacy': return "Negotiating treaties and resolving disputes peacefully.";
      case 'Bounty Hunting': return "Tracking down targets or recovering assets.";
      case 'Medical/Rescue': return "Providing aid and extracting assets from danger.";
      case 'Covert Ops': return "Stealth infiltration and intelligence gathering.";
      case 'Survival': return "Endurance tasks in harsh environments.";
      case 'Investigation': return "Solving mysteries and forensic analysis.";
      case 'Cyber Security': return "Digital defense and network intrusion.";
      default: return "General purpose guild task.";
   }
};

const getRankTitle = (rank: string) => {
   switch(rank) {
      case 'Rank E': return "Novice";
      case 'Rank D': return "Apprentice";
      case 'Rank C': return "Journeyman";
      case 'Rank B': return "Professional";
      case 'Rank A': return "Expert";
      case 'Rank S': return "Legendary";
      default: return "Unknown";
   }
};

const getRankDescription = (rank: string) => {
   switch(rank) {
      case 'Rank E': return "Low risk. Suitable for beginners. Community service.";
      case 'Rank D': return "Standard difficulty. Basic skills required.";
      case 'Rank C': return "Moderate risk. Requires specialized tools or skills.";
      case 'Rank B': return "High difficulty. Teamwork or advanced gear recommended.";
      case 'Rank A': return "Severe risk. Solo operatives must be highly leveled.";
      case 'Rank S': return "Extreme danger. Guild Council authorization required.";
      default: return "";
   }
};
