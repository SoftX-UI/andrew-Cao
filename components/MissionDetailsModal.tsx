
import React, { useState, useRef, useEffect } from 'react';
import { X, Send, User as UserIcon, Clock, MapPin, Upload, PauseCircle, PlayCircle, AlertCircle, History, Shield, CheckCircle2, Bookmark, BookmarkMinus, Zap, Edit2, Save, Calendar, Gift, Briefcase, ArrowRight, Map, Navigation, Locate, Building2, Eye, Loader2, ExternalLink, Video, Lock, Key, Copy, EyeOff, Download, Monitor, Globe, Users, Thermometer, Wind, CloudLightning, Mountain, RefreshCw, Search, Phone, Stamp, Ban, Check, DollarSign, Tag, Star } from 'lucide-react';
import { Mission, User, MissionStatus, MissionType, MissionDifficulty, UserRole, EnvironmentalData } from '../types';
import { Button, Badge, Card, Input } from './Shared';
import { STATUS_COLORS, DIFFICULTY_COLORS, TYPE_ICONS, ISSUERS, TYPE_COLORS } from '../constants';
import { getLocationIntel, getEnvironmentalData } from '../services/geminiService';

interface MissionDetailsModalProps {
  mission: Mission;
  currentUser: User;
  onClose: () => void;
  onAddComment: (missionId: string, text: string) => void;
  onUpdateStatus: (missionId: string, status: MissionStatus, comment?: string, proofUrl?: string, adminVerification?: Mission['adminVerification']) => void;
  onEditMission?: (mission: Mission) => void;
  customStatusColors?: Record<string, string>;
  onViewIssuer?: (id: string) => void;
}

const GUILD_BRANCHES = [
    {
        id: 'b1',
        name: 'North Outpost',
        description: 'A fortified forward operating base located near the Frostpeaks border. Primary hub for monster hunting and security details.',
        style: { top: '30%', left: '20%' },
        services: ['Armory', 'Medical Bay', 'Bounty Board'],
        status: 'Active',
        contact: 'Commander Riker',
        color: 'bg-indigo-500'
    },
    {
        id: 'b2',
        name: 'Trade Hub',
        description: 'The central economic vein of the guild. Located in the bustling market district, facilitating high-value logistics and sourcing missions.',
        style: { bottom: '30%', right: '20%' },
        services: ['Marketplace', 'Vault', 'Auction House'],
        status: 'Active',
        contact: 'Merchant Sato',
        color: 'bg-amber-500'
    },
    {
        id: 'b3',
        name: 'Eastern Gate',
        description: 'Watchtower overlooking the eastern plains. Strategic point for spotting incoming threats and managing caravan routes.',
        style: { top: '20%', right: '30%' },
        services: ['Watchtower', 'Stable', 'Cartography'],
        status: 'Maintenance',
        contact: 'Watchman Tural',
        color: 'bg-emerald-500'
    }
];

