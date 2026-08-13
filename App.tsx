
import React, { useState, useEffect } from 'react';
import { 
  Layout, Radio, Users, Settings, Plus, Bell, Sun, Moon, 
  Menu, X, Shield, LogOut, Inbox, Info, AlertCircle, Briefcase, User as UserIcon, BookOpen
} from 'lucide-react';

import { User, Mission, MissionStatus, Ad, FeedbackItem, UserRole, DeviceType, AdminLog, ChronicleEntry, UserPreferences } from './types';
import { CURRENT_USER, MOCK_MISSIONS, MOCK_ADS, MOCK_NEWS, MOCK_FEEDBACKS, MOCK_MAIL, PRESET_USERS, MOCK_CHRONICLES } from './constants';

import { Button, Badge } from './components/Shared';
import { MissionBoard } from './components/MissionBoard';
import { UserProfile } from './components/UserProfile';
import { LiveOperationsPanel } from './components/LiveOperationsPanel';
import { AdminDashboard } from './components/AdminDashboard';
import { IssuerDashboard } from './components/IssuerDashboard';
import { SettingsPanel } from './components/SettingsPanel';
import { GuildChat } from './components/GuildChat';
import { NewsFeed } from './components/NewsFeed';
import { FriendsPanel } from './components/FriendsPanel';
import { MailboxPanel } from './components/MailboxPanel';
import { ChroniclePanel } from './components/ChroniclePanel';
import { MissionDetailsModal } from './components/MissionDetailsModal';
import { ProfileModal } from './components/ProfileModal';
import { DirectMessageWindow } from './components/DirectMessageWindow';
import { CreateMissionModal } from './components/CreateMissionModal';
import { AuthPage } from './components/AuthPage';

