
import React, { useState } from 'react';
import { Moon, Sun, Bell, Shield, User, Globe, Volume2, Monitor, LogOut, Trash2, Palette, RotateCcw, Lock, Terminal, Smartphone, Tablet, Monitor as MonitorIcon, MessageSquareWarning, Flag, LifeBuoy, Check, Loader2, History, ChevronDown, ChevronUp, BookOpen, HelpCircle, Database, Copy, CheckCircle2 } from 'lucide-react';
import { Card, Button, Badge, Input } from './Shared';
import { MissionStatus, User as UserType, DeviceType, FeedbackItem } from '../types';
import { CURRENT_USER, ADMIN_USER, ISSUER_USER } from '../constants';
import { UserGuideModal } from './UserGuideModal';
import { isSupabaseConfigured } from '../services/supabaseClient';

interface SettingsPanelProps {
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
  userEmail?: string;
  customStatusColors: Record<string, string>;
  setCustomStatusColors: (colors: Record<string, string>) => void;
  currentUser: UserType;
  onUserChange: (user: UserType) => void;
  manualDeviceType: DeviceType | null;
  setManualDeviceType: (type: DeviceType | null) => void;
  onSubmitFeedback: (item: Omit<FeedbackItem, 'id' | 'timestamp' | 'status'>) => void;
  feedbacks: FeedbackItem[];
  onLogout: () => void;
}

