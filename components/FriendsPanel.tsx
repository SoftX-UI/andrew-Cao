
import React, { useState } from 'react';
import { User, Contact } from '../types';
import { Card, Button, Input, Badge } from './Shared';
import { Users, Search, UserPlus, MessageSquare, MoreVertical, Trash2, Circle, Shield, MapPin, Zap, X, Briefcase, GraduationCap, Crown, User as UserIcon } from 'lucide-react';
import { ProfileModal } from './ProfileModal';

interface FriendsPanelProps {
  user: User;
  onUpdate: (user: User) => void;
  onChat: (contactId: string) => void;
}

export const FriendsPanel: React.FC<FriendsPanelProps> = ({ user, onUpdate, onChat }) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'All' | 'Online'>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  
  // Profile View States
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);
  const [hoveredProfileId, setHoveredProfileId] = useState<string | null>(null);

  // Add Friend Mock State
  const [newFriendId, setNewFriendId] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const filteredContacts = user.contacts.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                          c.role.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'All' || (filter === 'Online' && c.status === 'Online');
    return matchesSearch && matchesFilter;
  });

  const getRoleTheme = (role: string) => {
    const r = role.toLowerCase();
    if (r.includes('student')) return { bg: 'from-indigo-500 to-blue-600', text: 'text-indigo-600', border: 'border-indigo-200', icon: GraduationCap };
    if (r.includes('prof') && !r.includes('sor')) return { bg: 'from-emerald-500 to-teal-600', text: 'text-emerald-600', border: 'border-emerald-200', icon: Briefcase }; // Professional
    if (r.includes('professor')) return { bg: 'from-purple-500 to-violet-600', text: 'text-purple-600', border: 'border-purple-200', icon: Crown };
    if (r.includes('staff')) return { bg: 'from-slate-500 to-gray-600', text: 'text-slate-600', border: 'border-slate-200', icon: Shield };
    return { bg: 'from-amber-500 to-orange-600', text: 'text-amber-600', border: 'border-amber-200', icon: UserIcon }; // Default/Freelancer
  };

  const getStatusColor = (status: string) => {
    switch(status) {
        case 'Online': return 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]';
        case 'Busy': return 'bg-red-500';
        case 'Away': return 'bg-yellow-500';
        default: return 'bg-slate-400';
    }
  };

  const handleAddFriend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFriendId.trim()) return;

    setIsAdding(true);
    
    // Simulate API call
    setTimeout(() => {
        const newContact: Contact = {
            id: `u_${Date.now()}`,
            name: newFriendId, // Using input as name for mock
            role: 'Freelancer',
            level: Math.floor(Math.random() * 10) + 1,
            status: 'Online',
            avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${newFriendId}`,
            profession: 'Recruit'
        };

        onUpdate({
            ...user,
            contacts: [...user.contacts, newContact]
        });
        
        setIsAdding(false);
        setShowAddModal(false);
        setNewFriendId('');
    }, 1000);
  };

  const confirmRemove = () => {
    if (contactToDelete) {
        const updated = user.contacts.filter(c => c.id !== contactToDelete);
        onUpdate({ ...user, contacts: updated });
        setContactToDelete(null);
    }
  };

  // Helper to generate consistent mock stats based on name string
  const getMockStats = (name: string) => {
      let hash = 0;
      for (let i = 0; i < name.length; i++) {
          hash = name.charCodeAt(i) + ((hash << 5) - hash);
      }
      const str = Math.abs(hash % 100);
      const int = Math.abs((hash >> 2) % 100);
      const agi = Math.abs((hash >> 4) % 100);
      return { str, int, agi };
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
       <div className="flex flex-col md:flex-row justify-between items-end gap-4">
         <div>
           <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
             <Users className="text-indigo-600 dark:text-indigo-400" /> Guild Network
           </h2>
           <p className="text-slate-500 dark:text-slate-400">Manage your allies, rivals, and professional connections.</p>
         </div>
         <Button onClick={() => setShowAddModal(true)}>
            <UserPlus size={18} /> Recruit Agent
         </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
         <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input 
                placeholder="Search contacts..." 
                className="!pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
         </div>
         <div className="flex gap-2 bg-white p-1 rounded-lg border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
             <button 
                onClick={() => setFilter('All')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${filter === 'All' ? 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
             >
                All ({user.contacts.length})
             </button>
             <button 
                onClick={() => setFilter('Online')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${filter === 'Online' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
             >
                Online
             </button>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredContacts.map(contact => {
              const theme = getRoleTheme(contact.role);
              const RoleIcon = theme.icon;
              const stats = getMockStats(contact.name);
              
              return (
              <div key={contact.id} className="group relative flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-visible">
                  {/* Card Header Banner */}
                  <div className={`h-24 bg-gradient-to-r ${theme.bg} relative overflow-hidden rounded-t-2xl`}>
                      <div className="absolute inset-0 bg-black/10"></div>
                      <div className="absolute -right-4 -top-6 text-white/20 rotate-12 transform scale-150">
                          <RoleIcon size={120} />
                      </div>
                      
                      <div className="absolute top-2 right-2 z-20">
                         <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(activeMenuId === contact.id ? null : contact.id);
                            }}
                            className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors"
                         >
                            <MoreVertical size={18} />
                         </button>
                         {activeMenuId === contact.id && (
                            <>
                                <div className="fixed inset-0 z-30" onClick={() => setActiveMenuId(null)}></div>
                                <div className="absolute right-0 top-8 w-40 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-40 overflow-hidden animate-in fade-in zoom-in-95 duration-100 flex flex-col">
                                    <button 
                                        onClick={() => {
                                            setContactToDelete(contact.id);
                                            setActiveMenuId(null);
                                        }}
                                        className="w-full text-left px-4 py-2.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                    >
                                        <Trash2 size={14} /> Remove Agent
                                    </button>
                                </div>
                            </>
                         )}
                      </div>
                  </div>

                  {/* Profile Image & Status */}
                  <div className="relative px-6 flex justify-center">
                      <div className="absolute -top-12 z-10">
                         <div className="relative group/avatar cursor-pointer" onClick={() => setViewingProfileId(contact.id)}>
                            <div className="relative transform transition-all duration-500 ease-out group-hover/avatar:scale-[1.15] group-hover/avatar:drop-shadow-xl active:scale-95">
                                <div className={`p-1 bg-white dark:bg-slate-900 rounded-2xl ${contact.status === 'Online' ? 'shadow-lg shadow-green-500/20' : ''}`}>
                                    <img 
                                        src={contact.avatarUrl} 
                                        alt={contact.name}
                                        className="w-24 h-24 rounded-xl object-cover bg-slate-100 dark:bg-slate-800"
                                    />
                                </div>
                                
                                {/* Status Dot */}
                                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-white dark:border-slate-900 ${getStatusColor(contact.status)} z-20`}></div>
                                
                                {/* Level Badge */}
                                <div className="absolute -top-2 -left-2 bg-slate-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border-2 border-white dark:border-slate-900 shadow-sm z-20">
                                    LVL {contact.level}
                                </div>
                            </div>
                         </div>
                      </div>
                  </div>
                  
                  {/* Card Body */}
                  <div className="pt-16 pb-6 px-6 flex-1 flex flex-col items-center text-center">
                      <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-1 cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => setViewingProfileId(contact.id)}>{contact.name}</h3>
                      
                      <div className={`text-xs font-bold uppercase tracking-wider mb-3 px-2 py-0.5 rounded border bg-opacity-10 ${theme.text} ${theme.border} border-opacity-50`}>
                          {contact.role}
                      </div>

                      <div className="w-full h-px bg-slate-100 dark:bg-slate-800 mb-4"></div>

                      <div className="w-full space-y-2 mb-6">
                          <div className="flex justify-between items-center text-sm">
                              <span className="text-slate-500 dark:text-slate-400">Class</span>
                              <span className="font-medium text-slate-700 dark:text-slate-200">{contact.profession || 'Novice'}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                              <span className="text-slate-500 dark:text-slate-400">Status</span>
                              <span className={`font-medium ${contact.status === 'Online' ? 'text-green-600 dark:text-green-400' : 'text-slate-500'}`}>
                                  {contact.status}
                              </span>
                          </div>
                      </div>

                      <div className="w-full grid grid-cols-2 gap-3 mt-auto relative">
                          <Button 
                            variant="primary" 
                            onClick={() => onChat(contact.id)} 
                            className={`!py-2 !text-xs w-full shadow-md hover:shadow-lg transition-all ${contact.status !== 'Online' ? 'opacity-90' : ''}`}
                          >
                              <MessageSquare size={14} /> Message
                          </Button>
                          
                          <div className="relative">
                              {hoveredProfileId === contact.id && (
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-48 bg-slate-900 text-white text-xs rounded-xl p-3 shadow-xl z-50 border border-slate-700 animate-in fade-in zoom-in-95 duration-200 pointer-events-none">
                                      <div className="flex justify-between items-center mb-2 border-b border-slate-700 pb-1">
                                          <span className="font-bold text-indigo-400">Player Stats</span>
                                          <span className="text-[10px] text-slate-400">Lvl {contact.level}</span>
                                      </div>
                                      <div className="space-y-1.5 font-mono text-[10px]">
                                          <div className="flex justify-between items-center">
                                              <span className="w-6">STR</span>
                                              <div className="flex-1 h-1.5 bg-slate-800 rounded-full mx-2">
                                                  <div className="bg-red-500 h-1.5 rounded-full shadow-[0_0_5px_rgba(239,68,68,0.5)]" style={{width: `${stats.str}%`}}></div>
                                              </div>
                                              <span className="w-4 text-right text-slate-300">{stats.str}</span>
                                          </div>
                                          <div className="flex justify-between items-center">
                                              <span className="w-6">INT</span>
                                              <div className="flex-1 h-1.5 bg-slate-800 rounded-full mx-2">
                                                  <div className="bg-blue-500 h-1.5 rounded-full shadow-[0_0_5px_rgba(59,130,246,0.5)]" style={{width: `${stats.int}%`}}></div>
                                              </div>
                                              <span className="w-4 text-right text-slate-300">{stats.int}</span>
                                          </div>
                                          <div className="flex justify-between items-center">
                                              <span className="w-6">AGI</span>
                                              <div className="flex-1 h-1.5 bg-slate-800 rounded-full mx-2">
                                                  <div className="bg-emerald-500 h-1.5 rounded-full shadow-[0_0_5px_rgba(16,185,129,0.5)]" style={{width: `${stats.agi}%`}}></div>
                                              </div>
                                              <span className="w-4 text-right text-slate-300">{stats.agi}</span>
                                          </div>
                                      </div>
                                      <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-slate-900 border-r border-b border-slate-700 transform rotate-45"></div>
                                  </div>
                              )}
                              <Button 
                                variant="secondary" 
                                className="!py-2 !text-xs w-full border-slate-200 dark:border-slate-700"
                                onClick={() => setViewingProfileId(contact.id)}
                                onMouseEnter={() => setHoveredProfileId(contact.id)}
                                onMouseLeave={() => setHoveredProfileId(null)}
                              >
                                  <UserIcon size={14} /> Profile
                              </Button>
                          </div>
                      </div>
                  </div>
              </div>
          )})}
          
          {/* Add New Card Placeholder */}
          <button 
             onClick={() => setShowAddModal(true)}
             className="group h-full min-h-[340px] rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-400 hover:text-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all gap-4 p-6"
          >
             <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20 group-hover:scale-110 transition-all duration-300">
                <UserPlus size={36} />
             </div>
             <div className="text-center">
                <span className="font-bold block text-lg mb-1">Recruit Agent</span>
                <span className="text-xs opacity-70">Expand your network</span>
             </div>
          </button>
      </div>

      {filteredContacts.length === 0 && search && (
          <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
              <Users size={32} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 dark:text-slate-400">No agents found matching "{search}".</p>
          </div>
      )}

      {/* Profile Modal */}
      {viewingProfileId && (
          <ProfileModal 
              contact={user.contacts.find(c => c.id === viewingProfileId)!}
              onClose={() => setViewingProfileId(null)}
              onChat={onChat}
          />
      )}

      {/* Add Friend Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
           <Card className="w-full max-w-md p-6 relative bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                 <X size={20} />
              </button>
              <h3 className="text-xl font-bold mb-4 dark:text-slate-100">Recruit New Agent</h3>
              <p className="text-sm text-slate-500 mb-6 dark:text-slate-400">Enter the Agent ID or Callsign to send a connection request.</p>
              
              <form onSubmit={handleAddFriend} className="space-y-4">
                 <div>
                    <label className="block text-sm font-medium mb-1 dark:text-slate-300">Agent Callsign</label>
                    <div className="relative">
                        <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <Input 
                            value={newFriendId}
                            onChange={(e) => setNewFriendId(e.target.value)}
                            placeholder="e.g. ShadowWalker"
                            className="!pl-10"
                            autoFocus
                        />
                    </div>
                 </div>
                 
                 <div className="p-3 bg-indigo-50 rounded-lg text-xs text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
                    <p className="flex items-center gap-2 font-bold mb-1"><Zap size={12}/> Pro Tip</p>
                    You can meet new agents by participating in Team Raids and Community Events.
                 </div>

                 <Button type="submit" disabled={!newFriendId.trim() || isAdding} className="w-full">
                    {isAdding ? 'Sending Request...' : 'Send Connection Request'}
                 </Button>
              </form>
           </Card>
        </div>
      )}

      {/* Remove Confirmation Modal */}
      {contactToDelete && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
              <Card className="w-full max-w-sm p-6 bg-white dark:bg-slate-900 border-red-200 dark:border-red-900/50 shadow-xl">
                  <div className="flex flex-col items-center text-center gap-4">
                      <div className="p-3 bg-red-100 rounded-full text-red-600 dark:bg-red-900/30 dark:text-red-400">
                          <Trash2 size={32} />
                      </div>
                      <div>
                          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Sever Connection?</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                              Are you sure you want to remove this agent from your network? This cannot be undone.
                          </p>
                      </div>
                      <div className="flex gap-3 w-full mt-2">
                          <Button variant="secondary" onClick={() => setContactToDelete(null)} className="flex-1">
                              Cancel
                          </Button>
                          <Button variant="danger" onClick={confirmRemove} className="flex-1">
                              Disconnect
                          </Button>
                      </div>
                  </div>
              </Card>
          </div>
      )}
    </div>
  );
};
