
import React, { useState } from 'react';
import { Mission, MissionStatus, Ad, FeedbackItem, UserRole, User, AdminLog } from '../types';
import { Card, Button, Badge, Input } from './Shared';
import { Shield, Users, AlertCircle, CheckCircle2, Search, FileText, Ban, DollarSign, Lock, Megaphone, BrainCircuit, Loader2, Gavel, AlertTriangle, Briefcase, Plus, Trash2, Edit2, ExternalLink, X, MessageSquare, Clock, Inbox, ChevronRight, Send, Check, UserCog, ClipboardList, Stamp, Eye, EyeOff, Video, Copy, Monitor, MoreVertical, PlayCircle, PauseCircle, Tag, Filter, Download, Calendar, Crosshair, User as UserIcon, Server } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { STATUS_COLORS, AD_THEMES } from '../constants';
import { analyzeUserReports, UserReportAnalysis } from '../services/geminiService';

interface AdminDashboardProps {
  missions: Mission[];
  onUpdateStatus: (missionId: string, status: MissionStatus, reason?: string, proofUrl?: string, adminVerification?: Mission['adminVerification']) => void;
  onLogAction: (action: string, targetId: string, details?: string) => void;
  adminLogs: AdminLog[];
  ads?: Ad[];
  onUpdateAds?: (ads: Ad[]) => void;
  chatCooldown?: number;
  onUpdateChatCooldown?: (seconds: number) => void;
  feedbacks?: FeedbackItem[];
  onUpdateFeedback?: (id: string, update: Partial<FeedbackItem>) => void;
  currentUser: User;
}