export default function App() {
  const [activeTab, setActiveTab] = useState('board');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Auth & User State
  const [user, setUser] = useState<User | null>(CURRENT_USER);
  const [availableUsers, setAvailableUsers] = useState<User[]>(PRESET_USERS);

  const [missions, setMissions] = useState<Mission[]>(MOCK_MISSIONS);
  const [ads, setAds] = useState<Ad[]>(MOCK_ADS);
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>(MOCK_FEEDBACKS);
  const [adminLogs, setAdminLogs] = useState<AdminLog[]>([]);
  const [mail, setMail] = useState(MOCK_MAIL);
  const [chronicles, setChronicles] = useState<ChronicleEntry[]>(MOCK_CHRONICLES);
  
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null);
  const [customStatusColors, setCustomStatusColors] = useState<Record<string, string>>({});
  const [manualDeviceType, setManualDeviceType] = useState<DeviceType | null>(null);
  
  const [activeChatContactId, setActiveChatContactId] = useState<string | null>(null);
  const [chatCooldown, setChatCooldown] = useState(30);

  // User Preferences State
  const [userPreferences, setUserPreferences] = useState<UserPreferences>(() => {
    const savedLang = localStorage.getItem('nexus_nova_language') || 'en';
    return {
      theme: 'light',
      language: savedLang,
      preferredTranslationLanguage: savedLang,
      autoDetectLanguage: false,
      soundVolume: 80,
      notificationsEnabled: true
    };
  });

  // Backend Health Check State (/api/health)
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'not reachable'>('checking');

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        if (data && data.ok) {
          setBackendStatus('connected');
        } else {
          setBackendStatus('not reachable');
        }
      })
      .catch(() => {
        setBackendStatus('not reachable');
      });
  }, []);

  // Chronicle Handlers
  const handleCreateChronicle = (entryData: Omit<ChronicleEntry, 'id' | 'timestamp' | 'likesCount'>) => {
    const newEntry: ChronicleEntry = {
      ...entryData,
      id: `chron_${Date.now()}`,
      timestamp: new Date().toISOString(),
      likesCount: 0
    };
    setChronicles(prev => [newEntry, ...prev]);
  };

  const handleToggleBookmarkChronicle = (id: string) => {
    setChronicles(prev => prev.map(c => c.id === id ? { ...c, isBookmarked: !c.isBookmarked } : c));
  };

  const handleLikeChronicle = (id: string) => {
    setChronicles(prev => prev.map(c => c.id === id ? { ...c, likesCount: (c.likesCount || 0) + 1 } : c));
  };

  const handleDeleteChronicle = (id: string) => {
    setChronicles(prev => prev.filter(c => c.id !== id));
  };

  // Apply dark mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Auth Handlers
  const handleLogin = (loggedInUser: User) => {
      setUser(loggedInUser);
      setActiveTab('board');
  };

  const handleLogout = () => {
      setUser(null);
      setActiveTab('board');
  };

  const handleRegister = (newUser: User) => {
      setAvailableUsers(prev => [...prev, newUser]);
      setUser(newUser);
      setActiveTab('board');
  };

  // Logic Handlers
  const handleUpdateMissionStatus = (
    id: string, 
    status: MissionStatus, 
    reason?: string, 
    proofUrl?: string, 
    adminVerification?: Mission['adminVerification']
  ) => {
    if (!user) return;

    setMissions(prev => prev.map(m => {
        if (m.id === id) {
            const updated = { ...m, status };
            
            // Logic Fix: Assign user if claiming and no assignee exists
            if (status === MissionStatus.Claimed && !m.assigneeId) {
                updated.assigneeId = user.id;
            }

            if (proofUrl) updated.proofUrl = proofUrl;
            if (adminVerification) updated.adminVerification = adminVerification;
            
            // Add history entry
            if (reason) {
                updated.history = [
                    {
                        previousStatus: m.status,
                        newStatus: status,
                        changedBy: user.name,
                        timestamp: new Date().toISOString(),
                        reason
                    },
                    ...m.history
                ];
            }

            // Reward Logic: If mission is marked Completed, distribute credits
            if (status === MissionStatus.Completed && m.status !== MissionStatus.Completed) {
                // Only update credits if the current logged-in user is the assignee
                if (user.id === m.assigneeId) {
                    setUser(u => u ? ({ ...u, credits: u.credits + m.reward }) : u);
                    
                    // Optional: Send a notification/mail about the reward
                    setMail(currentMail => [
                        {
                            id: `reward_${Date.now()}`,
                            senderId: 'system',
                            senderName: 'Guild Treasury',
                            senderRole: 'System',
                            subject: 'Mission Reward Received',
                            content: `You have received ${m.reward} credits for completing mission: ${m.title}.`,
                            timestamp: new Date().toISOString(),
                            isRead: false,
                            type: 'system',
                            relatedMissionId: m.id,
                            priority: 'high'
                        },
                        ...currentMail
                    ]);
                }
            }

            return updated;
        }
        return m;
    }));
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
    // Also update the source of truth for available users if needed
    setAvailableUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
  };
  
  const handleChat = (contactId: string) => {
     setActiveChatContactId(contactId);
  };

  const handleCreateMission = (missionData: any) => {
    if (!user) return;

    const newMission: Mission = {
        id: `m_${Date.now()}`,
        title: missionData.title,
        description: missionData.description,
        type: missionData.type,
        difficulty: missionData.difficulty,
        reward: missionData.reward,
        location: missionData.location,
        tags: missionData.tags,
        status: MissionStatus.Open,
        postedDate: new Date().toISOString(),
        expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        issuerId: user.id,
        // Use explicit flag from form, fallback to text match for legacy compat
        isRemote: missionData.isRemote ?? (missionData.location.toLowerCase().includes('virtual') || missionData.location.toLowerCase().includes('remote')),
        virtualCoordinates: missionData.virtualCoordinates,
        history: [{
            previousStatus: MissionStatus.Open,
            newStatus: MissionStatus.Open,
            changedBy: user.name,
            timestamp: new Date().toISOString(),
            reason: 'Mission Distributed'
        }],
        comments: [],
        requiredLevel: 1 
    };
    
    setMissions(prev => [newMission, ...prev]);
    setShowCreateModal(false);
  };

  if (!user) {
      return <AuthPage availableUsers={availableUsers} onLogin={handleLogin} onRegister={handleRegister} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'board':
        return (
          <MissionBoard 
            missions={missions} 
            user={user}
            onSelectMission={(id) => setSelectedMissionId(id)}
            onQuickAccept={(id) => handleUpdateMissionStatus(id, MissionStatus.Claimed, "Quick Claim")}
            customStatusColors={customStatusColors}
            onViewIssuer={(id) => {
                // Could navigate to specific issuer view or open modal
                console.log("Viewing issuer:", id);
            }}
          />
        );
      case 'profile':
        return <UserProfile user={user} onUpdate={handleUpdateUser} onChat={handleChat} />;
      case 'live':
        return (
            <LiveOperationsPanel 
                missions={missions} 
                currentUser={user} 
                customStatusColors={customStatusColors} 
                onUpdateStatus={handleUpdateMissionStatus}
                onSelectMission={(id) => setSelectedMissionId(id)}
            />
        );
      case 'issuer':
        return (
            <IssuerDashboard 
                missions={missions}
                currentUser={user}
                onSelectMission={setSelectedMissionId}
                onCreateMission={() => setShowCreateModal(true)}
            />
        );
      case 'admin':
        return (
            <AdminDashboard 
                missions={missions} 
                currentUser={user}
                onUpdateStatus={handleUpdateMissionStatus}
                onLogAction={(action, targetId, details) => {
                    const newLog: AdminLog = {
                        id: Date.now().toString(),
                        adminName: user.name,
                        action,
                        targetId,
                        details,
                        timestamp: new Date().toISOString()
                    };
                    setAdminLogs(prev => [newLog, ...prev]);
                }}
                adminLogs={adminLogs}
                ads={ads}
                onUpdateAds={setAds}
                feedbacks={feedbacks}
                onUpdateFeedback={(id, update) => setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, ...update } : f))}
                chatCooldown={chatCooldown}
                onUpdateChatCooldown={setChatCooldown}
            />
        );
      case 'settings':
        return (
            <SettingsPanel 
                isDarkMode={isDarkMode} 
                setIsDarkMode={setIsDarkMode} 
                customStatusColors={customStatusColors} 
                setCustomStatusColors={setCustomStatusColors}
                currentUser={user}
                onUserChange={setUser}
                manualDeviceType={manualDeviceType}
                setManualDeviceType={setManualDeviceType}
                feedbacks={feedbacks}
                onSubmitFeedback={(item) => {
                    const newItem: FeedbackItem = {
                        ...item,
                        id: Date.now().toString(),
                        timestamp: new Date().toISOString(),
                        status: 'Pending'
                    };
                    setFeedbacks(prev => [newItem, ...prev]);
                }}
                onLogout={handleLogout}
                userPreferences={userPreferences}
                onUpdateUserPreferences={(newPrefs) => setUserPreferences(newPrefs)}
            />
        );
      case 'friends':
        return <FriendsPanel user={user} onUpdate={handleUpdateUser} onChat={handleChat} />;
      case 'mail':
        return (
            <MailboxPanel 
                mail={mail} 
                contacts={user.contacts}
                onMarkRead={(id) => setMail(prev => prev.map(m => m.id === id ? { ...m, isRead: true } : m))}
                onDelete={(id) => setMail(prev => prev.map(m => m.id === id ? { ...m, isDeleted: true } : m))}
                onRestore={(id) => setMail(prev => prev.map(m => m.id === id ? { ...m, isDeleted: false } : m))}
                onPermanentDelete={(id) => setMail(prev => prev.filter(m => m.id !== id))}
                onViewMission={(id) => setSelectedMissionId(id)}
                onReply={() => {}} // Placeholder
                onSendMail={(recipientId, subject, body) => {
                    // Placeholder send
                    alert(`Sent to ${recipientId}`);
                }}
            />
        );
      case 'chronicle':
        return (
          <ChroniclePanel 
            chronicles={chronicles}
            currentUser={user}
            missions={missions}
            onCreateEntry={handleCreateChronicle}
            onToggleBookmark={handleToggleBookmarkChronicle}
            onLikeEntry={handleLikeChronicle}
            onDeleteEntry={handleDeleteChronicle}
          />
        );
      default:
        return <div>Section under construction</div>;
    }
  };

  return (
    <div className={`min-h-screen bg-slate-50 text-slate-900 font-sans transition-colors duration-200 ${isDarkMode ? 'dark bg-slate-950 text-slate-100' : ''}`}>
       
       {/* Sidebar */}
       <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
             <div className="flex items-center gap-2 font-bold text-xl text-slate-800 dark:text-slate-100">
                <Shield size={24} className="text-amber-800 fill-amber-400 dark:text-amber-600 dark:fill-amber-900" /> Nexus Nova Core
             </div>
             <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-slate-600">
                <X size={20} />
             </button>
          </div>
          
          <nav className="p-4 space-y-2">
             <Button 
                variant={activeTab === 'board' ? 'primary' : 'ghost'} 
                className={`w-full justify-start ${activeTab === 'board' ? 'bg-indigo-600 text-white' : ''}`}
                onClick={() => { setActiveTab('board'); setIsSidebarOpen(false); }}
             >
                <Layout size={18} /> Mission Board
             </Button>
             <Button 
                variant={activeTab === 'chronicle' ? 'primary' : 'ghost'} 
                className={`w-full justify-start ${activeTab === 'chronicle' ? 'bg-indigo-600 text-white' : ''}`}
                onClick={() => { setActiveTab('chronicle'); setIsSidebarOpen(false); }}
             >
                <BookOpen size={18} /> Chronicle
             </Button>
             <Button 
                variant={activeTab === 'live' ? 'primary' : 'ghost'} 
                className={`w-full justify-start ${activeTab === 'live' ? 'bg-indigo-600 text-white' : ''}`}
                onClick={() => { setActiveTab('live'); setIsSidebarOpen(false); }}
             >
                <Radio size={18} /> Live Ops
             </Button>
             <Button 
                variant={activeTab === 'issuer' ? 'primary' : 'ghost'} 
                className={`w-full justify-start ${activeTab === 'issuer' ? 'bg-indigo-600 text-white' : ''}`}
                onClick={() => { setActiveTab('issuer'); setIsSidebarOpen(false); }}
             >
                <Briefcase size={18} /> Agency
             </Button>
             <Button 
                variant={activeTab === 'friends' ? 'primary' : 'ghost'} 
                className={`w-full justify-start ${activeTab === 'friends' ? 'bg-indigo-600 text-white' : ''}`}
                onClick={() => { setActiveTab('friends'); setIsSidebarOpen(false); }}
             >
                <Users size={18} /> Network
             </Button>
             <Button 
                variant={activeTab === 'mail' ? 'primary' : 'ghost'} 
                className={`w-full justify-start ${activeTab === 'mail' ? 'bg-indigo-600 text-white' : ''}`}
                onClick={() => { setActiveTab('mail'); setIsSidebarOpen(false); }}
             >
                <Inbox size={18} /> Mailbox
             </Button>
             {user.role === UserRole.Admin && (
                 <Button 
                    variant={activeTab === 'admin' ? 'primary' : 'ghost'} 
                    className={`w-full justify-start ${activeTab === 'admin' ? 'bg-indigo-600 text-white' : ''}`}
                    onClick={() => { setActiveTab('admin'); setIsSidebarOpen(false); }}
                 >
                    <Shield size={18} /> Admin
                 </Button>
             )}
             <Button 
                variant={activeTab === 'profile' ? 'primary' : 'ghost'} 
                className={`w-full justify-start ${activeTab === 'profile' ? 'bg-indigo-600 text-white' : ''}`}
                onClick={() => { setActiveTab('profile'); setIsSidebarOpen(false); }}
             >
                <UserIcon size={18} /> Profile
             </Button>
             <Button 
                variant={activeTab === 'settings' ? 'primary' : 'ghost'} 
                className={`w-full justify-start ${activeTab === 'settings' ? 'bg-indigo-600 text-white' : ''}`}
                onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false); }}
             >
                <Settings size={18} /> Settings
             </Button>
          </nav>

          <div className="absolute bottom-0 w-full p-4 border-t border-slate-100 dark:border-slate-800">
             <div className="flex items-center gap-3">
                <img src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`} alt="User" className="w-10 h-10 rounded-full bg-slate-200" />
                <div className="flex-1 min-w-0">
                   <p className="font-bold text-sm truncate dark:text-slate-200">{user.name}</p>
                   <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.role}</p>
                </div>
                <button 
                    onClick={handleLogout}
                    className="text-slate-400 hover:text-red-500 transition-colors"
                    title="Sign Out"
                >
                   <LogOut size={18} />
                </button>
             </div>
          </div>
       </aside>

       {/* Mobile Header */}
       <div className="md:hidden fixed top-0 w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-30 p-4 flex justify-between items-center">
          <button onClick={() => setIsSidebarOpen(true)}>
             <Menu size={24} className="text-slate-600 dark:text-slate-300" />
          </button>
          <div className="flex items-center gap-2">
             <Shield size={20} className="text-amber-800 fill-amber-400 dark:text-amber-600 dark:fill-amber-900" />
             <span className="font-bold text-lg text-slate-800 dark:text-slate-100">Nexus Nova Core</span>
          </div>
          <div className="w-6" /> {/* Spacer */}
       </div>

       {/* Main Content Area */}
       <main className="md:ml-64 p-4 md:p-8 pt-20 md:pt-8 min-h-screen">
          <header className="flex flex-row items-center justify-between gap-4 mb-8">
             <div>
                <h1 className="text-xl md:text-2xl font-bold capitalize text-slate-800 dark:text-white">{activeTab === 'board' ? 'Mission Board' : activeTab === 'issuer' ? 'My Agency' : activeTab === 'chronicle' ? 'Guild Chronicles' : activeTab}</h1>
                <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm">Welcome back, Agent {user.name}.</p>
             </div>
             
             <div className="flex items-center gap-3">
                {/* Unobtrusive Backend Health Check Badge */}
                <div 
                  className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm"
                  title="Vercel Serverless Function Health Status (/api/health)"
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${backendStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                  <span className="text-slate-400">backend:</span>
                  <span className={backendStatus === 'connected' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-amber-600 dark:text-amber-400 font-medium'}>
                    {backendStatus}
                  </span>
                </div>

                {user.role !== UserRole.Student && (
                    <Button onClick={() => setShowCreateModal(true)} className="hidden md:flex gap-2 bg-indigo-600 text-white hover:bg-indigo-700">
                       <Plus size={18} /> New Mission
                    </Button>
                )}
                
                {/* Notifications Popup */}
                <div className="relative">
                   <button 
                      onClick={() => setShowNotifications(!showNotifications)} 
                      className={`relative p-2 rounded-full transition-colors ${showNotifications ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                   >
                      <Bell size={20} />
                      <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-50 dark:border-slate-950"></span>
                   </button>

                   {showNotifications && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)}></div>
                        <div className="fixed top-24 left-1/2 -translate-x-1/2 w-72 md:absolute md:top-full md:left-auto md:right-0 md:translate-x-0 md:w-96 md:mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-50 flex flex-col max-h-[500px] overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top md:origin-top-right">
                            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex justify-between items-center">
                                <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                    <Bell size={16} className="text-indigo-500" /> Notifications
                                </h3>
                                <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                    <X size={16}/>
                                </button>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-2 space-y-4 custom-scrollbar">
                                {/* System Updates Section */}
                                <div>
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2">System Updates</h4>
                                    {MOCK_NEWS.slice(0, 3).map(news => (
                                        <div key={news.id} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700 group">
                                            <div className="flex gap-3">
                                                <div className="mt-1 p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-md text-blue-500 shrink-0 h-fit">
                                                    <Info size={14}/>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{news.title}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">{news.content}</p>
                                                    <p className="text-[10px] text-slate-400 mt-1">{new Date(news.date).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* New Opportunities Section */}
                                <div>
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2">New Opportunities</h4>
                                    {missions.filter(m => m.status === MissionStatus.Urgent || m.status === MissionStatus.Open).slice(0, 4).map(mission => (
                                        <div 
                                            key={mission.id} 
                                            onClick={() => { setSelectedMissionId(mission.id); setShowNotifications(false); }} 
                                            className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-indigo-200 dark:hover:border-indigo-900/50 group"
                                        >
                                            <div className="flex gap-3">
                                                <div className="mt-1 shrink-0">
                                                    {mission.status === MissionStatus.Urgent ? (
                                                        <div className="p-1.5 bg-red-50 dark:bg-red-900/20 rounded-md text-red-500">
                                                            <AlertCircle size={14} />
                                                        </div>
                                                    ) : (
                                                        <div className="p-1.5 bg-green-50 dark:bg-green-900/20 rounded-md text-green-500">
                                                            <Briefcase size={14} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start">
                                                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate pr-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{mission.title}</p>
                                                        {mission.status === MissionStatus.Urgent && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0 mt-1.5"></span>}
                                                    </div>
                                                    <div className="flex items-center justify-between mt-1">
                                                        <Badge className="text-[10px] scale-90 origin-left opacity-70">{mission.type}</Badge>
                                                        <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">{mission.reward} Cr</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {missions.filter(m => m.status === MissionStatus.Urgent || m.status === MissionStatus.Open).length === 0 && (
                                        <div className="text-center py-4 text-xs text-slate-400 italic">No new missions available.</div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-center">
                                <button 
                                    onClick={() => { setActiveTab('board'); setShowNotifications(false); }} 
                                    className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-medium hover:underline"
                                >
                                    View Mission Board
                                </button>
                            </div>
                        </div>
                      </>
                   )}
                </div>

                <button onClick={() => setIsDarkMode(!isDarkMode)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                   {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
             </div>
          </header>

          <div className="flex flex-col xl:flex-row gap-6">
             {/* ... (rest of main content) ... */}
             <div className="flex-1 min-w-0">
                {renderContent()}
             </div>

             {/* Right Sidebar (News/Ads) - Only on larger screens and specific tabs */}
             {activeTab === 'board' && (
                <div className="hidden xl:block w-80 shrink-0 space-y-6">
                    <NewsFeed news={MOCK_NEWS} />
                    
                    {ads.filter(a => a.isActive).map(ad => (
                        <div key={ad.id} className="relative rounded-xl overflow-hidden group cursor-pointer shadow-md">
                           <div className={`absolute inset-0 opacity-90 transition-opacity group-hover:opacity-100 bg-gradient-to-br ${ad.colorTheme === 'sunset' ? 'from-orange-400 to-pink-500' : 'from-blue-400 to-indigo-500'}`}></div>
                           <div className="relative p-5 text-white">
                              <p className="text-xs font-bold uppercase opacity-75 mb-1">Sponsored</p>
                              <h4 className="font-bold text-lg mb-2">{ad.sponsorName}</h4>
                              <p className="text-sm opacity-90">{ad.content}</p>
                           </div>
                        </div>
                    ))}
                </div>
             )}
          </div>
       </main>

       {/* Floating Action Button (Mobile) */}
       {user.role !== UserRole.Student && (
           <button 
             onClick={() => setShowCreateModal(true)}
             className="md:hidden fixed bottom-6 left-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center z-40"
           >
              <Plus size={24} />
           </button>
       )}

       {/* Chat Component */}
       <GuildChat cooldownDuration={chatCooldown} user={user} />
       
       {/* Modals */}
       {selectedMissionId && (
           <MissionDetailsModal 
               mission={missions.find(m => m.id === selectedMissionId)!}
               currentUser={user}
               onClose={() => setSelectedMissionId(null)}
               onAddComment={(id, text) => {
                   setMissions(prev => prev.map(m => m.id === id ? { ...m, comments: [...m.comments, { id: Date.now().toString(), userId: user.id, userName: user.name, text, timestamp: new Date().toISOString() }] } : m));
               }}
               onUpdateStatus={handleUpdateMissionStatus}
               onEditMission={(updatedMission) => {
                   setMissions(prev => prev.map(m => m.id === updatedMission.id ? updatedMission : m));
               }}
               customStatusColors={customStatusColors}
               onViewIssuer={(id) => {
                   console.log("View issuer", id);
                   // Logic to view issuer profile could go here
               }}
           />
       )}
       
       {activeChatContactId && (
           <DirectMessageWindow 
               contact={user.contacts.find(c => c.id === activeChatContactId) || { id: activeChatContactId, name: 'Unknown', role: 'Unknown', avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeChatContactId}`, status: 'Online', level: 0 }}
               currentUserAvatar={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
               onClose={() => setActiveChatContactId(null)}
           />
       )}
       
       {/* Create Mission Modal */}
       {showCreateModal && (
           <CreateMissionModal 
               onClose={() => setShowCreateModal(false)}
               onCreate={handleCreateMission}
               currentUser={user}
           />
       )}

    </div>
  );
}
