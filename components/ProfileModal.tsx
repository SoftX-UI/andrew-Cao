
import React from 'react';
import { Contact, User, UserRole } from '../types';
import { Card, Button, Badge } from './Shared';
import { X, MessageSquare, UserMinus, Shield, GraduationCap, Crown, Briefcase, User as UserIcon, Mail, Phone, MapPin, Trees, Lock } from 'lucide-react';

interface ProfileModalProps {
  contact: Contact | User;
  onClose: () => void;
  onChat?: (contactId: string) => void;
  viewerRole?: UserRole | string; // New prop to check permissions
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ contact, onClose, onChat, viewerRole }) => {
  
  const getRoleIcon = (role: string) => {
    const r = role.toLowerCase();
    if (r.includes('student')) return <GraduationCap size={14} className="text-blue-500" />;
    if (r.includes('professor')) return <Crown size={14} className="text-purple-500" />;
    if (r.includes('staff')) return <Shield size={14} className="text-slate-500" />;
    if (r.includes('warden') || r.includes('forest')) return <Trees size={14} className="text-emerald-600" />;
    return <Briefcase size={14} className="text-amber-500" />;
  };

  const getStatusColor = (status: string) => {
      // Users might not have status prop if it's the User type, default to online/active for this view
      switch(status) {
          case 'Online': return 'bg-green-500';
          case 'Busy': return 'bg-red-500';
          case 'Away': return 'bg-yellow-500';
          default: return 'bg-green-500'; 
      }
  };

  // Determine if it's a User or Contact type to safely access props
  const isUser = (c: Contact | User): c is User => 'credits' in c;
  const status = isUser(contact) ? 'Online' : contact.status;
  const profession = isUser(contact) ? contact.role : contact.profession;
  const adminTags = contact.adminTags; // Access admin tags if present
  const isAdmin = viewerRole === UserRole.Admin;
  
  // Logic to determine if we show contact info:
  // 1. If it's a User type, check visibility flags.
  // 2. If it's a Contact type (generic), we assume limited info unless explicitly provided (not typical in this mock)
  const visibleEmail = isUser(contact) && contact.visibility?.email ? contact.email : null;
  const visiblePhone = isUser(contact) && contact.visibility?.phone ? contact.phone : null;
  const visibleLocation = isUser(contact) && contact.visibility?.location ? contact.location : null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
       <Card className="w-full max-w-sm overflow-hidden bg-white dark:bg-slate-900 border-0 shadow-2xl relative">
          {/* Header Banner */}
          <div className="h-28 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 relative">
             <button onClick={onClose} className="absolute top-3 right-3 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/20 transition-colors">
                <X size={20} />
             </button>
          </div>
          
          {/* Profile Content */}
          <div className="px-6 pb-6 relative">
             {/* Avatar - Left Aligned */}
             <div className="absolute -top-12 left-6 p-1 bg-white dark:bg-slate-900 rounded-2xl shadow-lg">
                <img 
                    src={contact.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${contact.id}`} 
                    alt={contact.name} 
                    className="w-24 h-24 rounded-xl bg-slate-200 object-cover" 
                />
                <div className={`absolute bottom-0 right-0 w-5 h-5 border-4 border-white dark:border-slate-900 rounded-full ${getStatusColor(status)} transform translate-x-1 translate-y-1`}></div>
             </div>
             
             {/* Top Actions (Right aligned opposite avatar) */}
             <div className="flex justify-end pt-3 mb-8">
                {onChat && (
                   <Button variant="secondary" className="!px-3 !py-1.5 !text-xs !rounded-full shadow-sm" onClick={() => { onChat(contact.id); onClose(); }}>
                      <MessageSquare size={14} /> Message
                   </Button>
                )}
             </div>

             <div className="mt-2">
                <div className="flex flex-col gap-1">
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 leading-tight">{contact.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                       {getRoleIcon(contact.role)} {profession || contact.role}
                    </p>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-4">
                   <Badge className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">Level {contact.level}</Badge>
                   <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Reputation: High</Badge>
                   {isUser(contact) && contact.isPremium && (
                       <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Premium</Badge>
                   )}
                </div>

                {/* Admin Only Tags Section */}
                {isAdmin && adminTags && adminTags.length > 0 && (
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg dark:bg-amber-900/20 dark:border-amber-900/50">
                        <div className="flex items-center gap-2 mb-2">
                            <Lock size={12} className="text-amber-600 dark:text-amber-400" />
                            <span className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">Guild Records (Classified)</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {adminTags.map(tag => (
                                <span key={tag} className="text-[10px] px-2 py-0.5 rounded border border-amber-300 bg-white text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-800">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Visible Contact Details Section */}
                {(visibleEmail || visiblePhone || visibleLocation) && (
                    <div className="mt-6 space-y-2.5 bg-slate-50 p-4 rounded-xl border border-slate-100 dark:bg-slate-800 dark:border-slate-700 text-sm">
                        {visibleLocation && (
                            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                                <div className="p-1.5 bg-white dark:bg-slate-700 rounded-md text-slate-400 shrink-0">
                                    <MapPin size={14} />
                                </div>
                                <span className="truncate font-medium">{visibleLocation}</span>
                            </div>
                        )}
                        {visibleEmail && (
                            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                                <div className="p-1.5 bg-white dark:bg-slate-700 rounded-md text-slate-400 shrink-0">
                                    <Mail size={14} />
                                </div>
                                <a href={`mailto:${visibleEmail}`} className="hover:text-indigo-500 truncate transition-colors font-medium">{visibleEmail}</a>
                            </div>
                        )}
                        {visiblePhone && (
                            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                                <div className="p-1.5 bg-white dark:bg-slate-700 rounded-md text-slate-400 shrink-0">
                                    <Phone size={14} />
                                </div>
                                <a href={`tel:${visiblePhone}`} className="hover:text-indigo-500 truncate transition-colors font-medium">{visiblePhone}</a>
                            </div>
                        )}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4 mt-6 w-full text-left">
                   <div className="p-3 bg-slate-50 rounded-xl dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Missions</p>
                      <p className="text-xl font-bold text-slate-700 dark:text-slate-200">{Math.floor(Math.random() * 50) + 10}</p>
                   </div>
                   <div className="p-3 bg-slate-50 rounded-xl dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Joined</p>
                      <p className="text-xl font-bold text-slate-700 dark:text-slate-200">2y ago</p>
                   </div>
                </div>
             </div>
          </div>
       </Card>
    </div>
  );
};