const ToggleSwitch: React.FC<{ checked: boolean; onChange: () => void }> = ({ checked, onChange }) => (
  <button 
    onClick={onChange}
    className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none focus:ring-2 focus:ring-guild-500/50 ${
      checked ? 'bg-guild-600' : 'bg-slate-300 dark:bg-slate-700'
    }`}
  >
    <div className={`w-4 h-4 rounded-full bg-white shadow-sm absolute top-1 transition-transform duration-200 ${
      checked ? 'left-6' : 'left-1'
    }`} />
  </button>
);

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ 
  isDarkMode, 
  setIsDarkMode, 
  userEmail = "adventurer@guild.nove",
  customStatusColors,
  setCustomStatusColors,
  currentUser,
  onUserChange,
  manualDeviceType,
  setManualDeviceType,
  onSubmitFeedback,
  feedbacks,
  onLogout
}) => {
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    marketing: false,
    guildAlerts: true
  });

  const [privacy, setPrivacy] = useState({
    publicProfile: true,
    showLocation: true,
    onlineStatus: true
  });

  const [soundVolume, setSoundVolume] = useState(80);

  // Feedback State
  const [feedbackType, setFeedbackType] = useState<'feedback' | 'report' | 'bug'>('feedback');
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackTarget, setFeedbackTarget] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);

  // Guide State
  const [showUserGuide, setShowUserGuide] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const supabaseSqlSchema = `-- Run this in your Supabase SQL Editor to initialize Chat & Storage tables:

create table if not exists public.chat_messages (
  id text primary key,
  channel text not null,
  sender text not null check (sender in ('user', 'agent')),
  sender_name text,
  text text not null,
  recipient_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Realtime subscriptions for chat
alter publication supabase_realtime add table public.chat_messages;

-- Row Level Security (RLS) policies
alter table public.chat_messages enable row level security;

create policy "Allow anonymous select on chat_messages" on public.chat_messages
  for select using (true);

create policy "Allow anonymous insert on chat_messages" on public.chat_messages
  for insert with check (true);
`;

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(supabaseSqlSchema);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const toggleNotif = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const togglePrivacy = (key: keyof typeof privacy) => {
    setPrivacy(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleColorChange = (status: string, color: string) => {
    setCustomStatusColors({
      ...customStatusColors,
      [status]: color
    });
  };

  const resetColors = () => {
    if (confirm('Reset all status colors to default?')) {
      setCustomStatusColors({});
    }
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;

    setIsSubmitting(true);
    
    // Pass to parent
    onSubmitFeedback({
        userId: currentUser.id,
        userName: currentUser.name,
        type: feedbackType,
        targetId: feedbackTarget || undefined,
        content: feedbackText
    });

    // Simulate API delay for UX
    setTimeout(() => {
        setIsSubmitting(false);
        setSubmitSuccess(true);
        setFeedbackText('');
        setFeedbackTarget('');
        
        // Reset success message after 3 seconds
        setTimeout(() => setSubmitSuccess(false), 3000);
    }, 1500);
  };

  const myFeedbacks = feedbacks.filter(f => f.userId === currentUser.id).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const getStatusBadgeColor = (status: string) => {
      switch(status) {
          case 'Pending': return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
          case 'In Progress': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
          case 'Resolved': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
          case 'Dismissed': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
          default: return 'bg-slate-100 text-slate-600';
      }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Settings & Configuration</h2>
        <p className="text-slate-500 dark:text-slate-400">Manage your guild preferences and interface customization.</p>
      </div>

      {/* Developer / Mode Switcher */}
      <Card className="p-0 overflow-hidden border-indigo-200 dark:border-indigo-900/50">
        <div className="p-4 border-b border-indigo-100 bg-indigo-50/50 dark:bg-indigo-900/20 dark:border-indigo-800">
           <h3 className="font-bold flex items-center gap-2 text-indigo-900 dark:text-indigo-200">
             <Terminal size={18} /> Developer Controls
           </h3>
        </div>
        <div className="p-6 space-y-6">
           {/* Role Switcher */}
           <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                 <p className="font-medium text-slate-800 dark:text-slate-200">User Role Simulation</p>
                 <p className="text-sm text-slate-500 dark:text-slate-400">Switch account context for testing permissions.</p>
              </div>
              <div className="flex gap-2 bg-slate-100 p-1 rounded-lg dark:bg-slate-800 overflow-x-auto max-w-full">
                 <button 
                    onClick={() => onUserChange(CURRENT_USER)}
                    className={`px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-all ${
                       currentUser.id === CURRENT_USER.id 
                       ? 'bg-white shadow-sm text-slate-800 dark:bg-slate-700 dark:text-white' 
                       : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                    }`}
                 >
                    Student
                 </button>
                 <button 
                    onClick={() => onUserChange(ISSUER_USER)}
                    className={`px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-all ${
                       currentUser.id === ISSUER_USER.id 
                       ? 'bg-amber-600 shadow-sm text-white' 
                       : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                    }`}
                 >
                    Issuer
                 </button>
                 <button 
                    onClick={() => onUserChange(ADMIN_USER)}
                    className={`px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-all ${
                       currentUser.id === ADMIN_USER.id 
                       ? 'bg-indigo-600 shadow-sm text-white' 
                       : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                    }`}
                 >
                    Admin
                 </button>
              </div>
           </div>

           <div className="h-px bg-indigo-100 dark:bg-indigo-900/50"></div>

           {/* Layout Emulator */}
           <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                 <p className="font-medium text-slate-800 dark:text-slate-200">Layout Emulation</p>
                 <p className="text-sm text-slate-500 dark:text-slate-400">Force specific responsive layouts for testing.</p>
              </div>
              <div className="flex gap-2 bg-slate-100 p-1 rounded-lg dark:bg-slate-800">
                 <button 
                    onClick={() => setManualDeviceType(null)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                       manualDeviceType === null 
                       ? 'bg-white shadow-sm text-slate-800 dark:bg-slate-700 dark:text-white' 
                       : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                    }`}
                 >
                    Auto
                 </button>
                 <button 
                    onClick={() => setManualDeviceType('mobile')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                       manualDeviceType === 'mobile' 
                       ? 'bg-white shadow-sm text-slate-800 dark:bg-slate-700 dark:text-white' 
                       : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                    }`}
                 >
                    <Smartphone size={14} /> Mobile
                 </button>
                 <button 
                    onClick={() => setManualDeviceType('tablet')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                       manualDeviceType === 'tablet' 
                       ? 'bg-white shadow-sm text-slate-800 dark:bg-slate-700 dark:text-white' 
                       : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                    }`}
                 >
                    <Tablet size={14} /> Tablet
                 </button>
                 <button 
                    onClick={() => setManualDeviceType('desktop')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                       manualDeviceType === 'desktop' 
                       ? 'bg-white shadow-sm text-slate-800 dark:bg-slate-700 dark:text-white' 
                       : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                    }`}
                 >
                    <MonitorIcon size={14} /> Desktop
                 </button>
              </div>
           </div>
        </div>
      </Card>

      {/* Supabase Database & Realtime Communication Section */}
      <Card className="p-0 overflow-hidden border-emerald-200 dark:border-emerald-900/50">
        <div className="p-4 border-b border-emerald-100 bg-emerald-50/50 dark:bg-emerald-950/30 dark:border-emerald-900 flex justify-between items-center">
           <h3 className="font-bold flex items-center gap-2 text-emerald-900 dark:text-emerald-200">
             <Database size={18} className="text-emerald-600 dark:text-emerald-400" /> Supabase Database & Realtime Communication
           </h3>
           <Badge className={isSupabaseConfigured ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300" : "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300"}>
             {isSupabaseConfigured ? "Connected (Live)" : "Local Storage Mode"}
           </Badge>
        </div>
        <div className="p-6 space-y-6">
           <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                 <p className="font-medium text-slate-800 dark:text-slate-200">Connection Status</p>
                 <p className="text-sm text-slate-500 dark:text-slate-400">
                   {isSupabaseConfigured 
                     ? "Realtime Supabase PostgreSQL client connected for chat, guild messages, and data storage." 
                     : "Running in local persistent mode. To enable real-time cloud database storage, add your Supabase credentials in .env."}
                 </p>
              </div>
              <div className="shrink-0 flex items-center gap-2">
                 {isSupabaseConfigured ? (
                   <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                     <CheckCircle2 size={16} /> Supabase Active
                   </span>
                 ) : (
                   <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                     <Database size={16} /> Local Cache Mode
                   </span>
                 )}
              </div>
           </div>

           <div className="bg-slate-50 dark:bg-slate-900/80 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-700 dark:text-slate-300">Environment Variables Required (.env.example):</span>
              </div>
              <p className="font-mono bg-white dark:bg-slate-950 p-2 rounded border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                VITE_SUPABASE_URL=https://your-project.supabase.co<br />
                VITE_SUPABASE_ANON_KEY=your-anon-key
              </p>
           </div>

           {/* Copyable SQL Setup Script */}
           <div className="space-y-2">
              <div className="flex justify-between items-center">
                 <label className="text-xs font-bold text-slate-500 uppercase dark:text-slate-400">Supabase SQL Table & Realtime Setup Script</label>
                 <Button 
                   onClick={copySqlToClipboard} 
                   variant="ghost" 
                   className="text-xs h-7 px-2 text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950"
                 >
                    {copiedSql ? <><CheckCircle2 size={14} /> Copied SQL!</> : <><Copy size={14} /> Copy SQL Schema</>}
                 </Button>
              </div>
              <textarea 
                readOnly
                value={supabaseSqlSchema}
                className="w-full p-3 font-mono text-xs bg-slate-900 text-emerald-400 rounded-xl border border-slate-800 h-36 resize-none focus:outline-none"
              />
           </div>
        </div>
      </Card>

      {/* Support & Feedback Section */}
      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 dark:bg-slate-900/50 dark:border-slate-800">
           <h3 className="font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
             <LifeBuoy size={18} className="text-teal-600 dark:text-teal-400" /> Support & Feedback
           </h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="md:col-span-1 space-y-4">
              <div className="p-4 rounded-xl bg-teal-50 border border-teal-100 text-teal-800 dark:bg-teal-900/20 dark:border-teal-900 dark:text-teal-300">
                 <h4 className="font-bold text-sm mb-2 flex items-center gap-2"><MessageSquareWarning size={16}/> We Value Your Input</h4>
                 <p className="text-xs leading-relaxed opacity-90">
                    Help us improve the Guild interface. Report bugs, suggest features, or flag inappropriate behavior.
                 </p>
              </div>
              <div className="space-y-2">
                 {/* User Guide Button */}
                 <button
                    onClick={() => setShowUserGuide(true)}
                    className="w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all border border-transparent text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-3 bg-slate-50 dark:bg-slate-900/50 dark:text-slate-300 dark:hover:bg-slate-800"
                 >
                    <BookOpen size={16} className="text-indigo-500" /> Adventurer's Handbook
                 </button>

                 <button 
                    onClick={() => setFeedbackType('feedback')}
                    className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all border flex items-center gap-3 ${
                        feedbackType === 'feedback' 
                        ? 'bg-white border-teal-500 text-teal-700 shadow-sm dark:bg-slate-800 dark:text-teal-400' 
                        : 'bg-slate-50 border-transparent text-slate-600 hover:bg-slate-100 dark:bg-slate-900/50 dark:text-slate-400 dark:hover:bg-slate-800'
                    }`}
                 >
                    <LifeBuoy size={16} /> General Feedback
                 </button>
                 <button 
                    onClick={() => setFeedbackType('bug')}
                    className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all border flex items-center gap-3 ${
                        feedbackType === 'bug' 
                        ? 'bg-white border-amber-500 text-amber-700 shadow-sm dark:bg-slate-800 dark:text-amber-400' 
                        : 'bg-slate-50 border-transparent text-slate-600 hover:bg-slate-100 dark:bg-slate-900/50 dark:text-slate-400 dark:hover:bg-slate-800'
                    }`}
                 >
                    <MessageSquareWarning size={16} /> Report a Bug
                 </button>
                 <button 
                    onClick={() => setFeedbackType('report')}
                    className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all border flex items-center gap-3 ${
                        feedbackType === 'report' 
                        ? 'bg-white border-red-500 text-red-700 shadow-sm dark:bg-slate-800 dark:text-red-400' 
                        : 'bg-slate-50 border-transparent text-slate-600 hover:bg-slate-100 dark:bg-slate-900/50 dark:text-slate-400 dark:hover:bg-slate-800'
                    }`}
                 >
                    <Flag size={16} /> Report User / Issue
                 </button>
              </div>
           </div>

           <div className="md:col-span-2 space-y-8">
              <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                 <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold text-slate-700 dark:text-slate-200 capitalize">{feedbackType.replace('-', ' ')} Form</h4>
                    <Badge className="bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        {feedbackType === 'report' ? 'Confidential' : 'Public'}
                    </Badge>
                 </div>

                 {feedbackType === 'report' && (
                    <div className="animate-in fade-in slide-in-from-top-2">
                       <label className="block text-xs font-bold text-slate-500 uppercase mb-1 dark:text-slate-400">Target ID / User (Optional)</label>
                       <Input 
                          placeholder="e.g. User ID, Mission ID..." 
                          value={feedbackTarget} 
                          onChange={(e) => setFeedbackTarget(e.target.value)}
                          className="bg-slate-50 dark:bg-slate-900"
                       />
                    </div>
                 )}

                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1 dark:text-slate-400">Details</label>
                    <textarea 
                        className="w-full p-4 rounded-xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none h-32 resize-none text-sm dark:bg-slate-950 dark:border-slate-700 dark:text-slate-200 dark:focus:border-teal-600 dark:focus:ring-teal-900/50"
                        placeholder={
                            feedbackType === 'report' ? "Please describe the violation or issue in detail..." :
                            feedbackType === 'bug' ? "Steps to reproduce the bug..." :
                            "Tell us what you love or what we can improve..."
                        }
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        required
                    />
                 </div>

                 <div className="flex justify-end">
                    <Button 
                        type="submit" 
                        disabled={!feedbackText.trim() || isSubmitting || submitSuccess}
                        className={`min-w-[120px] transition-all ${
                            submitSuccess ? '!bg-green-500 hover:!bg-green-600' : 
                            feedbackType === 'report' ? '!bg-red-600 hover:!bg-red-700' :
                            feedbackType === 'bug' ? '!bg-amber-600 hover:!bg-amber-700' :
                            '!bg-teal-600 hover:!bg-teal-700'
                        }`}
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 
                         submitSuccess ? <><Check size={18} /> Sent!</> : 
                         'Submit'}
                    </Button>
                 </div>
              </form>

              {/* User Feedback History Section */}
              {myFeedbacks.length > 0 && (
                  <div className="border-t border-slate-100 pt-6 dark:border-slate-800">
                      <div className="flex items-center gap-2 mb-4 text-slate-800 dark:text-slate-200 font-bold">
                          <History size={18} className="text-slate-400" />
                          My Ticket History
                          <Badge className="bg-slate-100 text-slate-500 dark:bg-slate-800">{myFeedbacks.length}</Badge>
                      </div>
                      
                      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                          {myFeedbacks.map(ticket => (
                              <div key={ticket.id} className="bg-slate-50 rounded-xl border border-slate-200 dark:bg-slate-900/50 dark:border-slate-800 overflow-hidden">
                                  <div 
                                    className="p-3 flex justify-between items-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
                                    onClick={() => setExpandedTicketId(expandedTicketId === ticket.id ? null : ticket.id)}
                                  >
                                      <div className="flex items-center gap-3">
                                          <Badge className={`text-[10px] w-20 justify-center ${
                                              ticket.type === 'report' ? 'bg-red-100 text-red-700' :
                                              ticket.type === 'bug' ? 'bg-amber-100 text-amber-700' :
                                              'bg-blue-100 text-blue-700'
                                          }`}>
                                              {ticket.type}
                                          </Badge>
                                          <div>
                                              <p className="text-xs text-slate-400">{new Date(ticket.timestamp).toLocaleDateString()}</p>
                                              <p className="text-sm font-medium text-slate-700 dark:text-slate-200 line-clamp-1 max-w-[200px] sm:max-w-xs">{ticket.content}</p>
                                          </div>
                                      </div>
                                      <div className="flex items-center gap-3">
                                          <Badge className={`text-[10px] ${getStatusBadgeColor(ticket.status)}`}>
                                              {ticket.status}
                                          </Badge>
                                          {expandedTicketId === ticket.id ? <ChevronUp size={16} className="text-slate-400"/> : <ChevronDown size={16} className="text-slate-400"/>}
                                      </div>
                                  </div>
                                  
                                  {expandedTicketId === ticket.id && (
                                      <div className="p-4 bg-white border-t border-slate-100 dark:bg-slate-950/30 dark:border-slate-800 animate-in slide-in-from-top-2">
                                          <div className="mb-4">
                                              <p className="text-xs font-bold text-slate-400 uppercase mb-1">Your Message</p>
                                              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{ticket.content}</p>
                                              {ticket.targetId && (
                                                  <p className="text-xs text-slate-400 mt-2">Target Ref: {ticket.targetId}</p>
                                              )}
                                          </div>
                                          
                                          {ticket.adminResponse ? (
                                              <div className="bg-indigo-50/50 p-3 rounded-lg border border-indigo-100 dark:bg-indigo-900/10 dark:border-indigo-900/30">
                                                  <div className="flex items-center gap-2 mb-2">
                                                      <Shield size={14} className="text-indigo-600 dark:text-indigo-400" />
                                                      <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase">Admin Response</span>
                                                  </div>
                                                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                                                      {ticket.adminResponse}
                                                  </p>
                                              </div>
                                          ) : (
                                              <div className="flex items-center gap-2 text-xs text-slate-400 italic">
                                                  <Loader2 size={12} className="animate-spin" /> Awaiting administrative review...
                                              </div>
                                          )}
                                      </div>
                                  )}
                              </div>
                          ))}
                      </div>
                  </div>
              )}
           </div>
        </div>
      </Card>

      {/* Appearance Section */}
      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 dark:bg-slate-900/50 dark:border-slate-800">
           <h3 className="font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
             <Monitor size={18} /> Interface Appearance
           </h3>
        </div>
        <div className="p-6 space-y-6">
           <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-700 dark:text-slate-200">Theme Mode</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Toggle between light and dark visuals.</p>
              </div>
              <div className="flex items-center gap-3 bg-slate-100 p-1 rounded-lg dark:bg-slate-800">
                 <button 
                   onClick={() => setIsDarkMode(false)}
                   className={`p-2 rounded-md transition-all ${!isDarkMode ? 'bg-white shadow-sm text-amber-500' : 'text-slate-400 hover:text-slate-600'}`}
                 >
                   <Sun size={18} />
                 </button>
                 <button 
                   onClick={() => setIsDarkMode(true)}
                   className={`p-2 rounded-md transition-all ${isDarkMode ? 'bg-slate-700 shadow-sm text-indigo-400' : 'text-slate-400 hover:text-slate-600'}`}
                 >
                   <Moon size={18} />
                 </button>
              </div>
           </div>
           <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-700 dark:text-slate-200">Compact Mode</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Reduce spacing in mission lists.</p>
              </div>
              <ToggleSwitch checked={false} onChange={() => {}} />
           </div>
        </div>
      </Card>

      {/* Mission Status Colors */}
      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 dark:bg-slate-900/50 dark:border-slate-800 flex justify-between items-center">
           <h3 className="font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
             <Palette size={18} /> Mission Status Colors
           </h3>
           <Button variant="ghost" onClick={resetColors} className="text-xs h-8 px-2">
              <RotateCcw size={14} /> Reset Defaults
           </Button>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.values(MissionStatus).map((status) => (
            <div key={status} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent hover:border-slate-100 dark:hover:border-slate-800 transition-colors">
              <div className="flex items-center gap-3">
                 <div 
                   className="w-4 h-4 rounded-full border border-slate-200 shadow-sm"
                   style={{ backgroundColor: customStatusColors[status] || '#cbd5e1' }} // default slate-300 visual
                 ></div>
                 <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{status}</span>
              </div>
              <div className="flex items-center gap-2">
                <input 
                   type="color" 
                   value={customStatusColors[status] || '#000000'} 
                   onChange={(e) => handleColorChange(status, e.target.value)}
                   className="w-8 h-8 rounded cursor-pointer border-0 p-0 bg-transparent"
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Notifications Section */}
      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 dark:bg-slate-900/50 dark:border-slate-800">
           <h3 className="font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
             <Bell size={18} /> Notifications
           </h3>
        </div>
        <div className="p-6 space-y-4">
           <div className="flex items-center justify-between">
              <span className="text-slate-700 dark:text-slate-300">Urgent Mission Alerts</span>
              <ToggleSwitch checked={notifications.guildAlerts} onChange={() => toggleNotif('guildAlerts')} />
           </div>
           <div className="flex items-center justify-between">
              <span className="text-slate-700 dark:text-slate-300">Email Summaries</span>
              <ToggleSwitch checked={notifications.email} onChange={() => toggleNotif('email')} />
           </div>
           <div className="flex items-center justify-between">
              <span className="text-slate-700 dark:text-slate-300">Push Notifications</span>
              <ToggleSwitch checked={notifications.push} onChange={() => toggleNotif('push')} />
           </div>
           <div className="flex items-center justify-between">
              <span className="text-slate-700 dark:text-slate-300">Guild Marketing & Events</span>
              <ToggleSwitch checked={notifications.marketing} onChange={() => toggleNotif('marketing')} />
           </div>
        </div>
      </Card>

      {/* Privacy Section */}
      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 dark:bg-slate-900/50 dark:border-slate-800">
           <h3 className="font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
             <Shield size={18} /> Privacy & Security
           </h3>
        </div>
        <div className="p-6 space-y-4">
           <div className="flex items-center justify-between">
              <div>
                 <p className="text-slate-700 dark:text-slate-300">Public Profile</p>
                 <p className="text-xs text-slate-500">Allow other adventurers to see your stats.</p>
              </div>
              <ToggleSwitch checked={privacy.publicProfile} onChange={() => togglePrivacy('publicProfile')} />
           </div>
           <div className="flex items-center justify-between">
              <div>
                 <p className="text-slate-700 dark:text-slate-300">Share Real-time Location</p>
                 <p className="text-xs text-slate-500">Required for some 'Urgent' missions.</p>
              </div>
              <ToggleSwitch checked={privacy.showLocation} onChange={() => togglePrivacy('showLocation')} />
           </div>
           <div className="flex items-center justify-between">
              <span className="text-slate-700 dark:text-slate-300">Show Online Status</span>
              <ToggleSwitch checked={privacy.onlineStatus} onChange={() => togglePrivacy('onlineStatus')} />
           </div>
        </div>
      </Card>

       {/* Audio Section */}
       <Card className="p-0 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 dark:bg-slate-900/50 dark:border-slate-800">
           <h3 className="font-bold flex items-center gap-2 text-slate-800 dark:text-slate-200">
             <Volume2 size={18} /> Sound
           </h3>
        </div>
        <div className="p-6">
           <div className="space-y-2">
              <div className="flex justify-between text-sm">
                 <span className="text-slate-700 dark:text-slate-300">Master Volume</span>
                 <span className="text-slate-500">{soundVolume}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={soundVolume}
                onChange={(e) => setSoundVolume(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 accent-guild-600"
              />
           </div>
        </div>
      </Card>

      {/* Account Actions */}
      <Card className="p-6 border-red-100 dark:border-red-900/30">
        <h3 className="font-bold text-red-600 mb-4 flex items-center gap-2">
           <AlertTriangleIcon /> Danger Zone
        </h3>
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
           <div className="text-sm text-slate-500 dark:text-slate-400">
             <p>Account Email: <span className="font-mono text-slate-700 dark:text-slate-300">{userEmail}</span></p>
             <p>Deleting your account is permanent. All earned credits and badges will be lost.</p>
           </div>
           <div className="flex gap-3">
              <Button 
                variant="secondary" 
                className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20"
                onClick={onLogout}
              >
                <LogOut size={16} /> Sign Out
              </Button>
              <Button variant="danger">
                <Trash2 size={16} /> Delete Account
              </Button>
           </div>
        </div>
      </Card>
      
      {showUserGuide && (
         <UserGuideModal onClose={() => setShowUserGuide(false)} />
      )}

      <div className="text-center text-xs text-slate-400 pt-8 pb-4">
         Nexus Nova Core App Version 2.5.0 • Build 20241029
      </div>
    </div>
  );
};

const AlertTriangleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
);
