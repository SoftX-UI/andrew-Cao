
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { Card, Button, Badge, Input } from './Shared';
import { 
  Mail, Phone, MapPin, Shield, Edit2, Save, X, User as UserIcon, 
  Lock, Users, BrainCircuit, Loader2, Camera, CheckCircle2, 
  GraduationCap, Crown, Briefcase, Trees, Trophy, Coins, TrendingUp
} from 'lucide-react';
import { analyzeUserProfile, AdvisorAnalysis } from '../services/geminiService';

interface UserProfileProps {
  user: User;
  onUpdate: (user: User) => void;
  onChat: (contactId: string) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ user, onUpdate, onChat }) => {
  const [isEditing, setIsEditing] = useState(false);
  
  // Edit States
  const [tempName, setTempName] = useState(user.name);
  const [tempLocation, setTempLocation] = useState(user.location);
  const [tempEmail, setTempEmail] = useState(user.email || '');
  const [tempPhone, setTempPhone] = useState(user.phone || '');
  const [tempTags, setTempTags] = useState(user.tags.join(', '));
  const [tempVisibility, setTempVisibility] = useState(user.visibility);

  // Advisor State
  const [showAdvisor, setShowAdvisor] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AdvisorAnalysis | null>(null);

  // Level Logic: L_total(n) = 100 * n^1.5
  const nextLevel = user.level + 1;
  const xpThreshold = Math.floor(100 * Math.pow(nextLevel, 1.5));
  const progressPercent = Math.min(100, Math.floor((user.exp / xpThreshold) * 100));

  const getRoleIcon = (role: string) => {
    switch(role) {
        case UserRole.Student: return <GraduationCap size={18} />;
        case UserRole.Professor: return <Crown size={18} />;
        case UserRole.Admin: return <Shield size={18} />;
        case UserRole.ForestWarden: return <Trees size={18} />;
        default: return <Briefcase size={18} />;
    }
  };

  const handleSave = () => {
      onUpdate({
          ...user,
          name: tempName,
          location: tempLocation,
          email: tempEmail,
          phone: tempPhone,
          tags: tempTags.split(',').map(t => t.trim()).filter(Boolean),
          visibility: tempVisibility
      });
      setIsEditing(false);
  };

  const toggleVisibility = (field: keyof typeof tempVisibility) => {
      setTempVisibility(prev => ({
          ...prev,
          [field]: !prev[field]
      }));
  };

  const handleDirectVisibilityToggle = (field: keyof typeof user.visibility) => {
      onUpdate({
          ...user,
          visibility: {
              ...user.visibility,
              [field]: !user.visibility[field]
          }
      });
  };

  const handleAnalyze = async () => {
      setIsAnalyzing(true);
      const result = await analyzeUserProfile(user);
      setAnalysis(result);
      setIsAnalyzing(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
       {/* Header Card */}
       <Card className="relative overflow-hidden border-0 shadow-lg bg-white dark:bg-slate-900">
           <div className="h-32 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800"></div>
           <div className="px-8 pb-8">
               <div className="relative flex justify-between items-end -mt-12 mb-6">
                   <div className="relative">
                       <div className="w-24 h-24 rounded-2xl bg-white dark:bg-slate-900 p-1.5 shadow-xl">
                           <img 
                               src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`} 
                               alt="Avatar" 
                               className="w-full h-full rounded-xl bg-slate-100 object-cover"
                           />
                       </div>
                       <button className="absolute bottom-0 right-0 p-1.5 bg-slate-800 text-white rounded-lg hover:bg-indigo-600 transition-colors shadow-md">
                           <Camera size={14} />
                       </button>
                   </div>
                   <div className="flex gap-2 mb-2">
                       <Button 
                           variant="secondary" 
                           onClick={() => setShowAdvisor(!showAdvisor)}
                           className={`!px-3 !py-1.5 !text-xs gap-2 transition-all duration-300 ${showAdvisor ? 'bg-purple-600 text-white border-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/20' : 'hover:border-purple-300 hover:text-purple-600'}`}
                       >
                           <BrainCircuit size={14} /> AI Career Oracle
                       </Button>
                       {isEditing ? (
                           <>
                               <Button variant="secondary" onClick={() => setIsEditing(false)} className="!px-3 !py-1.5 !text-xs">Cancel</Button>
                               <Button onClick={handleSave} className="!px-3 !py-1.5 !text-xs bg-green-600 hover:bg-green-700 text-white gap-2">
                                   <Save size={14} /> Save Profile
                               </Button>
                           </>
                       ) : (
                           <Button onClick={() => setIsEditing(true)} variant="secondary" className="!px-3 !py-1.5 !text-xs gap-2">
                               <Edit2 size={14} /> Edit Profile
                           </Button>
                       )}
                   </div>
               </div>

               {/* AI Advisor Panel */}
               {showAdvisor && (
                   <div className="mb-6 p-6 bg-gradient-to-br from-slate-50 to-purple-50 dark:from-slate-900 dark:to-purple-900/20 rounded-2xl border border-purple-100 dark:border-purple-900/50 animate-in slide-in-from-top-2 relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-8 opacity-5">
                           <BrainCircuit size={120} />
                       </div>
                       <div className="flex justify-between items-start mb-6 relative z-10">
                           <div>
                               <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                   <BrainCircuit size={20} className="text-purple-600 dark:text-purple-400" /> N.O.V.A. Oracle Protocol
                               </h3>
                               <p className="text-sm text-slate-500 dark:text-slate-400">Strategic career path analysis based on guild metrics.</p>
                           </div>
                           {!analysis && (
                               <Button onClick={handleAnalyze} disabled={isAnalyzing} className="bg-purple-600 text-white hover:bg-purple-700 shadow-md">
                                   {isAnalyzing ? <Loader2 size={16} className="animate-spin mr-2" /> : <SparklesIcon />}
                                   {isAnalyzing ? 'Processing...' : 'Run Analysis'}
                               </Button>
                           )}
                       </div>

                       {analysis ? (
                           <div className="space-y-6 relative z-10 animate-in fade-in slide-in-from-bottom-2">
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                   <div className="bg-white/80 dark:bg-slate-950/50 p-5 rounded-xl border border-purple-100 dark:border-purple-900/30 shadow-sm backdrop-blur-sm">
                                       <p className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-2">Current Assessment</p>
                                       <p className="text-sm text-slate-700 dark:text-slate-200 italic leading-relaxed">"{analysis.assessment}"</p>
                                   </div>
                                   <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-5 rounded-xl border border-transparent shadow-lg text-white flex flex-col justify-center items-center text-center">
                                       <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-1">Projected Class</p>
                                       <div className="text-2xl font-bold tracking-tight">
                                           {analysis.careerPath}
                                       </div>
                                       <div className="mt-2 h-1 w-16 bg-white/30 rounded-full"></div>
                                   </div>
                               </div>
                               
                               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                   <div className="md:col-span-2">
                                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Strategic Directives</p>
                                       <div className="space-y-2">
                                           {analysis.recommendations.map((rec, i) => (
                                               <div key={i} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300 bg-white/60 dark:bg-slate-900/40 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                                                   <div className="mt-0.5 bg-green-100 text-green-600 p-1 rounded-full dark:bg-green-900/30">
                                                       <TrendingUp size={14} />
                                                   </div>
                                                   <span>{rec}</span>
                                               </div>
                                           ))}
                                       </div>
                                   </div>
                                   <div>
                                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Recommended Tags</p>
                                       <div className="flex flex-col gap-2">
                                           {analysis.suggestedTags.map(tag => (
                                               <div key={tag} className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 flex items-center gap-2">
                                                   <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                                                   {tag}
                                               </div>
                                           ))}
                                       </div>
                                   </div>
                               </div>
                               
                               <div className="flex justify-end pt-2 border-t border-purple-100 dark:border-purple-900/30">
                                   <Button variant="ghost" onClick={() => setAnalysis(null)} className="text-xs text-slate-400 hover:text-purple-600">
                                       Reset Oracle
                                   </Button>
                               </div>
                           </div>
                       ) : isAnalyzing && (
                           <div className="text-center py-12">
                               <p className="text-sm text-slate-500 dark:text-slate-400 animate-pulse">Calculating optimal trajectory...</p>
                           </div>
                       )}
                   </div>
               )}

               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                   <div className="md:col-span-2 space-y-6">
                       <div>
                           <div className="flex items-center gap-2 mb-1">
                               {isEditing ? (
                                   <Input 
                                       value={tempName} 
                                       onChange={(e) => setTempName(e.target.value)} 
                                       className="font-bold text-2xl" 
                                   />
                               ) : (
                                   <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{user.name}</h1>
                               )}
                               {user.verificationStatus === 'Verified' && <Badge className="bg-blue-100 text-blue-700 border-blue-200 ml-2 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800"><CheckCircle2 size={12} className="mr-1"/> Verified</Badge>}
                           </div>
                           <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-4">
                               <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-xs font-medium">
                                   {getRoleIcon(user.role)} {user.role}
                               </span>
                               <span>•</span>
                               {isEditing ? (
                                   <Input 
                                       value={tempLocation} 
                                       onChange={(e) => setTempLocation(e.target.value)}
                                       className="!py-0.5 !px-2 !text-xs !w-40"
                                       placeholder="Location"
                                   />
                               ) : (
                                   <span className="flex items-center gap-1">
                                       <MapPin size={14} /> {user.location}
                                   </span>
                               )}
                           </div>
                           
                           {/* Tags */}
                           <div>
                               <p className="text-xs font-bold text-slate-400 uppercase mb-2">Skills & Badges</p>
                               {isEditing ? (
                                   <Input 
                                       value={tempTags} 
                                       onChange={(e) => setTempTags(e.target.value)}
                                       placeholder="Comma separated tags..."
                                   />
                               ) : (
                                   <div className="flex flex-wrap gap-2">
                                       {user.tags.map(tag => (
                                           <span key={tag} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                                               {tag}
                                           </span>
                                       ))}
                                       {user.isPremium && (
                                           <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold border border-amber-200 flex items-center gap-1 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">
                                               <Crown size={12} /> Premium
                                           </span>
                                       )}
                                   </div>
                               )}
                           </div>
                       </div>
                   </div>

                   {/* Stats Column */}
                   <div className="space-y-4">
                       <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                           <div className="flex justify-between items-center mb-2">
                               <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Level {user.level}</span>
                               <span className="text-xs text-indigo-600 dark:text-indigo-400 font-mono">{user.exp} / {xpThreshold} XP</span>
                           </div>
                           <div className="relative h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                               <div 
                                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000 ease-out" 
                                  style={{ width: `${progressPercent}%` }}
                               ></div>
                           </div>
                           <p className="text-[10px] text-right text-slate-400 mt-1">Next Level in {xpThreshold - user.exp} XP</p>
                       </div>

                       <div className="grid grid-cols-2 gap-3">
                           <div className="bg-emerald-50 dark:bg-emerald-900/10 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/30 text-center">
                               <Trophy className="mx-auto text-emerald-600 mb-1" size={20} />
                               <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">42</p>
                               <p className="text-[10px] text-emerald-600/70 dark:text-emerald-500 uppercase font-bold">Missions</p>
                           </div>
                           <div className="bg-amber-50 dark:bg-amber-900/10 p-3 rounded-xl border border-amber-100 dark:border-amber-900/30 text-center">
                               <Coins className="mx-auto text-amber-600 mb-1" size={20} />
                               <p className="text-xl font-bold text-amber-700 dark:text-amber-400">{user.credits}</p>
                               <p className="text-[10px] text-amber-600/70 dark:text-amber-500 uppercase font-bold">Credits</p>
                           </div>
                       </div>
                   </div>
               </div>

               {/* Contact Info Section */}
               <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800">
                   <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                       <UserIcon size={18} /> Contact Information
                   </h3>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       {/* Personal Info - Email */}
                       <div className="bg-slate-50 p-3 rounded-lg flex items-center gap-3 dark:bg-slate-800 border border-transparent hover:border-slate-200 transition-colors">
                          <Mail className="text-indigo-500 shrink-0" />
                          <div className="flex-1 min-w-0">
                             <div className="flex justify-between items-center mb-0.5">
                                <p className="text-xs text-slate-500 dark:text-slate-400">Email Address</p>
                                {isEditing ? (
                                   <button onClick={() => toggleVisibility('email')} className={`text-xs flex items-center gap-1 px-2 py-0.5 rounded-full transition-colors border ${tempVisibility.email ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800' : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:border-slate-600'}`} title={tempVisibility.email ? "Visible to Guild" : "Only Visible to You"}>
                                      {tempVisibility.email ? <Users size={12} /> : <Lock size={12} />}
                                      <span className="text-[10px] font-medium">{tempVisibility.email ? 'Guild' : 'Private'}</span>
                                   </button>
                                ) : (
                                   <button onClick={() => handleDirectVisibilityToggle('email')} className="flex items-center gap-1 group/vis" title="Toggle Visibility">
                                      {user.visibility.email ? <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px] px-2 py-0.5 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Visible</Badge> : <Badge className="bg-slate-200 text-slate-600 border-slate-300 text-[10px] px-2 py-0.5 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span> Hidden</Badge>}
                                   </button>
                                )}
                             </div>
                             {isEditing ? <Input value={tempEmail} onChange={(e) => setTempEmail(e.target.value)} className="!py-1 !px-2 !text-xs !h-7 mt-1" placeholder="Enter email..."/> : <p className="font-bold dark:text-slate-200 truncate text-sm">{user.email || 'Not provided'}</p>}
                          </div>
                       </div>
                       
                       {/* Personal Info - Phone */}
                       <div className="bg-slate-50 p-3 rounded-lg flex items-center gap-3 dark:bg-slate-800 border border-transparent hover:border-slate-200 transition-colors">
                          <Phone className="text-emerald-500 shrink-0" />
                          <div className="flex-1 min-w-0">
                             <div className="flex justify-between items-center mb-0.5">
                                <p className="text-xs text-slate-500 dark:text-slate-400">Phone Contact</p>
                                {isEditing ? (
                                   <button onClick={() => toggleVisibility('phone')} className={`text-xs flex items-center gap-1 px-2 py-0.5 rounded-full transition-colors border ${tempVisibility.phone ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800' : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:border-slate-600'}`} title={tempVisibility.phone ? "Visible to Guild" : "Only Visible to You"}>
                                      {tempVisibility.phone ? <Users size={12} /> : <Lock size={12} />}
                                      <span className="text-[10px] font-medium">{tempVisibility.phone ? 'Guild' : 'Private'}</span>
                                   </button>
                                ) : (
                                   <button onClick={() => handleDirectVisibilityToggle('phone')} className="flex items-center gap-1 group/vis" title="Toggle Visibility">
                                      {user.visibility.phone ? <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px] px-2 py-0.5 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Visible</Badge> : <Badge className="bg-slate-200 text-slate-600 border-slate-300 text-[10px] px-2 py-0.5 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span> Hidden</Badge>}
                                   </button>
                                )}
                             </div>
                             {isEditing ? <Input value={tempPhone} onChange={(e) => setTempPhone(e.target.value)} className="!py-1 !px-2 !text-xs !h-7 mt-1" placeholder="Enter phone..."/> : <p className="font-bold dark:text-slate-200 truncate text-sm">{user.phone || 'Not provided'}</p>}
                          </div>
                       </div>
                   </div>
               </div>
           </div>
       </Card>
    </div>
  );
};

const SparklesIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z"/></svg>
);