export const MissionDetailsModal: React.FC<MissionDetailsModalProps> = ({ 
  mission, 
  currentUser, 
  onClose, 
  onAddComment,
  onUpdateStatus,
  onEditMission,
  customStatusColors = {},
  onViewIssuer
}) => {
  const [activeTab, setActiveTab] = useState<'brief' | 'map'>('brief');
  const [commentText, setCommentText] = useState('');
  const [proofImage, setProofImage] = useState<string | null>(mission.proofUrl || null);
  const [showHoldInput, setShowHoldInput] = useState(false);
  const [holdReason, setHoldReason] = useState('');
  
  // Submission State
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);
  
  // Drop Mission State
  const [showDropInput, setShowDropInput] = useState(false);
  const [dropReason, setDropReason] = useState('');
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editTags, setEditTags] = useState(mission.tags.join(', '));
  const [rewardType, setRewardType] = useState<'credits' | 'gift_card' | 'custom'>('credits');
  
  const [editEnvData, setEditEnvData] = useState<EnvironmentalData>(mission.environmentalData || {
      temperature: '',
      weather: '',
      visibility: '',
      terrain: ''
  });
  const [isGeneratingEnv, setIsGeneratingEnv] = useState(false);

  // Map State
  const [showBranches, setShowBranches] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  const [locationIntel, setLocationIntel] = useState<{text: string, links: any[]} | null>(null);
  const [isLoadingIntel, setIsLoadingIntel] = useState(false);
  const [mapSearchTerm, setMapSearchTerm] = useState(mission.location);
  const [selectedBranch, setSelectedBranch] = useState<typeof GUILD_BRANCHES[0] | null>(null);
  
  // Virtual State
  const [showVirtualPassword, setShowVirtualPassword] = useState(false);
  const [tempPasscodeVisibility, setTempPasscodeVisibility] = useState<'public' | 'limited'>(mission.virtualCoordinates?.passcodeVisibility || 'limited');
  
  // Verification State (Issuer/Admin)
  const [verificationStamp, setVerificationStamp] = useState<'PASS' | 'NOT PASS' | null>(null);
  const [verificationNote, setVerificationNote] = useState('');

  const commentsEndRef = useRef<HTMLDivElement>(null);
  const issuerName = ISSUERS[mission.issuerId] || 'Unknown Client';

  // Scroll to bottom of comments when opened or when new comment added
  useEffect(() => {
    if (commentsEndRef.current && activeTab === 'brief') {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [mission.comments.length, activeTab]);

  // Sync proof image with mission prop updates
  useEffect(() => {
    if (mission.proofUrl) setProofImage(mission.proofUrl);
  }, [mission.proofUrl]);

  // Sync edit state
  useEffect(() => {
      if (isEditing) {
          setEditTags(mission.tags.join(', '));
          // Check reward type
          if (mission.customReward) {
              setRewardType(mission.customReward.toLowerCase().includes('gift card') ? 'gift_card' : 'custom');
          } else {
              setRewardType('credits');
          }

          if (mission.virtualCoordinates) {
              setTempPasscodeVisibility(mission.virtualCoordinates.passcodeVisibility || 'limited');
          }
          if (mission.environmentalData) {
              setEditEnvData(mission.environmentalData);
          }
      }
  }, [isEditing, mission]);

  // Auto-fetch Intel when map tab is active
  useEffect(() => {
    if (activeTab === 'map' && !locationIntel && !isLoadingIntel) {
        handleFetchIntel();
    }
  }, [activeTab]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim()) {
      onAddComment(mission.id, commentText);
      setCommentText('');
    }
  };

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!onEditMission) return;
    
    const formData = new FormData(e.currentTarget);
    const tags = editTags ? editTags.split(',').map(t => t.trim()).filter(Boolean) : [];

    let updatedVirtualCoordinates: Mission['virtualCoordinates'] = mission.virtualCoordinates;
    if (updatedVirtualCoordinates) {
        updatedVirtualCoordinates = {
            ...updatedVirtualCoordinates,
            passcodeVisibility: tempPasscodeVisibility as 'public' | 'limited'
        };
    }

    const updatedMission: Mission = {
        ...mission,
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        // Handle Reward Logic
        reward: rewardType === 'credits' ? Number(formData.get('reward')) : 0,
        customReward: rewardType === 'credits' ? undefined : formData.get('customReward') as string,
        
        location: formData.get('location') as string,
        difficulty: formData.get('difficulty') as MissionDifficulty,
        tags: tags,
        virtualCoordinates: updatedVirtualCoordinates,
        environmentalData: editEnvData
    };
    
    onEditMission(updatedMission);
    setIsEditing(false);
  };

  const handleGenerateEnvData = async () => {
      const locationInput = (document.getElementById('edit-location-input') as HTMLInputElement)?.value;
      if (!locationInput) return;

      setIsGeneratingEnv(true);
      const data = await getEnvironmentalData(locationInput);
      if (data) {
          setEditEnvData(prev => ({
              ...prev,
              temperature: data.temperature,
              weather: data.weather,
              visibility: data.visibility,
              terrain: data.terrain
          }));
      }
      setIsGeneratingEnv(false);
  };

  const handleProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
        const reader = new FileReader();
        reader.onload = (ev) => {
            setProofImage(ev.target?.result as string);
        };
        reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSubmitProof = () => {
      if (!proofImage) {
          alert("Please upload proof of completion.");
          return;
      }
      onUpdateStatus(mission.id, MissionStatus.Verifying, "Proof submitted for verification.", proofImage);
      setIsSubmittingProof(false);
  };

  const handleHoldSubmit = () => {
    if (holdReason.trim()) {
        onUpdateStatus(mission.id, MissionStatus.Hold, holdReason);
        setShowHoldInput(false);
        setHoldReason('');
    }
  };

  const handleDropSubmit = () => {
    if (dropReason.trim()) {
        onUpdateStatus(mission.id, MissionStatus.Open, `Dropped: ${dropReason}`);
        setShowDropInput(false);
        setDropReason('');
    }
  };

  const handleClaimReward = () => {
      onUpdateStatus(mission.id, MissionStatus.Completed, "Reward claimed by Adventurer.");
      onClose(); // Close modal or show success animation
  };

  const handleVerifyConfirm = () => {
      if (!verificationStamp) return;

      const isPassed = verificationStamp === 'PASS';
      const newStatus = isPassed ? MissionStatus.Verified : MissionStatus.InProgress; // Reject back to InProgress to try again
      const reason = isPassed ? "Mission Approved & Verified" : `Verification Failed: ${verificationNote || 'Revise proof'}`;

      onUpdateStatus(
          mission.id, 
          newStatus, 
          reason, 
          undefined,
          {
              isPassed,
              verifiedBy: currentUser.name,
              verifiedAt: new Date().toISOString(),
              notes: verificationNote
          }
      );
      // Reset
      setVerificationStamp(null);
      setVerificationNote('');
  };

  const handleFetchIntel = async () => {
    setIsLoadingIntel(true);
    const intel = await getLocationIntel(mapSearchTerm); 
    if (intel) {
        setLocationIntel(intel);
    }
    setIsLoadingIntel(false);
  };

  const handleSearchMaps = () => {
      const input = document.getElementById('edit-location-input') as HTMLInputElement;
      if (input?.value) {
          window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(input.value)}`, '_blank');
      }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = date.toDateString() === now.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const time = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

    if (isToday) {
      return `Today at ${time}`;
    } else if (isYesterday) {
      return `Yesterday at ${time}`;
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ` at ${time}`;
    }
  };

  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
  };

  const isAssignee = currentUser.id === mission.assigneeId;
  const isIssuer = currentUser.id === mission.issuerId;
  const isAdmin = currentUser.role === UserRole.Admin;
  
  // Permissions
  const canClaim = mission.status === MissionStatus.Open && !isIssuer;
  const canStart = mission.status === MissionStatus.Claimed && isAssignee;
  const canHold = isAssignee && (mission.status === MissionStatus.InProgress || mission.status === MissionStatus.Urgent);
  const canResume = isAssignee && mission.status === MissionStatus.Hold;
  const canComplete = isAssignee && mission.status === MissionStatus.InProgress;
  const canClaimReward = isAssignee && mission.status === MissionStatus.Verified;
  
  // Verification Permissions
  const canVerify = (isIssuer || isAdmin) && mission.status === MissionStatus.Verifying;

  // View Permissions for Virtual Details
  const canViewVirtualDetails = isAssignee || isIssuer || isAdmin;

  return (
     <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
        <Card className="w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden shadow-2xl relative border-0">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 flex flex-col gap-4 shrink-0 z-10">
               <div className="flex justify-between items-start">
                   <div className="flex-1">
                      <div className="flex gap-2 mb-2">
                        <Badge 
                          className={!customStatusColors[mission.status] ? STATUS_COLORS[mission.status] : ''}
                          style={customStatusColors[mission.status] ? {
                             backgroundColor: `${customStatusColors[mission.status]}26`,
                             color: customStatusColors[mission.status],
                             borderColor: `${customStatusColors[mission.status]}4D`,
                             borderWidth: '1px',
                             borderStyle: 'solid'
                          } : undefined}
                        >
                          {mission.status}
                        </Badge>
                        <Badge className={DIFFICULTY_COLORS[mission.difficulty]}>{mission.difficulty}</Badge>
                      </div>
                      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 pr-8">{mission.title}</h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                         <Briefcase size={14} className="text-slate-400" />
                         <span className="font-semibold text-slate-600 dark:text-slate-300">Client:</span> 
                         <button 
                            onClick={() => onViewIssuer && onViewIssuer(mission.issuerId)}
                            className="hover:text-guild-600 hover:underline transition-colors"
                         >
                            {issuerName}
                         </button>
                      </p>
                   </div>
                   <div className="flex gap-2">
                     {isIssuer && onEditMission && !isEditing && (
                        <Button variant="secondary" onClick={() => setIsEditing(true)} className="!p-2 h-auto text-xs">
                           <Edit2 size={16} /> Edit
                        </Button>
                     )}
                     <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full dark:hover:bg-slate-800 dark:text-slate-400 self-start">
                       <X size={24} />
                     </button>
                   </div>
               </div>
               
               {/* Tab Switcher */}
               {!isEditing && (
                   <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit dark:bg-slate-800">
                        <button
                            onClick={() => setActiveTab('brief')}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'brief' ? 'bg-white text-slate-800 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                        >
                            Mission Brief
                        </button>
                        <button
                            onClick={() => setActiveTab('map')}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'map' ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                        >
                            <Map size={14} /> Tactical Map
                        </button>
                   </div>
               )}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950">
               {isEditing ? (
                  <form onSubmit={handleEditSubmit} className="p-6 space-y-6">
                      <h3 className="font-bold text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-2">Edit Mission Details</h3>
                      
                      <div>
                         <label className="block text-sm font-medium mb-1 dark:text-slate-300">Title</label>
                         <Input name="title" defaultValue={mission.title} required />
                      </div>

                      <div>
                         <label className="block text-sm font-medium mb-1 dark:text-slate-300">Description</label>
                         <textarea 
                           className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:border-guild-500 focus:ring-2 focus:ring-guild-200 outline-none h-32 bg-white text-slate-900 dark:bg-white dark:text-slate-900 dark:border-slate-200"
                           name="description"
                           defaultValue={mission.description}
                           required
                         />
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                          <label className="block text-xs font-bold text-slate-500 uppercase dark:text-slate-400">Reward Configuration</label>
                          <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setRewardType('credits')}
                                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                                        rewardType === 'credits' 
                                        ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800' 
                                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                                    }`}
                                >
                                    <DollarSign size={14} /> Credits
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRewardType('gift_card')}
                                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                                        rewardType === 'gift_card' 
                                        ? 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800' 
                                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                                    }`}
                                >
                                    <Gift size={14} /> Gift Card
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRewardType('custom')}
                                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                                        rewardType === 'custom' 
                                        ? 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' 
                                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                                    }`}
                                >
                                    <Star size={14} /> Custom
                                </button>
                          </div>
                          
                          <div className="grid grid-cols-1 gap-4">
                             {rewardType === 'credits' ? (
                                 <div>
                                    <label className="block text-sm font-medium mb-1 dark:text-slate-300">Base Reward (Credits)</label>
                                    <Input name="reward" type="number" defaultValue={mission.reward} required min="0" />
                                 </div>
                             ) : (
                                 <div>
                                    <label className="block text-sm font-medium mb-1 dark:text-slate-300">
                                        {rewardType === 'gift_card' ? 'Gift Card Details' : 'Custom Reward Description'}
                                    </label>
                                    <Input name="customReward" defaultValue={mission.customReward || ''} placeholder="e.g. $50 Amazon Card, Rare Item" required />
                                 </div>
                             )}
                          </div>
                      </div>

                      <div>
                         <label className="block text-sm font-medium mb-1 dark:text-slate-300">Tags</label>
                         <div className="relative">
                            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <Input 
                                className="pl-9" 
                                value={editTags} 
                                onChange={(e) => setEditTags(e.target.value)} 
                                placeholder="Stealth, Magic, Urgent..." 
                            />
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-sm font-medium mb-1 dark:text-slate-300">Location</label>
                            <Input name="location" defaultValue={mission.location} required />
                         </div>
                         <div>
                            <label className="block text-sm font-medium mb-1 dark:text-slate-300">Difficulty</label>
                            <select 
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white dark:bg-white dark:border-slate-200 dark:text-slate-900"
                                name="difficulty"
                                defaultValue={mission.difficulty}
                            >
                                {Object.values(MissionDifficulty).map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                         </div>
                      </div>

                      <div className="flex justify-end gap-3 pt-4">
                         <Button type="button" variant="secondary" onClick={() => setIsEditing(false)}>Cancel</Button>
                         <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white">
                            <Save size={16} /> Save Changes
                         </Button>
                      </div>
                  </form>
               ) : activeTab === 'brief' ? (
                   <div className="p-6 space-y-6">
                      {/* --- Primary Actions Section --- */}
                      {(canClaim || canStart || canComplete || canClaimReward) && (
                         <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-200 dark:bg-slate-900 dark:border-slate-800 transition-all">
                            {canClaim && (
                               <Button 
                                  onClick={() => onUpdateStatus(mission.id, MissionStatus.Claimed, "Claimed the mission.")} 
                                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                               >
                                  <Bookmark size={18} /> Claim Mission
                               </Button>
                            )}
                            {canStart && (
                               <div className="flex gap-2 w-full">
                                    <Button 
                                        onClick={() => onUpdateStatus(mission.id, MissionStatus.InProgress, "Mission operation started.")} 
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                    >
                                        <Zap size={18} /> Start Mission
                                    </Button>
                                    <Button 
                                        variant="danger"
                                        onClick={() => setShowDropInput(true)} 
                                        className="flex-1"
                                    >
                                        <BookmarkMinus size={18} /> Drop Mission
                                    </Button>
                               </div>
                            )}
                            
                            {/* Complete & Verify Button for Adventurer */}
                            {canComplete && (
                                <div className="space-y-4">
                                    {!isSubmittingProof ? (
                                        <Button 
                                            onClick={() => setIsSubmittingProof(true)} 
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20"
                                        >
                                            <CheckCircle2 size={18} /> Complete & Verify
                                        </Button>
                                    ) : (
                                        <div className="bg-slate-50 border border-indigo-100 rounded-lg p-4 animate-in fade-in slide-in-from-top-2 dark:bg-slate-800 dark:border-indigo-900/50">
                                            <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                                                <Upload size={16} className="text-indigo-500" /> Submit Proof of Completion
                                            </h3>
                                            
                                            {proofImage ? (
                                                <div className="space-y-3">
                                                    <div className="relative w-full h-48 bg-slate-200 rounded-lg overflow-hidden group border border-slate-300 dark:border-slate-600">
                                                        <img src={proofImage} alt="Proof" className="w-full h-full object-cover" />
                                                        <button onClick={() => setProofImage(null)} className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button variant="secondary" onClick={() => setIsSubmittingProof(false)} className="flex-1">
                                                            Cancel
                                                        </Button>
                                                        <Button onClick={handleSubmitProof} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                                                            Submit Proof
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer bg-white hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-600 dark:hover:bg-slate-800 transition-all">
                                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                            <Upload className="w-8 h-8 mb-3 text-slate-400" />
                                                            <p className="mb-2 text-sm text-slate-500 dark:text-slate-400"><span className="font-semibold">Click to upload</span> evidence</p>
                                                            <p className="text-xs text-slate-400">PNG, JPG up to 10MB</p>
                                                        </div>
                                                        <input type="file" className="hidden" accept="image/*" onChange={handleProofUpload} />
                                                    </label>
                                                    <Button variant="secondary" onClick={() => setIsSubmittingProof(false)} className="w-full">
                                                        Cancel
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Claim Reward Button for Adventurer */}
                            {canClaimReward && (
                                <div className="space-y-2 animate-in fade-in zoom-in duration-300">
                                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center dark:bg-emerald-900/20 dark:border-emerald-800 mb-3">
                                        <p className="text-emerald-700 dark:text-emerald-400 text-sm font-bold flex items-center justify-center gap-2">
                                            <CheckCircle2 size={16} /> Mission Verified Successfully!
                                        </p>
                                    </div>
                                    <Button 
                                        onClick={handleClaimReward} 
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/30 text-lg py-3 h-auto"
                                    >
                                        <DollarSign size={20} /> Claim {mission.customReward ? 'Reward' : `${mission.reward} Credits`}
                                    </Button>
                                </div>
                            )}
                         </div>
                      )}

                      {/* --- Drop Mission Confirmation --- */}
                      {showDropInput && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl dark:bg-red-900/20 dark:border-red-900 animate-in fade-in slide-in-from-top-2">
                           <h3 className="font-bold text-red-600 flex items-center gap-2 text-sm">
                              <AlertCircle size={16} /> Confirm Mission Drop
                           </h3>
                           <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-2">
                              Dropping a mission may affect your completion rate. Please provide a reason.
                           </p>
                           <textarea
                              className="w-full p-3 rounded-lg border border-red-200 focus:ring-2 focus:ring-red-500/20 outline-none text-sm bg-white text-slate-900 dark:bg-white dark:border-red-900/50 dark:text-slate-900"
                              placeholder="Reason for dropping..."
                              value={dropReason}
                              onChange={(e) => setDropReason(e.target.value)}
                              autoFocus
                           />
                           <div className="flex gap-2 justify-end mt-2">
                              <Button variant="ghost" onClick={() => { setShowDropInput(false); setDropReason(''); }} className="text-sm">Cancel</Button>
                              <Button onClick={handleDropSubmit} disabled={!dropReason.trim()} variant="danger" className="text-sm">
                                 Confirm Drop
                              </Button>
                           </div>
                        </div>
                      )}

                      {/* --- Issuer & Admin Verification Section --- */}
                      {canVerify && (
                          <div className="p-5 bg-indigo-50 border border-indigo-200 rounded-xl dark:bg-indigo-900/20 dark:border-indigo-800 shadow-sm relative overflow-hidden">
                              <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                                  <Shield size={100} className="text-indigo-500" />
                              </div>
                              
                              <div className="relative z-10">
                                  <h3 className="font-bold text-indigo-800 mb-4 flex items-center gap-2 dark:text-indigo-200 text-lg">
                                      <Stamp size={20} /> Verification Console
                                  </h3>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                      <div className="space-y-2">
                                          <p className="text-xs font-bold text-slate-500 uppercase dark:text-slate-400">Agent Submission</p>
                                          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded border border-indigo-100 dark:border-slate-700">
                                              <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-500 overflow-hidden">
                                                  {/* Mock Avatar based on ID */}
                                                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${mission.assigneeId}`} alt="Avatar" className="w-full h-full object-cover" />
                                              </div>
                                              <div>
                                                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{mission.assigneeId || 'Unknown Agent'}</p>
                                                  <p className="text-[10px] text-slate-400">Operative</p>
                                              </div>
                                          </div>
                                      </div>
                                      
                                      <div className="space-y-2">
                                          <p className="text-xs font-bold text-slate-500 uppercase dark:text-slate-400">Proof of Work</p>
                                          {proofImage ? (
                                              <div className="h-24 bg-slate-200 rounded border border-slate-300 dark:border-slate-700 overflow-hidden relative group cursor-pointer" onClick={() => window.open(proofImage, '_blank')}>
                                                  <img src={proofImage} alt="Proof" className="w-full h-full object-cover" />
                                                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs">
                                                      <ExternalLink size={14} className="mr-1" /> View Full
                                                  </div>
                                              </div>
                                          ) : (
                                              <div className="h-24 bg-slate-100 rounded border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-xs italic dark:bg-slate-800 dark:border-slate-700">
                                                  No proof attached
                                              </div>
                                          )}
                                      </div>
                                  </div>

                                  <div className="space-y-4">
                                      <textarea 
                                          className="w-full p-3 rounded-lg border border-indigo-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm dark:bg-slate-950 dark:border-slate-700 dark:text-slate-200"
                                          placeholder="Enter verification notes or rejection reason..."
                                          value={verificationNote}
                                          onChange={(e) => setVerificationNote(e.target.value)}
                                      />
                                      
                                      <div className="flex gap-3 justify-end">
                                          <button 
                                              onClick={() => setVerificationStamp('NOT PASS')}
                                              className={`flex-1 py-3 rounded-lg border-2 flex flex-col items-center gap-2 w-32 transition-all ${
                                                  verificationStamp === 'NOT PASS' 
                                                  ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20' 
                                                  : 'border-slate-300 text-slate-500 hover:border-red-300 dark:border-slate-700 dark:text-slate-400'
                                              }`}
                                          >
                                              <Ban size={18} /> REJECT
                                          </button>
                                          <button 
                                              onClick={() => setVerificationStamp('PASS')}
                                              className={`flex-1 py-3 rounded-lg border-2 flex flex-col items-center gap-2 w-32 transition-all ${
                                                  verificationStamp === 'PASS' 
                                                  ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20' 
                                                  : 'border-slate-300 text-slate-500 hover:border-green-300 dark:border-slate-700 dark:text-slate-400'
                                              }`}
                                          >
                                              <Stamp size={18} /> APPROVE
                                          </button>
                                      </div>
                                      
                                      <Button 
                                          onClick={handleVerifyConfirm} 
                                          disabled={!verificationStamp}
                                          className="w-full py-3 text-base bg-indigo-600 hover:bg-indigo-700 text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                          Confirm Decision
                                      </Button>
                                  </div>
                              </div>
                          </div>
                      )}

                      {/* ... Metadata Grid ... */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800">
                         <div className="space-y-1">
                            <span className="text-xs text-slate-400 uppercase font-bold">Reward</span>
                            <div className="font-bold text-guild-600 dark:text-guild-400 flex items-center gap-1">
                                {mission.customReward ? (
                                    <>
                                        <Gift size={14} className="text-purple-500" />
                                        <span className="text-sm truncate" title={mission.customReward}>{mission.customReward}</span>
                                    </>
                                ) : (
                                    `${mission.reward} Credits`
                                )}
                            </div>
                         </div>
                         <div className="space-y-1 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-1 rounded transition-colors" onClick={() => setActiveTab('map')} title="View Map">
                            <span className="text-xs text-slate-400 uppercase font-bold">Location</span>
                            <div className="flex items-center gap-1 text-sm dark:text-slate-300">
                               <MapPin size={14} /> {mission.location}
                            </div>
                         </div>
                         <div className="space-y-1">
                            <span className="text-xs text-slate-400 uppercase font-bold">Type</span>
                            <div className="flex items-center gap-1 text-sm dark:text-slate-300">
                               <Badge className={`${TYPE_COLORS[mission.type] || 'bg-slate-100 text-slate-700'} border flex items-center gap-1 w-fit`}>
                                  {TYPE_ICONS[mission.type]} {mission.type}
                               </Badge>
                            </div>
                         </div>
                         <div className="space-y-1">
                            <span className="text-xs text-slate-400 uppercase font-bold">Distributed</span>
                            <div className="flex items-center gap-1 text-sm dark:text-slate-300">
                               <Calendar size={14} /> {new Date(mission.postedDate).toLocaleDateString()}
                            </div>
                         </div>
                         <div className="space-y-1">
                            <span className="text-xs text-slate-400 uppercase font-bold">Deadline</span>
                            <div className="flex items-center gap-1 text-sm dark:text-slate-300">
                               <Clock size={14} /> {new Date(mission.expiryDate).toLocaleDateString()}
                            </div>
                         </div>
                      </div>

                      {/* Tags Display */}
                      {mission.tags && mission.tags.length > 0 && (
                          <div>
                              <span className="text-xs text-slate-400 uppercase font-bold mb-1 block">Mission Tags</span>
                              <div className="flex flex-wrap gap-2">
                                  {mission.tags.map(tag => (
                                      <Badge key={tag} className="bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 flex items-center gap-1">
                                          <Tag size={10} /> {tag}
                                      </Badge>
                                  ))}
                              </div>
                          </div>
                      )}

                      {/* ... Virtual Uplink ... */}
                      {mission.virtualCoordinates && (
                        <div className="mt-4 p-4 bg-indigo-50 border border-indigo-200 rounded-xl dark:bg-indigo-900/20 dark:border-indigo-800 animate-in fade-in slide-in-from-top-2">
                            <div className="flex justify-between items-start mb-3">
                                <h3 className="font-bold text-indigo-800 flex items-center gap-2 dark:text-indigo-200">
                                    <Video size={16} /> Virtual Connection Uplink
                                </h3>
                                {mission.virtualCoordinates.platform && (
                                    <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300">
                                        {mission.virtualCoordinates.platform}
                                    </Badge>
                                )}
                            </div>
                            
                            {canViewVirtualDetails ? (
                                <div className="space-y-3">
                                    <div className="flex gap-2">
                                        <div className="flex-1 p-2 bg-white dark:bg-slate-900 rounded border border-indigo-100 dark:border-slate-700 text-sm font-mono truncate text-slate-600 dark:text-slate-300">
                                            {mission.virtualCoordinates.link}
                                        </div>
                                        <Button variant="secondary" className="shrink-0" onClick={() => copyToClipboard(mission.virtualCoordinates!.link)} title="Copy Link"><Copy size={14} /></Button>
                                        <Button className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => window.open(mission.virtualCoordinates!.link, '_blank')}><ExternalLink size={14} /> Connect</Button>
                                    </div>
                                    
                                    {(mission.virtualCoordinates.roomId || mission.virtualCoordinates.password) && (
                                        <div className="grid grid-cols-2 gap-3 mt-2">
                                            {mission.virtualCoordinates.roomId && (
                                                <div>
                                                    <label className="text-[10px] uppercase font-bold text-indigo-400">Room ID</label>
                                                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded border border-indigo-100 dark:border-slate-700">
                                                        <span className="text-sm font-mono text-slate-700 dark:text-slate-300 flex-1">{mission.virtualCoordinates.roomId}</span>
                                                        <button onClick={() => copyToClipboard(mission.virtualCoordinates!.roomId!)} className="text-indigo-400 hover:text-indigo-600"><Copy size={12}/></button>
                                                    </div>
                                                </div>
                                            )}
                                            {mission.virtualCoordinates.password && (
                                                <div>
                                                    <label className="text-[10px] uppercase font-bold text-indigo-400">Password</label>
                                                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded border border-indigo-100 dark:border-slate-700">
                                                        <span className={`text-sm font-mono text-slate-700 dark:text-slate-300 flex-1 ${showVirtualPassword ? '' : 'blur-sm select-none'}`}>
                                                            {mission.virtualCoordinates.password}
                                                        </span>
                                                        <button onClick={() => setShowVirtualPassword(!showVirtualPassword)} className="text-indigo-400 hover:text-indigo-600">
                                                            {showVirtualPassword ? <EyeOff size={12}/> : <Eye size={12}/>}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center p-4 bg-white/50 dark:bg-slate-900/50 rounded border border-dashed border-indigo-200 dark:border-slate-700 text-center">
                                    <Lock size={24} className="text-indigo-300 mb-2" />
                                    <p className="text-sm font-bold text-indigo-800 dark:text-indigo-300">Uplink Encrypted</p>
                                    <p className="text-xs text-indigo-600 dark:text-indigo-400">Accept this mission to decrypt connection protocols and access codes.</p>
                                </div>
                            )}
                        </div>
                      )}

                      {/* ... Description ... */}
                      <div>
                         <h3 className="font-bold text-slate-800 mb-2 dark:text-slate-200">Mission Brief</h3>
                         <p className="text-slate-600 leading-relaxed whitespace-pre-line dark:text-slate-300">
                            {mission.description}
                         </p>
                      </div>

                      {/* ... History ... */}
                      <div className="mt-6 border-t border-slate-200 pt-6 dark:border-slate-800">
                            <h3 className="font-bold text-slate-800 mb-4 dark:text-slate-200 flex items-center gap-2">
                                <History size={16} /> Mission Timeline
                            </h3>
                            <div className="relative pl-8 border-l-2 border-slate-200 dark:border-slate-800 space-y-6">
                                {mission.history && mission.history.length > 0 ? (
                                    mission.history.map((entry, idx) => {
                                        let HistoryIcon = UserIcon;
                                        let iconColor = "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700";
                                        
                                        const changerLower = entry.changedBy.toLowerCase();
                                        if (changerLower.includes('admin') || changerLower.includes('system') || changerLower.includes('master') || changerLower.includes('guild')) {
                                            HistoryIcon = Shield;
                                            iconColor = "bg-indigo-100 text-indigo-600 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800";
                                        } else if (entry.changedBy === issuerName || Object.values(ISSUERS).includes(entry.changedBy)) {
                                            HistoryIcon = Briefcase;
                                            iconColor = "bg-amber-100 text-amber-600 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800";
                                        } else if (entry.changedBy === currentUser.name) {
                                            iconColor = "bg-emerald-100 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800";
                                        }

                                        const isStatusChange = entry.previousStatus !== entry.newStatus;

                                        return (
                                            <div key={idx} className="relative">
                                                <div className={`absolute -left-[41px] top-0 w-7 h-7 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 ${iconColor} z-10`} title={entry.changedBy}>
                                                    <HistoryIcon size={14} />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">{entry.changedBy} <HistoryIcon size={12} className="opacity-60" /></span>
                                                        <span className="text-slate-400 text-xs">{new Date(entry.timestamp).toLocaleString()}</span>
                                                    </div>
                                                    {isStatusChange ? (
                                                        <div className="text-sm flex flex-wrap gap-1 items-center">
                                                            <span className="text-slate-500 dark:text-slate-400">Status update:</span>
                                                            <Badge className="scale-90 origin-left !bg-slate-100 !text-slate-600 dark:!bg-slate-800 dark:!text-slate-400">{entry.previousStatus}</Badge>
                                                            <ArrowRight size={12} className="text-slate-400" />
                                                            <Badge className="scale-90 origin-left">{entry.newStatus}</Badge>
                                                        </div>
                                                    ) : (
                                                        <div className="text-sm text-slate-600 dark:text-slate-300 italic">{entry.reason || "Mission details updated"}</div>
                                                    )}
                                                    {isStatusChange && entry.reason && (
                                                        <div className="mt-1 text-xs text-slate-500 italic bg-slate-50 p-2 rounded dark:bg-slate-800 dark:text-slate-400">"{entry.reason}"</div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="text-sm text-slate-400 italic">No history recorded.</p>
                                )}
                            </div>
                       </div>

                      {/* ... Comments Section ... */}
                      <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                         <div className="flex items-center justify-between">
                            <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                               Guild Comms <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full dark:bg-slate-800 dark:text-slate-400">{mission.comments.length}</span>
                            </h3>
                         </div>

                         <div className="space-y-4 min-h-[100px]">
                            {mission.comments.length === 0 ? (
                               <div className="text-center py-8 text-slate-400 italic bg-slate-100/50 rounded-lg border border-dashed border-slate-200 dark:bg-slate-900/50 dark:border-slate-800">
                                  No communications logged. Be the first to inquire.
                                </div>
                            ) : (
                               mission.comments.map((comment) => (
                                  <div key={comment.id} className="flex gap-3 group">
                                     <div className="w-8 h-8 rounded-full bg-guild-100 flex items-center justify-center text-guild-700 shrink-0 border border-guild-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                                        <UserIcon size={14} />
                                     </div>
                                     <div className="flex-1 space-y-1">
                                        <div className="flex items-center gap-2">
                                           <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">{comment.userName}</span>
                                           <span className="text-[10px] text-slate-400">{formatDate(comment.timestamp)}</span>
                                        </div>
                                        <div className="bg-white p-3 rounded-tr-xl rounded-br-xl rounded-bl-xl border border-slate-200 text-sm text-slate-600 shadow-sm dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300">
                                           {comment.text}
                                        </div>
                                     </div>
                                  </div>
                               ))
                            )}
                            <div ref={commentsEndRef} />
                         </div>
                      </div>
                   </div>
               ) : (
                   /* Tactical Map View (Unchanged Logic, mostly) */
                   <div className="flex flex-col h-full bg-slate-950 text-slate-300">
                        {/* ... map content (unchanged) ... */}
                        <div className="p-2 border-b border-slate-800 bg-slate-900 flex justify-between items-center text-xs">
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setShowBranches(!showBranches)}
                                    className={`px-3 py-1.5 rounded border transition-all flex items-center gap-1.5 ${showBranches ? 'bg-indigo-900/50 border-indigo-700 text-indigo-300' : 'border-slate-700 text-slate-500 hover:text-slate-300'}`}
                                >
                                    <Building2 size={12} /> Guild Branches
                                </button>
                                <button 
                                    onClick={() => setShowRoutes(!showRoutes)}
                                    className={`px-3 py-1.5 rounded border transition-all flex items-center gap-1.5 ${showRoutes ? 'bg-emerald-900/50 border-emerald-700 text-emerald-300' : 'border-slate-700 text-slate-500 hover:text-slate-300'}`}
                                >
                                    <Navigation size={12} /> Safe Routes
                                </button>
                            </div>
                            <div className="flex items-center gap-2 bg-slate-950 border border-slate-700 rounded-md px-2 py-1">
                                <Search size={12} className="text-slate-500" />
                                <input 
                                    className="bg-transparent border-none outline-none text-xs text-slate-300 w-32 focus:w-48 transition-all font-mono placeholder:text-slate-600 bg-white dark:bg-white dark:text-slate-900 rounded px-1"
                                    value={mapSearchTerm}
                                    onChange={(e) => setMapSearchTerm(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleFetchIntel()}
                                    placeholder="SEARCH LOC..."
                                />
                            </div>
                        </div>

                        <div className="flex-1 flex overflow-hidden">
                            <div 
                                className="flex-1 relative bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black overflow-hidden"
                                onClick={() => setSelectedBranch(null)} 
                            >
                                <div className="absolute inset-0 opacity-10" style={{ 
                                    backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)', 
                                    backgroundSize: '40px 40px' 
                                }}></div>

                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="relative z-20 flex flex-col items-center group cursor-pointer" onClick={(e) => { e.stopPropagation(); setSelectedBranch(null); }}>
                                        <div className="w-4 h-4 bg-red-500 rounded-full animate-ping absolute"></div>
                                        <div className="w-4 h-4 bg-red-600 rounded-full border-2 border-white relative z-10 shadow-lg shadow-red-500/50"></div>
                                        <div className="mt-2 px-2 py-1 bg-black/80 text-white text-[10px] rounded backdrop-blur-sm border border-red-500/30">Target: {mission.location}</div>
                                    </div>

                                    {showRoutes && (
                                        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-50">
                                            <line x1="50%" y1="50%" x2="20%" y2="30%" stroke="#10b981" strokeWidth="2" strokeDasharray="5,5" />
                                            <line x1="50%" y1="50%" x2="80%" y2="70%" stroke="#10b981" strokeWidth="2" strokeDasharray="5,5" />
                                            <line x1="50%" y1="50%" x2="70%" y2="20%" stroke="#10b981" strokeWidth="2" strokeDasharray="5,5" />
                                        </svg>
                                    )}

                                    {showBranches && GUILD_BRANCHES.map(branch => (
                                        <div 
                                            key={branch.id} 
                                            className={`absolute z-10 flex flex-col items-center cursor-pointer transition-transform duration-200 hover:scale-110 ${selectedBranch?.id === branch.id ? 'scale-110 z-30' : ''}`}
                                            style={branch.style}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedBranch(branch);
                                            }}
                                        >
                                            <div className={`w-4 h-4 ${branch.color} rounded-full border-2 border-white shadow-lg ${selectedBranch?.id === branch.id ? 'ring-4 ring-white/30' : ''}`}></div>
                                            <div className={`mt-1 text-[9px] font-mono px-2 py-0.5 rounded bg-slate-900/80 backdrop-blur-sm border ${selectedBranch?.id === branch.id ? 'border-white text-white' : 'border-transparent text-slate-400'}`}>
                                                {branch.name}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Info Side Panel */}
                            <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col transition-all duration-300">
                                {/* ... Panel Content ... */}
                                <div className="p-4 border-b border-slate-800">
                                    <h3 className="font-bold text-slate-100 mb-1 flex items-center gap-2">
                                        {selectedBranch ? (
                                            <>
                                                <Building2 size={16} className="text-indigo-400"/> Branch Intel
                                            </>
                                        ) : (
                                            <>
                                                <Locate size={16} className="text-cyan-400"/> Location Intel
                                            </>
                                        )}
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        {selectedBranch ? "Secure Guild Outpost Data" : "Scan area for geographical data."}
                                    </p>
                                </div>
                                
                                <div className="flex-1 p-4 overflow-y-auto space-y-4">
                                    {selectedBranch ? (
                                        <div className="animate-in fade-in slide-in-from-right-4 space-y-4">
                                            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                                                <h4 className="font-bold text-slate-200 mb-2">{selectedBranch.name}</h4>
                                                <p className="text-xs text-slate-400 leading-relaxed mb-4">{selectedBranch.description}</p>
                                                
                                                <div className="flex items-center justify-between text-xs mb-3">
                                                    <span className="text-slate-500 uppercase font-bold">Status</span>
                                                    <Badge className={`${
                                                        selectedBranch.status === 'Active' ? 'bg-green-900/30 text-green-400 border-green-800' :
                                                        selectedBranch.status === 'Under Attack' ? 'bg-red-900/30 text-red-400 border-red-800' :
                                                        'bg-amber-900/30 text-amber-400 border-amber-800'
                                                    }`}>
                                                        {selectedBranch.status}
                                                    </Badge>
                                                </div>
                                                
                                                <div className="text-xs space-y-1">
                                                    <span className="text-slate-500 uppercase font-bold block mb-1">Available Services</span>
                                                    <div className="flex flex-wrap gap-1">
                                                        {selectedBranch.services.map(service => (
                                                            <span key={service} className="px-2 py-1 bg-slate-800 rounded text-slate-300 border border-slate-700">
                                                                {service}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <Button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs">
                                                Request Support from {selectedBranch.name}
                                            </Button>
                                        </div>
                                    ) : !locationIntel ? (
                                        <div className="text-center py-10 text-slate-500">
                                            {isLoadingIntel ? (
                                                <div className="flex flex-col items-center gap-3">
                                                    <Loader2 className="animate-spin text-cyan-500" size={32} />
                                                    <p className="text-xs animate-pulse">Establishing uplink...</p>
                                                </div>
                                            ) : (
                                                <>
                                                    <Map size={32} className="mx-auto mb-2 opacity-20" />
                                                    <p className="text-sm mb-4">No tactical data loaded.</p>
                                                    <Button 
                                                        onClick={handleFetchIntel} 
                                                        disabled={isLoadingIntel}
                                                        className="w-full bg-cyan-900/30 text-cyan-400 border border-cyan-800 hover:bg-cyan-900/50"
                                                    >
                                                        Request Satellite Scan
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="animate-in fade-in slide-in-from-right-4">
                                            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 mb-4">
                                                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line font-mono">
                                                    {locationIntel.text}
                                                </p>
                                            </div>
                                            
                                            {locationIntel.links && locationIntel.links.length > 0 && (
                                                <div className="space-y-2">
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Reference Links</p>
                                                    {locationIntel.links.map((chunk, idx) => (
                                                        chunk.web?.uri ? (
                                                            <a 
                                                                key={idx} 
                                                                href={chunk.web.uri} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-2 p-2 rounded bg-slate-800/50 hover:bg-slate-800 text-xs text-blue-400 transition-colors truncate"
                                                            >
                                                                <ExternalLink size={12} className="shrink-0" />
                                                                <span className="truncate">{chunk.web.title || chunk.web.uri}</span>
                                                            </a>
                                                        ) : chunk.maps?.uri ? (
                                                            <a 
                                                                key={idx} 
                                                                href={chunk.maps.uri} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-2 p-2 rounded bg-slate-800/50 hover:bg-slate-800 text-xs text-green-400 transition-colors truncate"
                                                            >
                                                                <MapPin size={12} className="shrink-0" />
                                                                <span className="truncate">{chunk.maps.title || "View on Google Maps"}</span>
                                                            </a>
                                                        ) : null
                                                    ))}
                                                </div>
                                            )}
                                            
                                            <div className="mt-4 pt-4 border-t border-slate-800">
                                                <Button 
                                                    onClick={handleFetchIntel} 
                                                    disabled={isLoadingIntel}
                                                    variant="secondary"
                                                    className="w-full text-xs"
                                                >
                                                    {isLoadingIntel ? <Loader2 className="animate-spin" size={14} /> : 'Refresh Intel'}
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                   </div>
               )}
            </div>

            {/* Footer Input - Hide in edit, map, or verification mode to avoid clutter */}
            {!isEditing && activeTab === 'brief' && !canVerify && (
                <div className="p-4 bg-white border-t border-slate-200 dark:bg-slate-900 dark:border-slate-800 shrink-0">
                   <form onSubmit={handleSubmit} className="flex gap-2">
                      <div className="relative flex-1">
                         <input
                            className="w-full pl-4 pr-4 py-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-guild-500/20 focus:border-guild-500 transition-all text-slate-900 placeholder:text-slate-400 dark:bg-white dark:border-slate-200 dark:text-slate-900 dark:placeholder:text-slate-500"
                            placeholder="Write a comment or inquiry..."
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                         />
                      </div>
                      <Button type="submit" disabled={!commentText.trim()} className="!px-4">
                         <Send size={18} />
                      </Button>
                   </form>
                </div>
            )}
        </Card>
     </div>
  );
};