// Mock User Data for Admin View (initial state)
const INITIAL_MOCK_USERS = [
  { id: 'u1', name: 'Adventurer Alex', role: 'Student', status: 'Active', reports: 0, context: "Clean record. Occasional late turn-ins.", adminTags: ['Internal Note: Good Payer'] },
  { id: 'u2', name: 'Gary', role: 'Student', status: 'Active', reports: 3, context: "Multiple complaints about rude behavior in chat. Suspected of poaching low-level missions.", adminTags: ['Watchlist'] },
  { id: 'u3', name: 'Rogue123', role: 'Professional', status: 'Suspended', reports: 12, context: "Repeatedly abandoned critical missions. Verbal abuse towards guild staff. Attempted to bypass tax system.", adminTags: ['Flight Risk', 'Banned-Alt'] },
  { id: 'u4', name: 'Merlin', role: 'Professor', status: 'Active', reports: 1, context: "One report for confusing mission instructions. Likely a misunderstanding.", adminTags: [] },
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
    missions, 
    onUpdateStatus, 
    onLogAction,
    adminLogs,
    ads = [], 
    onUpdateAds,
    chatCooldown = 30,
    onUpdateChatCooldown,
    feedbacks = [],
    onUpdateFeedback,
    currentUser
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'missions' | 'users' | 'partnerships' | 'audit' | 'reports' | 'system'>('overview');
  
  // User Management State
  const [users, setUsers] = useState(INITIAL_MOCK_USERS);
  const [analyzingUserId, setAnalyzingUserId] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<UserReportAnalysis | null>(null);
  const [userToEditRole, setUserToEditRole] = useState<{id: string, name: string, currentRole: string} | null>(null);
  const [actionMenuUserId, setActionMenuUserId] = useState<string | null>(null);
  
  // Admin Tags State
  const [userToEditTags, setUserToEditTags] = useState<{id: string, name: string, tags: string[]} | null>(null);
  const [newTagInput, setNewTagInput] = useState('');

  // Ad Management State
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);

  // Report Management State
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [adminResponseText, setAdminResponseText] = useState('');
  const [pendingStatus, setPendingStatus] = useState<FeedbackItem['status'] | null>(null);

  // Mission Verification State
  const [missionToVerify, setMissionToVerify] = useState<Mission | null>(null);
  const [verificationStamp, setVerificationStamp] = useState<'PASS' | 'NOT PASS' | null>(null);
  const [verificationNote, setVerificationNote] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Audit Log State
  const [logSearch, setLogSearch] = useState('');
  const [logFilter, setLogFilter] = useState<'all' | 'security' | 'content'>('all');

  // Stats
  const pendingCount = missions.filter(m => m.status === MissionStatus.Verifying).length;
  const urgentCount = missions.filter(m => m.status === MissionStatus.Urgent).length;
  const totalCredits = missions.reduce((acc, curr) => acc + curr.reward, 0);

  const verificationQueue = missions.filter(m => m.status === MissionStatus.Verifying || m.status === MissionStatus.Hold);
  
  // Virtual Missions for tracking
  const virtualMissions = missions.filter(m => m.virtualCoordinates && m.status !== MissionStatus.Completed && m.status !== MissionStatus.Expired);

  const TRAFFIC_DATA = [
    { time: '08:00', users: 120 },
    { time: '10:00', users: 240 },
    { time: '12:00', users: 450 },
    { time: '14:00', users: 380 },
    { time: '16:00', users: 510 },
    { time: '18:00', users: 600 },
    { time: '20:00', users: 420 },
  ];

  const handleAnalyzeUser = async (user: typeof INITIAL_MOCK_USERS[0]) => {
    setAnalyzingUserId(user.id);
    setAnalysisResult(null);
    
    // Simulate AI delay for UX
    const result = await analyzeUserReports(user.name, user.reports, user.context);
    
    setAnalysisResult(result);
  };

  const closeAnalysisModal = () => {
    setAnalyzingUserId(null);
    setAnalysisResult(null);
  };

  const applyAction = (userId: string, action: string) => {
    setUsers(prev => prev.map(u => {
        if (u.id === userId) {
            let newStatus = u.status;
            if (action === 'Ban' || action === 'PermaBan') newStatus = 'Banned';
            if (action === 'TempBan' || action === 'Suspend') newStatus = 'Suspended';
            if (action === 'Warning' || action === 'Warn') newStatus = 'Warned';
            if (action === 'Reactivate' || action === 'Active') newStatus = 'Active';
            return { ...u, status: newStatus };
        }
        return u;
    }));
    onLogAction(action, userId, `System applied action: ${action}`);
    closeAnalysisModal();
    setActionMenuUserId(null);
  };

  const saveRoleChange = (newRole: string) => {
    if (!userToEditRole) return;
    setUsers(prev => prev.map(u => u.id === userToEditRole.id ? { ...u, role: newRole } : u));
    onLogAction('Role Change', userToEditRole.id, `Changed role to ${newRole}`);
    setUserToEditRole(null);
  };

  // Admin Tag Management
  const openTagEditor = (user: typeof INITIAL_MOCK_USERS[0]) => {
      setUserToEditTags({ id: user.id, name: user.name, tags: user.adminTags || [] });
      setNewTagInput('');
  };

  const handleAddTag = () => {
      if (!userToEditTags || !newTagInput.trim()) return;
      const updatedTags = [...userToEditTags.tags, newTagInput.trim()];
      setUserToEditTags({ ...userToEditTags, tags: updatedTags });
      
      // Update persistent list
      setUsers(prev => prev.map(u => u.id === userToEditTags.id ? { ...u, adminTags: updatedTags } : u));
      onLogAction('Add Admin Tag', userToEditTags.id, `Added tag: ${newTagInput}`);
      setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
      if (!userToEditTags) return;
      const updatedTags = userToEditTags.tags.filter(t => t !== tagToRemove);
      setUserToEditTags({ ...userToEditTags, tags: updatedTags });
      
      // Update persistent list
      setUsers(prev => prev.map(u => u.id === userToEditTags.id ? { ...u, adminTags: updatedTags } : u));
      onLogAction('Remove Admin Tag', userToEditTags.id, `Removed tag: ${tagToRemove}`);
  };

  // Mission Verification Logic
  const openVerification = (mission: Mission) => {
      setMissionToVerify(mission);
      setVerificationStamp(null);
      setVerificationNote('');
      setShowPassword(false);
  };

  const handleVerifyConfirm = () => {
      if (!missionToVerify || !verificationStamp) return;

      const isPassed = verificationStamp === 'PASS';
      const newStatus = isPassed ? MissionStatus.Verified : MissionStatus.Open; // Rejecting sends it back to Open or could fail it entirely
      const reason = isPassed ? "Admin Verified" : `Verification Failed: ${verificationNote || 'No specific reason'}`;

      onUpdateStatus(
          missionToVerify.id, 
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

      onLogAction(
          isPassed ? 'Verify Mission' : 'Reject Mission', 
          missionToVerify.id, 
          `Stamp: ${verificationStamp}. Note: ${verificationNote}`
      );

      setMissionToVerify(null);
  };

  // Ad Handlers
  const handleEditAd = (ad: Ad) => {
    setEditingAd(ad);
    setIsAdModalOpen(true);
  };

  const handleNewAd = () => {
    setEditingAd({
      id: `ad_${Date.now()}`,
      sponsorName: '',
      content: '',
      colorTheme: 'sunset',
      isActive: false,
      link: ''
    });
    setIsAdModalOpen(true);
  };

  const saveAd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAd || !onUpdateAds) return;

    // Check if ad exists
    const exists = ads.some(a => a.id === editingAd.id);
    let newAds = [];
    if (exists) {
      newAds = ads.map(a => a.id === editingAd.id ? editingAd : a);
    } else {
      newAds = [...ads, editingAd];
    }
    
    onUpdateAds(newAds);
    onLogAction(exists ? 'Update Ad' : 'Create Ad', editingAd.id, `Sponsor: ${editingAd.sponsorName}`);
    setIsAdModalOpen(false);
    setEditingAd(null);
  };

  const toggleAdStatus = (ad: Ad) => {
    if (!onUpdateAds) return;
    const newAds = ads.map(a => a.id === ad.id ? { ...a, isActive: !a.isActive } : a);
    onUpdateAds(newAds);
  };

  const deleteAd = (id: string) => {
    if (!onUpdateAds) return;
    if (confirm('Are you sure you want to delete this sponsorship campaign?')) {
       onUpdateAds(ads.filter(a => a.id !== id));
       onLogAction('Delete Ad', id);
    }
  };

  // Report Handlers
  const handleSelectReport = (id: string) => {
    setSelectedReportId(id);
    setPendingStatus(null);
    const report = feedbacks.find(f => f.id === id);
    if (report) {
        setAdminResponseText(report.adminResponse || '');
    }
  };

  const handleUpdateReportStatus = (status: FeedbackItem['status']) => {
    setPendingStatus(status);
  };

  const handleConfirmReportUpdate = () => {
    if (selectedReportId && onUpdateFeedback) {
        const updatePayload: Partial<FeedbackItem> = {
            adminResponse: adminResponseText
        };
        if (pendingStatus) {
            updatePayload.status = pendingStatus;
        }
        onUpdateFeedback(selectedReportId, updatePayload);
        onLogAction('Update Report', selectedReportId, `Status: ${pendingStatus}, Response: ${adminResponseText}`);
        
        // Reset pending states
        setPendingStatus(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const selectedReport = feedbacks.find(f => f.id === selectedReportId);
  const effectiveStatus = pendingStatus || selectedReport?.status;
  const hasUnsavedReportChanges = (selectedReport && (pendingStatus || adminResponseText !== (selectedReport.adminResponse || '')));

  // Filter logs logic
  const filteredLogs = adminLogs.filter(log => {
      const matchesSearch = log.action.toLowerCase().includes(logSearch.toLowerCase()) ||
                            log.adminName.toLowerCase().includes(logSearch.toLowerCase()) ||
                            log.targetId.toLowerCase().includes(logSearch.toLowerCase()) ||
                            (log.details && log.details.toLowerCase().includes(logSearch.toLowerCase()));
      
      if (!matchesSearch) return false;

      if (logFilter === 'all') return true;
      
      const lowerAction = log.action.toLowerCase();
      const securityKeywords = ['ban', 'suspend', 'warn', 'reactivate', 'role', 'permission'];
      const isSecurity = securityKeywords.some(k => lowerAction.includes(k));

      if (logFilter === 'security') return isSecurity;
      if (logFilter === 'content') return !isSecurity; // Assuming everything else is content/system
      
      return true;
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const getLogStyle = (action: string) => {
      const lower = action.toLowerCase();
      if (lower.includes('ban') || lower.includes('delete') || lower.includes('reject') || lower.includes('remove')) {
          return { 
              dot: 'bg-red-500', 
              badge: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900',
              icon: <Ban size={14} /> 
          };
      }
      if (lower.includes('verify') || lower.includes('approve') || lower.includes('reactivate') || lower.includes('resolve') || lower.includes('pass') || lower.includes('create')) {
          return { 
              dot: 'bg-green-500', 
              badge: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-900',
              icon: <Check size={14} />
          };
      }
      if (lower.includes('warn') || lower.includes('suspend') || lower.includes('edit') || lower.includes('update')) {
          return { 
              dot: 'bg-amber-500', 
              badge: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-900',
              icon: <AlertTriangle size={14} />
          };
      }
      return { 
          dot: 'bg-indigo-500', 
          badge: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-900',
          icon: <FileText size={14} />
      };
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
         <div>
           <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
             <Shield className="text-indigo-600 dark:text-indigo-400" /> Admin Command Console
           </h2>
           <p className="text-slate-500 dark:text-slate-400">Restricted Access • Clearance Level 5</p>
         </div>
         <div className="flex gap-2 flex-wrap">
            {(['overview', 'missions', 'audit', 'users', 'reports', 'partnerships', 'system'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                  activeTab === tab 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
              >
                {tab}
              </button>
            ))}
         </div>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           <Card className="p-6 border-l-4 border-l-yellow-500">
              <div className="flex justify-between items-start">
                 <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Approvals</p>
                    <p className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-1">{pendingCount}</p>
                 </div>
                 <div className="p-2 bg-yellow-100 rounded-lg text-yellow-600 dark:bg-yellow-900/30">
                    <FileText size={20} />
                 </div>
              </div>
           </Card>
           <Card className="p-6 border-l-4 border-l-red-500">
              <div className="flex justify-between items-start">
                 <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Urgent Ops</p>
                    <p className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-1">{urgentCount}</p>
                 </div>
                 <div className="p-2 bg-red-100 rounded-lg text-red-600 dark:bg-red-900/30">
                    <AlertCircle size={20} />
                 </div>
              </div>
           </Card>
           <Card className="p-6 border-l-4 border-l-green-500">
              <div className="flex justify-between items-start">
                 <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Users</p>
                    <p className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-1">1,420</p>
                 </div>
                 <div className="p-2 bg-green-100 rounded-lg text-green-600 dark:bg-green-900/30">
                    <Users size={20} />
                 </div>
              </div>
           </Card>
           <Card className="p-6 border-l-4 border-l-amber-500">
              <div className="flex justify-between items-start">
                 <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Treasury Flow</p>
                    <p className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-1">{totalCredits}</p>
                 </div>
                 <div className="p-2 bg-amber-100 rounded-lg text-amber-600 dark:bg-amber-900/30">
                    <DollarSign size={20} />
                 </div>
              </div>
           </Card>

           <Card className="md:col-span-2 lg:col-span-3 h-80 p-6">
              <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4">System Traffic Load</h3>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={TRAFFIC_DATA}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                  <XAxis dataKey="time" tick={{fill: '#94a3b8'}} />
                  <YAxis tick={{fill: '#94a3b8'}} />
                  <Tooltip contentStyle={{backgroundColor: '#1e293b', border: 'none', color: '#f8fafc'}} />
                  <Area type="monotone" dataKey="users" stroke="#6366f1" fillOpacity={1} fill="url(#colorUsers)" />
                </AreaChart>
              </ResponsiveContainer>
           </Card>

           <Card className="p-6">
              <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4">Server Health</h3>
              <div className="space-y-4">
                 <div>
                    <div className="flex justify-between text-xs mb-1 dark:text-slate-400">
                       <span>CPU Usage</span>
                       <span>45%</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden dark:bg-slate-800">
                       <div className="h-full bg-green-500 w-[45%]"></div>
                    </div>
                 </div>
                 <div>
                    <div className="flex justify-between text-xs mb-1 dark:text-slate-400">
                       <span>Memory</span>
                       <span>72%</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden dark:bg-slate-800">
                       <div className="h-full bg-yellow-500 w-[72%]"></div>
                    </div>
                 </div>
                 <div>
                    <div className="flex justify-between text-xs mb-1 dark:text-slate-400">
                       <span>Storage</span>
                       <span>28%</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden dark:bg-slate-800">
                       <div className="h-full bg-blue-500 w-[28%]"></div>
                    </div>
                 </div>
              </div>
           </Card>
        </div>
      )}

      {/* ... (Existing Missions Tab Content) ... */}
      {activeTab === 'missions' && (
         <div className="space-y-6">
             {/* Verification Queue */}
             <Card className="p-0 overflow-hidden">
                 <div className="p-4 border-b border-slate-200 bg-slate-50/50 dark:bg-slate-900/50 dark:border-slate-800 flex justify-between items-center">
                     <h3 className="font-bold dark:text-slate-200">Mission Verification Queue</h3>
                     <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">{verificationQueue.length} Pending</Badge>
                 </div>
                 <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {verificationQueue.length === 0 ? (
                       <div className="p-12 text-center text-slate-400">
                          <CheckCircle2 size={48} className="mx-auto mb-4 text-green-500 opacity-50" />
                          <p>All clear. No missions require moderation.</p>
                       </div>
                    ) : (
                       verificationQueue.map(m => (
                          <div key={m.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                             <div className="flex flex-col md:flex-row justify-between gap-4">
                                <div className="flex-1">
                                   <div className="flex items-center gap-2 mb-1">
                                     <Badge className={STATUS_COLORS[m.status]}>{m.status}</Badge>
                                     <span className="text-xs text-slate-400">ID: {m.id}</span>
                                     {m.location === 'Virtual' && <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200">Virtual</Badge>}
                                   </div>
                                   <h4 className="font-bold text-slate-800 dark:text-slate-200">{m.title}</h4>
                                   <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-1">{m.description}</p>
                                   <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                                      <span className="flex items-center gap-1"><Users size={12}/> Assg: {m.assigneeId || 'None'}</span>
                                      <span className="flex items-center gap-1"><DollarSign size={12}/> {m.reward}</span>
                                   </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                   <Button 
                                      className="!bg-indigo-600 hover:!bg-indigo-700 !text-white !py-1 !px-3 !text-xs"
                                      onClick={() => openVerification(m)}
                                   >
                                      Verify Form
                                   </Button>
                                </div>
                             </div>
                          </div>
                       ))
                    )}
                 </div>
             </Card>

             {/* Virtual Surveillance Section */}
             <Card className="p-0 overflow-hidden border border-indigo-100 dark:border-indigo-900/50">
                 <div className="p-4 border-b border-slate-200 bg-slate-50/50 dark:bg-slate-900/50 dark:border-slate-800 flex justify-between items-center">
                     <h3 className="font-bold dark:text-slate-200 flex items-center gap-2">
                         <Monitor size={18} className="text-indigo-500" /> Virtual Surveillance
                     </h3>
                     <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
                         {virtualMissions.length} Active Channels
                     </Badge>
                 </div>
                 <div className="overflow-x-auto">
                     <table className="w-full text-sm text-left">
                         <thead className="bg-slate-50 text-slate-500 font-medium dark:bg-slate-900/50 dark:text-slate-400">
                             <tr>
                                 <th className="p-4">Mission ID</th>
                                 <th className="p-4">Platform</th>
                                 <th className="p-4">Uplink</th>
                                 <th className="p-4">Room / Pass</th>
                                 <th className="p-4">Status</th>
                             </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                             {virtualMissions.length === 0 ? (
                                 <tr>
                                     <td colSpan={5} className="p-8 text-center text-slate-400 italic">No active virtual links.</td>
                                 </tr>
                             ) : (
                                 virtualMissions.map(m => (
                                     <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/20">
                                         <td className="p-4 font-mono text-xs dark:text-slate-300">{m.id}</td>
                                         <td className="p-4 dark:text-slate-300">{m.virtualCoordinates?.platform}</td>
                                         <td className="p-4">
                                             <a href={m.virtualCoordinates?.link} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1 max-w-[150px] truncate text-xs">
                                                 {m.virtualCoordinates?.link} <ExternalLink size={10} />
                                             </a>
                                         </td>
                                         <td className="p-4">
                                             <div className="text-xs font-mono text-slate-700 dark:text-slate-300">
                                                 <div>R: {m.virtualCoordinates?.roomId || 'N/A'}</div>
                                                 <div className="text-red-500">P: {m.virtualCoordinates?.password || 'N/A'}</div>
                                             </div>
                                         </td>
                                         <td className="p-4">
                                             <Badge className={STATUS_COLORS[m.status]}>{m.status}</Badge>
                                         </td>
                                     </tr>
                                 ))
                             )}
                         </tbody>
                     </table>
                 </div>
             </Card>
         </div>
      )}

      {/* Enhanced Audit Log Panel */}
      {activeTab === 'audit' && (
          <Card className="p-0 overflow-hidden flex flex-col h-[700px]">
              {/* Header */}
              <div className="p-4 border-b border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600 border border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800">
                          <ClipboardList size={22} />
                      </div>
                      <div>
                          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">System Audit Log</h3>
                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                             <span className="flex items-center gap-1"><Shield size={10}/> Secure Record</span>
                             <span>•</span>
                             <span>{filteredLogs.length} Events</span>
                          </div>
                      </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                      <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                          <Input 
                              placeholder="Search logs..." 
                              className="!pl-9 !py-1.5 w-full sm:w-56 bg-slate-50 dark:bg-slate-950 text-xs"
                              value={logSearch}
                              onChange={(e) => setLogSearch(e.target.value)}
                          />
                      </div>
                      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                          {(['all', 'security', 'content'] as const).map(f => (
                              <button
                                key={f}
                                onClick={() => setLogFilter(f)}
                                className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition-all ${logFilter === f ? 'bg-white shadow text-indigo-600 dark:bg-slate-700 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                              >
                                {f}
                              </button>
                          ))}
                      </div>
                      <Button variant="secondary" className="!p-2" title="Export CSV" onClick={() => alert("Exporting audit log...")}>
                          <Download size={16} />
                      </Button>
                  </div>
              </div>

              {/* Log List */}
              <div className="flex-1 overflow-y-auto p-0 bg-slate-50/50 dark:bg-slate-950/30">
                  {filteredLogs.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-slate-400">
                          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 dark:bg-slate-800">
                             <ClipboardList size={32} className="opacity-40" />
                          </div>
                          <p className="font-medium">No records found matching criteria.</p>
                          <p className="text-xs mt-1">Try adjusting filters or search terms.</p>
                      </div>
                  ) : (
                      <div className="relative p-6 max-w-5xl mx-auto">
                          {/* Continuous Timeline Line */}
                          <div className="absolute left-9 top-6 bottom-6 w-px bg-slate-200 dark:bg-slate-800"></div>
                          
                          <div className="space-y-8">
                              {filteredLogs.map((log, index) => {
                                  const styles = getLogStyle(log.action);
                                  const date = new Date(log.timestamp);
                                  const isDifferentDay = index === 0 || new Date(filteredLogs[index - 1].timestamp).toDateString() !== date.toDateString();

                                  return (
                                      <React.Fragment key={log.id}>
                                          {isDifferentDay && (
                                              <div className="relative pl-12 mb-4 mt-2">
                                                  <div className="absolute left-[26px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700 ring-4 ring-slate-50 dark:ring-slate-900"></div>
                                                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                                                      {date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                                                  </span>
                                              </div>
                                          )}

                                          <div className="relative pl-12 group">
                                              {/* Timeline Dot with Icon */}
                                              <div className={`absolute left-[22px] top-5 w-8 h-8 rounded-full border-4 border-slate-50 dark:border-slate-900 z-10 flex items-center justify-center text-white shadow-sm ${styles.dot}`}>
                                                  {styles.icon} 
                                              </div>
                                              
                                              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-900/50 group-hover:translate-x-1 duration-200">
                                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4">
                                                      <div className="flex-1 min-w-0">
                                                          <div className="flex items-center gap-2 mb-1">
                                                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide border ${styles.badge}`}>
                                                                  {log.action}
                                                              </span>
                                                              <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                                                                  <Clock size={10} /> {date.toLocaleTimeString()}
                                                              </span>
                                                          </div>
                                                          <div className="flex items-center gap-2">
                                                              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                                                  <span className="text-slate-500 font-normal">Action by</span> {log.adminName}
                                                              </p>
                                                              <ChevronRight size={12} className="text-slate-300" />
                                                              <p className="text-sm font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 rounded">
                                                                  {log.targetId}
                                                              </p>
                                                          </div>
                                                          {log.details && (
                                                              <p className="text-xs text-slate-500 mt-2 dark:text-slate-400 leading-relaxed border-l-2 border-slate-200 dark:border-slate-700 pl-2">
                                                                  {log.details}
                                                              </p>
                                                          )}
                                                      </div>
                                                      
                                                      {/* Context Actions (Simulated) */}
                                                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                          <Button variant="ghost" className="h-8 w-8 !p-0 rounded-full" title="Copy Details">
                                                              <Copy size={14} />
                                                          </Button>
                                                          <Button variant="ghost" className="h-8 w-8 !p-0 rounded-full" title="View Target">
                                                              <ExternalLink size={14} />
                                                          </Button>
                                                      </div>
                                                  </div>
                                              </div>
                                          </div>
                                      </React.Fragment>
                                  );
                              })}
                          </div>
                      </div>
                  )}
              </div>
          </Card>
      )}

      {activeTab === 'users' && (
         <Card className="p-0 overflow-hidden h-full flex flex-col">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50 dark:bg-slate-900/50 dark:border-slate-800 flex justify-between items-center">
                 <h3 className="font-bold dark:text-slate-200 flex items-center gap-2">
                     <Users size={18} className="text-indigo-500" /> User Database
                 </h3>
                 <div className="flex gap-2">
                    <Input placeholder="Search users..." className="!py-1.5 !text-xs w-48" />
                    <Button variant="secondary" className="!py-1.5 !px-3 !text-xs">Export</Button>
                 </div>
            </div>
            <div className="flex-1 overflow-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium dark:bg-slate-900/50 dark:text-slate-400 sticky top-0 z-10">
                        <tr>
                            <th className="p-4">User</th>
                            <th className="p-4">Role</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Reports</th>
                            <th className="p-4">Admin Tags</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {users.map(user => (
                            <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/20">
                                <td className="p-4">
                                    <div className="font-bold text-slate-800 dark:text-slate-200">{user.name}</div>
                                    <div className="text-xs text-slate-400 font-mono">{user.id}</div>
                                </td>
                                <td className="p-4">
                                    <Badge className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">{user.role}</Badge>
                                </td>
                                <td className="p-4">
                                    <Badge className={
                                        user.status === 'Active' ? 'bg-green-100 text-green-700' :
                                        user.status === 'Banned' ? 'bg-red-100 text-red-700' :
                                        'bg-amber-100 text-amber-700'
                                    }>{user.status}</Badge>
                                </td>
                                <td className="p-4">
                                    {user.reports > 0 ? (
                                        <span className="text-red-500 font-bold flex items-center gap-1">
                                            <AlertCircle size={14} /> {user.reports}
                                        </span>
                                    ) : (
                                        <span className="text-slate-400">-</span>
                                    )}
                                </td>
                                <td className="p-4">
                                    <div className="flex flex-wrap gap-1">
                                        {user.adminTags?.map(tag => (
                                            <span key={tag} className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800">
                                                {tag}
                                            </span>
                                        ))}
                                        <button onClick={() => openTagEditor(user)} className="text-slate-400 hover:text-indigo-500"><Plus size={14}/></button>
                                    </div>
                                </td>
                                <td className="p-4 text-right relative">
                                    <button onClick={() => setActionMenuUserId(actionMenuUserId === user.id ? null : user.id)} className="p-1 hover:bg-slate-200 rounded text-slate-500">
                                        <MoreVertical size={16} />
                                    </button>
                                    {actionMenuUserId === user.id && (
                                        <>
                                            <div className="fixed inset-0 z-20" onClick={() => setActionMenuUserId(null)}></div>
                                            <div className="absolute right-8 top-4 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-30 flex flex-col overflow-hidden">
                                                <button onClick={() => handleAnalyzeUser(user)} className="px-4 py-2 text-left text-xs hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                                                    <BrainCircuit size={14} className="text-purple-500"/> AI Analysis
                                                </button>
                                                <button onClick={() => setUserToEditRole({ id: user.id, name: user.name, currentRole: user.role })} className="px-4 py-2 text-left text-xs hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                                                    <UserCog size={14} className="text-blue-500"/> Change Role
                                                </button>
                                                <div className="h-px bg-slate-100 dark:bg-slate-700"></div>
                                                {user.status !== 'Active' ? (
                                                    <button onClick={() => applyAction(user.id, 'Reactivate')} className="px-4 py-2 text-left text-xs hover:bg-slate-50 dark:hover:bg-slate-700 text-green-600 flex items-center gap-2">
                                                        <CheckCircle2 size={14} /> Reactivate
                                                    </button>
                                                ) : (
                                                    <>
                                                        <button onClick={() => applyAction(user.id, 'Warning')} className="px-4 py-2 text-left text-xs hover:bg-slate-50 dark:hover:bg-slate-700 text-amber-600 flex items-center gap-2">
                                                            <AlertTriangle size={14} /> Issue Warning
                                                        </button>
                                                        <button onClick={() => applyAction(user.id, 'Suspend')} className="px-4 py-2 text-left text-xs hover:bg-slate-50 dark:hover:bg-slate-700 text-amber-600 flex items-center gap-2">
                                                            <PauseCircle size={14} /> Suspend
                                                        </button>
                                                        <button onClick={() => applyAction(user.id, 'Ban')} className="px-4 py-2 text-left text-xs hover:bg-slate-50 dark:hover:bg-slate-700 text-red-600 flex items-center gap-2">
                                                            <Ban size={14} /> Ban User
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
         </Card>
      )}

      {activeTab === 'partnerships' && (
         <div className="space-y-6">
            <div className="flex justify-between items-center">
               <h3 className="font-bold text-lg dark:text-slate-100">Sponsorship Campaigns</h3>
               <Button onClick={handleNewAd} className="gap-2">
                  <Plus size={16} /> New Campaign
               </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {ads.map(ad => (
                  <Card key={ad.id} className="p-0 overflow-hidden group flex flex-col">
                     <div className={`h-24 p-4 ${AD_THEMES[ad.colorTheme]} text-white relative`}>
                        <h4 className="font-bold text-lg shadow-black/20 drop-shadow-md">{ad.sponsorName}</h4>
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEditAd(ad)} className="p-1 bg-white/20 hover:bg-white/30 rounded text-white">
                                <Edit2 size={14} />
                            </button>
                            <button onClick={() => deleteAd(ad.id)} className="p-1 bg-white/20 hover:bg-red-500/50 rounded text-white">
                                <Trash2 size={14} />
                            </button>
                        </div>
                     </div>
                     <div className="p-4 flex-1 flex flex-col">
                        <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 h-10 line-clamp-2">{ad.content}</p>
                        <div className="flex justify-between items-center mb-auto">
                           <Badge className={ad.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}>
                              {ad.isActive ? 'Active' : 'Draft'}
                           </Badge>
                           <Button variant="secondary" className="!py-1 !px-2 !text-xs" onClick={() => toggleAdStatus(ad)}>
                              {ad.isActive ? 'Pause' : 'Activate'}
                           </Button>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-1 text-[10px] text-slate-400">
                            {ad.startDate && (
                                <div className="flex justify-between">
                                    <span>Start:</span>
                                    <span className="font-mono text-slate-600 dark:text-slate-300">{new Date(ad.startDate).toLocaleDateString()}</span>
                                </div>
                            )}
                            {ad.endDate && (
                                <div className="flex justify-between">
                                    <span>End:</span>
                                    <span className="font-mono text-slate-600 dark:text-slate-300">{new Date(ad.endDate).toLocaleDateString()}</span>
                                </div>
                            )}
                            {!ad.startDate && !ad.endDate && <span className="italic opacity-50">No duration set</span>}
                        </div>
                     </div>
                  </Card>
               ))}
            </div>
         </div>
      )}

      {activeTab === 'reports' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[700px]">
              {/* Report List */}
              <Card className="col-span-1 p-0 overflow-hidden flex flex-col">
                  <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                      <h3 className="font-bold dark:text-slate-200">Support Tickets</h3>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 space-y-2">
                      {feedbacks.length === 0 ? (
                          <div className="text-center py-10 text-slate-400">No tickets.</div>
                      ) : (
                          feedbacks.map(f => (
                              <div 
                                key={f.id} 
                                onClick={() => handleSelectReport(f.id)}
                                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                                    selectedReportId === f.id 
                                    ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800' 
                                    : 'bg-white border-slate-200 hover:border-indigo-200 dark:bg-slate-900 dark:border-slate-800'
                                }`}
                              >
                                  <div className="flex justify-between items-start mb-1">
                                      <Badge className={`text-[10px] ${
                                          f.type === 'report' ? 'bg-red-100 text-red-700' : 
                                          f.type === 'bug' ? 'bg-amber-100 text-amber-700' : 
                                          'bg-blue-100 text-blue-700'
                                      }`}>
                                          {f.type}
                                      </Badge>
                                      <span className="text-[10px] text-slate-400">{new Date(f.timestamp).toLocaleDateString()}</span>
                                  </div>
                                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{f.content}</p>
                                  <div className="flex justify-between items-center mt-2">
                                      <span className="text-xs text-slate-500">{f.userName}</span>
                                      <Badge className={`scale-90 ${
                                          f.status === 'Resolved' ? 'bg-green-100 text-green-700' : 
                                          f.status === 'Dismissed' ? 'bg-slate-100 text-slate-500' :
                                          'bg-yellow-100 text-yellow-700'
                                      }`}>
                                          {f.status}
                                      </Badge>
                                  </div>
                              </div>
                          ))
                      )}
                  </div>
              </Card>

              {/* Report Detail */}
              <Card className="col-span-1 lg:col-span-2 p-0 overflow-hidden flex flex-col bg-white dark:bg-slate-900 border-indigo-100 dark:border-indigo-900/20">
                  {selectedReport ? (
                      <div className="flex flex-col h-full">
                          <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                              <div className="flex justify-between items-start mb-4">
                                  <div>
                                      <div className="flex items-center gap-2 mb-1">
                                          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Ticket #{selectedReport.id.slice(-4)}</h3>
                                          <Badge>{selectedReport.type}</Badge>
                                      </div>
                                      <div className="flex items-center gap-2 text-sm text-slate-500">
                                          <span>From: <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedReport.userName}</span></span>
                                          <span>•</span>
                                          <span>{new Date(selectedReport.timestamp).toLocaleString()}</span>
                                      </div>
                                  </div>
                                  <div className="flex gap-2">
                                      {(['Pending', 'In Progress', 'Resolved', 'Dismissed'] as const).map(s => (
                                          <button
                                              key={s}
                                              onClick={() => handleUpdateReportStatus(s)}
                                              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                                                  effectiveStatus === s 
                                                  ? 'bg-slate-800 text-white border-slate-800 dark:bg-white dark:text-slate-900' 
                                                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400 dark:bg-slate-900 dark:border-slate-700'
                                              }`}
                                          >
                                              {s}
                                          </button>
                                      ))}
                                  </div>
                              </div>
                              
                              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 dark:bg-slate-950 dark:border-slate-800 text-slate-700 dark:text-slate-300 leading-relaxed text-sm">
                                  {selectedReport.content}
                              </div>
                              
                              {selectedReport.targetId && (
                                  <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
                                      <Crosshair size={12} /> Target Reference: <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded">{selectedReport.targetId}</span>
                                  </div>
                              )}
                          </div>
                          
                          <div className="flex-1 p-6 bg-slate-50/50 dark:bg-slate-950/30 flex flex-col">
                              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Admin Response</h4>
                              <textarea 
                                  className="flex-1 w-full p-4 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm resize-none dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200"
                                  placeholder="Type your response or resolution notes here..."
                                  value={adminResponseText}
                                  onChange={(e) => setAdminResponseText(e.target.value)}
                              />
                              <div className="flex justify-end mt-4">
                                  <Button 
                                      disabled={!hasUnsavedReportChanges}
                                      onClick={handleConfirmReportUpdate}
                                      className="bg-indigo-600 text-white hover:bg-indigo-700"
                                  >
                                      Update Ticket
                                  </Button>
                              </div>
                          </div>
                      </div>
                  ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                          <MessageSquare size={48} className="mb-4 opacity-30" />
                          <p>Select a ticket to view details</p>
                      </div>
                  )}
              </Card>
          </div>
      )}

      {activeTab === 'system' && (
        <div className="space-y-6">
            <Card className="p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2 dark:text-slate-100">
                    <Server size={20} className="text-indigo-500" /> System Configuration
                </h3>
                
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Global Chat Cooldown (Seconds)
                        </label>
                        <div className="flex items-center gap-4">
                            <input 
                                type="range" 
                                min="1" 
                                max="100" 
                                value={chatCooldown}
                                onChange={(e) => onUpdateChatCooldown?.(Number(e.target.value))}
                                className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 accent-indigo-600"
                            />
                            <div className="w-16">
                                <Input 
                                    type="number" 
                                    min="1" 
                                    max="100" 
                                    value={chatCooldown}
                                    onChange={(e) => onUpdateChatCooldown?.(Number(e.target.value))}
                                    className="!py-1 !px-2 text-center"
                                />
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                            Controls the delay required between messages for non-admin users to prevent spam.
                        </p>
                    </div>
                </div>
            </Card>
        </div>
      )}

      {/* Verification Modal */}
      {missionToVerify && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 relative bg-white dark:bg-slate-900 border-0 shadow-2xl">
                  <button onClick={() => setMissionToVerify(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                      <X size={24} />
                  </button>
                  <h3 className="text-2xl font-bold mb-1 dark:text-slate-100">Mission Verification</h3>
                  <p className="text-slate-500 mb-6 text-sm flex items-center gap-2">
                      <Briefcase size={14}/> {missionToVerify.title} 
                      <Badge className="ml-2">{missionToVerify.id}</Badge>
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                          <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-2">Proof of Completion</h4>
                          {missionToVerify.proofUrl ? (
                              <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100">
                                  <img src={missionToVerify.proofUrl} alt="Proof" className="w-full h-48 object-cover" />
                                  <div className="p-2 text-xs text-center text-slate-500 truncate">{missionToVerify.proofUrl}</div>
                              </div>
                          ) : (
                              <div className="h-48 bg-slate-100 rounded-lg border border-dashed border-slate-300 flex items-center justify-center text-slate-400 italic dark:bg-slate-800 dark:border-slate-700">
                                  No proof image attached
                              </div>
                          )}
                      </div>
                      
                      <div className="space-y-4">
                          <div>
                              <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-1">Agent</h4>
                              <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                                  <UserIcon size={14}/> {missionToVerify.assigneeId}
                              </p>
                          </div>
                          <div>
                              <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-1">Virtual Logs</h4>
                              {missionToVerify.virtualCoordinates ? (
                                  <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs font-mono text-slate-600 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-400">
                                      <p>Platform: {missionToVerify.virtualCoordinates.platform}</p>
                                      <p className="truncate">Link: {missionToVerify.virtualCoordinates.link}</p>
                                      {missionToVerify.virtualCoordinates.password && (
                                          <p className="flex items-center gap-2">
                                              Pass: 
                                              <span className={showPassword ? '' : 'blur-sm select-none'}>
                                                  {missionToVerify.virtualCoordinates.password}
                                              </span>
                                              <button onClick={() => setShowPassword(!showPassword)} className="text-indigo-500">
                                                  {showPassword ? <EyeOff size={10}/> : <Eye size={10}/>}
                                              </button>
                                          </p>
                                      )}
                                  </div>
                              ) : (
                                  <p className="text-xs text-slate-400 italic">No virtual coordinates.</p>
                              )}
                          </div>
                      </div>
                  </div>

                  <div className="mb-6">
                      <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300 mb-2">Admin Notes</h4>
                      <textarea 
                          className="w-full p-3 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none text-sm dark:bg-slate-950 dark:border-slate-700 dark:text-slate-200"
                          placeholder="Internal verification notes..."
                          value={verificationNote}
                          onChange={(e) => setVerificationNote(e.target.value)}
                      />
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex gap-4">
                          <button 
                              onClick={() => setVerificationStamp('PASS')}
                              className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 w-32 transition-all ${
                                  verificationStamp === 'PASS' 
                                  ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20' 
                                  : 'border-slate-200 text-slate-400 hover:border-green-300 dark:border-slate-700'
                              }`}
                          >
                              <Stamp size={24} />
                              <span className="font-bold">APPROVE</span>
                          </button>
                          <button 
                              onClick={() => setVerificationStamp('NOT PASS')}
                              className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 w-32 transition-all ${
                                  verificationStamp === 'NOT PASS' 
                                  ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20' 
                                  : 'border-slate-200 text-slate-400 hover:border-red-300 dark:border-slate-700'
                              }`}
                          >
                              <Ban size={24} />
                              <span className="font-bold">REJECT</span>
                          </button>
                      </div>
                      <Button 
                          onClick={handleVerifyConfirm} 
                          disabled={!verificationStamp}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 h-12 text-lg"
                      >
                          Submit
                      </Button>
                  </div>
              </Card>
          </div>
      )}

      {/* AI Analysis Modal */}
      {analyzingUserId && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <Card className="w-full max-w-lg p-6 bg-white dark:bg-slate-900 border-0 shadow-2xl relative">
                  <button onClick={closeAnalysisModal} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={20}/></button>
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-purple-600 dark:text-purple-400">
                      <BrainCircuit size={24} /> AI Risk Analysis
                  </h3>
                  
                  {analysisResult ? (
                      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg dark:bg-slate-800">
                              <span className="font-bold text-slate-700 dark:text-slate-200">User: {users.find(u => u.id === analyzingUserId)?.name}</span>
                              <Badge className={
                                  analysisResult.severity === 'Critical' ? 'bg-red-100 text-red-700 border-red-200' :
                                  analysisResult.severity === 'High' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                                  analysisResult.severity === 'Medium' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                                  'bg-green-100 text-green-700 border-green-200'
                              }>
                                  {analysisResult.severity} Risk
                              </Badge>
                          </div>
                          
                          <div className="space-y-2">
                              <p className="text-xs font-bold text-slate-400 uppercase">Reasoning</p>
                              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 p-3 rounded border border-slate-100 dark:bg-slate-800 dark:border-slate-700">
                                  {analysisResult.reasoning}
                              </p>
                          </div>

                          <div className="space-y-2">
                              <p className="text-xs font-bold text-slate-400 uppercase">Recommended Action</p>
                              <div className="flex items-center gap-3">
                                  <div className="p-3 bg-indigo-50 text-indigo-700 font-bold rounded-lg border border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800 flex-1 text-center">
                                      {analysisResult.recommendedAction}
                                  </div>
                                  <Button onClick={() => applyAction(analyzingUserId, analysisResult.recommendedAction)} className="bg-indigo-600 text-white">
                                      Apply Action
                                  </Button>
                              </div>
                          </div>
                      </div>
                  ) : (
                      <div className="py-12 flex flex-col items-center justify-center text-purple-500">
                          <Loader2 size={48} className="animate-spin mb-4" />
                          <p className="text-sm font-medium">Analyzing user behavior patterns...</p>
                      </div>
                  )}
              </Card>
          </div>
      )}

      {/* Role Editor Modal */}
      {userToEditRole && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <Card className="w-full max-w-sm p-6 bg-white dark:bg-slate-900 shadow-xl">
                  <h3 className="text-lg font-bold mb-4 dark:text-slate-100">Change Role: {userToEditRole.name}</h3>
                  <div className="space-y-2">
                      {Object.values(UserRole).map(role => (
                          <button
                              key={role}
                              onClick={() => saveRoleChange(role)}
                              className={`w-full p-3 text-left rounded-lg text-sm transition-all ${
                                  userToEditRole.currentRole === role 
                                  ? 'bg-indigo-50 border border-indigo-200 text-indigo-700 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-300' 
                                  : 'hover:bg-slate-50 border border-transparent dark:hover:bg-slate-800 dark:text-slate-300'
                              }`}
                          >
                              {role}
                          </button>
                      ))}
                  </div>
                  <div className="mt-4 flex justify-end">
                      <Button variant="ghost" onClick={() => setUserToEditRole(null)}>Cancel</Button>
                  </div>
              </Card>
          </div>
      )}

       {/* Admin Tag Editor Modal */}
       {userToEditTags && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <Card className="w-full max-w-sm p-6 bg-white dark:bg-slate-900 shadow-xl relative">
                  <button onClick={() => setUserToEditTags(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={18}/></button>
                  <h3 className="text-lg font-bold mb-1 dark:text-slate-100">Admin Tags</h3>
                  <p className="text-xs text-slate-500 mb-4">Internal notes for {userToEditTags.name}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                      {userToEditTags.tags.map(tag => (
                          <span key={tag} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded border border-indigo-100 flex items-center gap-1 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800">
                              {tag}
                              <button onClick={() => handleRemoveTag(tag)} className="hover:text-indigo-900"><X size={10}/></button>
                          </span>
                      ))}
                      {userToEditTags.tags.length === 0 && <span className="text-xs text-slate-400 italic">No tags assigned.</span>}
                  </div>
                  
                  <div className="flex gap-2">
                      <Input 
                          value={newTagInput} 
                          onChange={(e) => setNewTagInput(e.target.value)}
                          placeholder="Add new tag..."
                          className="text-xs"
                      />
                      <Button onClick={handleAddTag} disabled={!newTagInput.trim()} className="!py-1.5">Add</Button>
                  </div>
              </Card>
          </div>
      )}

      {/* Ad Editor Modal */}
      {isAdModalOpen && editingAd && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <Card className="w-full max-w-md p-6 bg-white dark:bg-slate-900 shadow-xl relative">
                  <button onClick={() => setIsAdModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={20}/></button>
                  <h3 className="text-xl font-bold mb-4 dark:text-slate-100">{editingAd.id.startsWith('ad_') && !ads.find(a => a.id === editingAd.id) ? 'Create Campaign' : 'Edit Campaign'}</h3>
                  
                  <form onSubmit={saveAd} className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Sponsor Name</label>
                          <Input 
                              value={editingAd.sponsorName} 
                              onChange={(e) => setEditingAd({ ...editingAd, sponsorName: e.target.value })}
                              required
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ad Content</label>
                          <textarea 
                              className="w-full p-3 rounded-lg border border-slate-200 outline-none text-sm dark:bg-slate-950 dark:border-slate-700 dark:text-slate-200"
                              value={editingAd.content}
                              onChange={(e) => setEditingAd({ ...editingAd, content: e.target.value })}
                              required
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Link URL</label>
                          <Input 
                              value={editingAd.link || ''} 
                              onChange={(e) => setEditingAd({ ...editingAd, link: e.target.value })}
                              placeholder="https://..."
                          />
                      </div>
                      
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Campaign Duration</label>
                          <div className="grid grid-cols-2 gap-3">
                              <div>
                                  <label className="block text-[10px] text-slate-400 mb-1">Start Date</label>
                                  <Input 
                                      type="date"
                                      className="text-xs"
                                      value={editingAd.startDate ? new Date(editingAd.startDate).toISOString().split('T')[0] : ''} 
                                      onChange={(e) => setEditingAd({ ...editingAd, startDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                                  />
                              </div>
                              <div>
                                  <label className="block text-[10px] text-slate-400 mb-1">End Date</label>
                                  <Input 
                                      type="date"
                                      className="text-xs"
                                      value={editingAd.endDate ? new Date(editingAd.endDate).toISOString().split('T')[0] : ''} 
                                      onChange={(e) => setEditingAd({ ...editingAd, endDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                                  />
                              </div>
                          </div>
                      </div>

                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Color Theme</label>
                          <div className="flex gap-2 flex-wrap">
                              {Object.keys(AD_THEMES).map(theme => (
                                  <button
                                      type="button"
                                      key={theme}
                                      onClick={() => setEditingAd({ ...editingAd, colorTheme: theme as any })}
                                      className={`w-6 h-6 rounded-full border-2 ${AD_THEMES[theme]} ${editingAd.colorTheme === theme ? 'border-slate-800 scale-110' : 'border-transparent'}`}
                                  />
                              ))}
                          </div>
                      </div>
                      <div className="flex items-center gap-2">
                          <input 
                              type="checkbox" 
                              id="adActive"
                              checked={editingAd.isActive}
                              onChange={(e) => setEditingAd({ ...editingAd, isActive: e.target.checked })}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <label htmlFor="adActive" className="text-sm font-medium text-slate-700 dark:text-slate-300">Activate Immediately</label>
                      </div>

                      <div className="flex justify-end pt-4">
                          <Button type="submit" className="bg-indigo-600 text-white">Save Campaign</Button>
                      </div>
                  </form>
              </Card>
          </div>
      )}

    </div>
  );
};
