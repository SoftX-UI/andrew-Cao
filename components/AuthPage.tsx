
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { Shield, Mail, Lock, User as UserIcon, ArrowRight, Github, Briefcase, GraduationCap, Crown, AlertCircle } from 'lucide-react';
import { Button, Input, Card, Badge } from './Shared';

interface AuthPageProps {
  availableUsers: User[];
  onLogin: (user: User) => void;
  onRegister: (newUser: User) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ availableUsers, onLogin, onRegister }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRole, setRegRole] = useState<UserRole>(UserRole.Student);
  const [regError, setRegError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    
    // Simple email match
    const user = availableUsers.find(u => u.email?.toLowerCase() === loginEmail.toLowerCase());
    if (user) {
        onLogin(user);
    } else {
        setLoginError('No adventurer found with this email.');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!regName.trim() || !regEmail.trim()) {
        setRegError('All fields are required.');
        return;
    }

    if (availableUsers.some(u => u.email?.toLowerCase() === regEmail.toLowerCase())) {
        setRegError('Email already registered.');
        return;
    }

    const newUser: User = {
        id: `u_${Date.now()}`,
        name: regName,
        email: regEmail,
        role: regRole,
        level: 1,
        exp: 0,
        credits: 100,
        location: 'Unknown',
        isPremium: false,
        verificationStatus: 'Unverified',
        tags: ['Rookie'],
        contacts: [],
        visibility: {
            email: false,
            phone: false,
            location: true
        }
    };

    onRegister(newUser);
  };

  const getRoleIcon = (role: string) => {
    switch(role) {
        case UserRole.Student: return <GraduationCap size={16} />;
        case UserRole.Professional: return <Briefcase size={16} />;
        case UserRole.Admin: return <Shield size={16} />;
        default: return <UserIcon size={16} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900 via-slate-950 to-slate-950"></div>
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" 
             style={{ backgroundImage: 'linear-gradient(#4f46e5 1px, transparent 1px), linear-gradient(90deg, #4f46e5 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
        </div>

        <Card className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 shadow-2xl overflow-hidden border-0 bg-white/5 backdrop-blur-md dark:bg-slate-900/80 dark:border-slate-800 z-10">
            {/* Left Panel: Branding & Presets */}
            <div className="p-8 bg-indigo-600/90 text-white flex flex-col justify-between relative overflow-hidden">
                <div className="absolute -right-10 -top-10 text-white/10 rotate-12">
                    <Shield size={200} />
                </div>
                
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                        <Shield size={32} className="text-amber-400 fill-amber-500/20" />
                        <h1 className="text-3xl font-bold tracking-tight">Nexus Nova Core</h1>
                    </div>
                    <p className="text-indigo-100 mb-8 max-w-sm">
                        The central operating system for the modern Adventurer's Guild. Accept quests, track bounties, and build your legend.
                    </p>
                </div>

                <div className="relative z-10 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-px bg-indigo-400 flex-1"></div>
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">Identity Quick Access</span>
                        <div className="h-px bg-indigo-400 flex-1"></div>
                    </div>
                    
                    <div className="grid gap-3">
                        {availableUsers.slice(0, 3).map(user => (
                            <button 
                                key={user.id}
                                onClick={() => onLogin(user)}
                                className="flex items-center gap-3 p-3 rounded-lg bg-indigo-800/50 hover:bg-indigo-700/80 border border-indigo-500/30 hover:border-indigo-400 transition-all text-left group"
                            >
                                <div className="w-10 h-10 rounded-full bg-indigo-900 flex items-center justify-center border border-indigo-500 overflow-hidden">
                                    {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" alt={user.name} /> : <UserIcon size={18} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm truncate group-hover:text-amber-300 transition-colors">{user.name}</p>
                                    <p className="text-xs text-indigo-300 truncate">{user.role}</p>
                                </div>
                                <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Panel: Forms */}
            <div className="p-8 bg-white dark:bg-slate-900 flex flex-col justify-center">
                <div className="flex gap-4 mb-8 border-b border-slate-200 dark:border-slate-800">
                    <button 
                        onClick={() => setActiveTab('login')}
                        className={`pb-3 text-sm font-medium transition-all relative ${activeTab === 'login' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                    >
                        Login
                        {activeTab === 'login' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-t-full"></div>}
                    </button>
                    <button 
                        onClick={() => setActiveTab('register')}
                        className={`pb-3 text-sm font-medium transition-all relative ${activeTab === 'register' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                    >
                        New Registration
                        {activeTab === 'register' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-t-full"></div>}
                    </button>
                </div>

                {activeTab === 'login' ? (
                    <form onSubmit={handleLogin} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Guild Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <Input 
                                    type="email" 
                                    className="pl-10" 
                                    placeholder="adventurer@guild.net"
                                    value={loginEmail}
                                    onChange={(e) => setLoginEmail(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Passcode</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <Input type="password" className="pl-10" placeholder="••••••••" />
                            </div>
                        </div>

                        {loginError && (
                            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2 dark:bg-red-900/20 dark:text-red-400">
                                <AlertCircle size={16} /> {loginError}
                            </div>
                        )}

                        <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5">
                            Access System
                        </Button>
                        
                        <div className="text-center text-xs text-slate-400 mt-4">
                            Forgot credentials? Contact Guild Administration.
                        </div>
                    </form>
                ) : (
                    <form onSubmit={handleRegister} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Callsign / Name</label>
                            <div className="relative">
                                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <Input 
                                    className="pl-10" 
                                    placeholder="e.g. IronHeart"
                                    value={regName}
                                    onChange={(e) => setRegName(e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <Input 
                                    type="email" 
                                    className="pl-10" 
                                    placeholder="email@domain.com"
                                    value={regEmail}
                                    onChange={(e) => setRegEmail(e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Role Class</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setRegRole(UserRole.Student)}
                                    className={`p-2 rounded-lg border text-xs font-medium flex items-center gap-2 justify-center transition-all ${regRole === UserRole.Student ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-400' : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400'}`}
                                >
                                    <GraduationCap size={14} /> Student
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRegRole(UserRole.Professional)}
                                    className={`p-2 rounded-lg border text-xs font-medium flex items-center gap-2 justify-center transition-all ${regRole === UserRole.Professional ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-400' : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400'}`}
                                >
                                    <Briefcase size={14} /> Professional
                                </button>
                            </div>
                        </div>

                        {regError && (
                            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2 dark:bg-red-900/20 dark:text-red-400">
                                <AlertCircle size={16} /> {regError}
                            </div>
                        )}

                        <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5">
                            Register Badge
                        </Button>
                    </form>
                )}
            </div>
        </Card>
        
        <div className="absolute bottom-4 text-slate-500 text-xs text-center w-full opacity-50">
            Nexus Nova Core v2.5 • Authorized Access Only
        </div>
    </div>
  );
};
