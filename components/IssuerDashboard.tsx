
import React, { useState } from 'react';
import { Mission, User, MissionStatus } from '../types';
import { Card, Button, Badge } from './Shared';
import { Briefcase, CheckCircle2, Clock, Users, AlertCircle, Search, Filter, ChevronRight, FileText, BarChart3, Plus, Eye, Check, X, Shield } from 'lucide-react';
import { STATUS_COLORS, DIFFICULTY_COLORS } from '../constants';

interface IssuerDashboardProps {
  missions: Mission[];
  currentUser: User;
  onSelectMission: (id: string) => void;
  onCreateMission: () => void;
}

export const IssuerDashboard: React.FC<IssuerDashboardProps> = ({ 
    missions, 
    currentUser, 
    onSelectMission,
    onCreateMission
}) => {
    const [filterStatus, setFilterStatus] = useState<'All' | 'Active' | 'Pending' | 'Completed'>('All');
    const [searchQuery, setSearchQuery] = useState('');

    // Filter missions owned by current user
    const myMissions = missions.filter(m => m.issuerId === currentUser.id);

    // Calculate Stats
    const totalPosted = myMissions.length;
    const activeCount = myMissions.filter(m => [MissionStatus.Claimed, MissionStatus.InProgress].includes(m.status)).length;
    const pendingReviewCount = myMissions.filter(m => m.status === MissionStatus.Verifying).length;
    const completedCount = myMissions.filter(m => [MissionStatus.Verified, MissionStatus.Completed].includes(m.status)).length;
    const totalSpent = myMissions.filter(m => [MissionStatus.Verified, MissionStatus.Completed].includes(m.status)).reduce((acc, m) => acc + m.reward, 0);

    const filteredMissions = myMissions.filter(m => {
        const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = 
            filterStatus === 'All' ? true :
            filterStatus === 'Pending' ? m.status === MissionStatus.Verifying :
            filterStatus === 'Active' ? [MissionStatus.Claimed, MissionStatus.InProgress, MissionStatus.Urgent].includes(m.status) :
            filterStatus === 'Completed' ? [MissionStatus.Verified, MissionStatus.Completed, MissionStatus.Expired].includes(m.status) : true;
        
        return matchesSearch && matchesFilter;
    }).sort((a, b) => {
        // Prioritize Verifying
        if (a.status === MissionStatus.Verifying && b.status !== MissionStatus.Verifying) return -1;
        if (b.status === MissionStatus.Verifying && a.status !== MissionStatus.Verifying) return 1;
        // Then recent
        return new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime();
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header / Stats */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <Briefcase className="text-amber-600 dark:text-amber-500" /> Agency Command
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400">Manage your posted requests and operative performance.</p>
                </div>
                <Button onClick={onCreateMission} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                    <Plus size={18} /> New Contract
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4 border-l-4 border-l-yellow-500 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Review</p>
                        <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{pendingReviewCount}</p>
                    </div>
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 rounded-lg">
                        <FileText size={20} />
                    </div>
                </Card>
                <Card className="p-4 border-l-4 border-l-blue-500 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Agents</p>
                        <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{activeCount}</p>
                    </div>
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                        <Users size={20} />
                    </div>
                </Card>
                <Card className="p-4 border-l-4 border-l-green-500 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Completed Ops</p>
                        <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{completedCount}</p>
                    </div>
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-lg">
                        <CheckCircle2 size={20} />
                    </div>
                </Card>
                <Card className="p-4 border-l-4 border-l-slate-500 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Credits Disbursed</p>
                        <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{totalSpent}</p>
                    </div>
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded-lg">
                        <BarChart3 size={20} />
                    </div>
                </Card>
            </div>

            {/* Mission Management List */}
            <Card className="p-0 overflow-hidden min-h-[500px] flex flex-col">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-col sm:flex-row justify-between gap-4">
                    <div className="flex items-center gap-2 overflow-x-auto">
                        {(['All', 'Pending', 'Active', 'Completed'] as const).map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                                    filterStatus === status 
                                    ? 'bg-white shadow text-slate-800 dark:bg-slate-800 dark:text-white' 
                                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                                }`}
                            >
                                {status === 'Pending' && pendingReviewCount > 0 ? (
                                    <span className="flex items-center gap-1">
                                        {status} <span className="bg-red-500 text-white text-[9px] px-1.5 rounded-full">{pendingReviewCount}</span>
                                    </span>
                                ) : status}
                            </button>
                        ))}
                    </div>
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            placeholder="Search by title..." 
                            className="pl-9 pr-4 py-1.5 rounded-lg border border-slate-200 text-sm bg-white focus:ring-2 focus:ring-indigo-500 outline-none w-full sm:w-64 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-auto bg-white dark:bg-slate-900">
                    {filteredMissions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full py-20 text-slate-400">
                            <Briefcase size={48} className="mb-4 opacity-20" />
                            <p>No missions found.</p>
                            <Button variant="ghost" onClick={onCreateMission} className="mt-2 text-indigo-500">Create One</Button>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredMissions.map(mission => (
                                <div 
                                    key={mission.id} 
                                    onClick={() => onSelectMission(mission.id)}
                                    className={`p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group ${
                                        mission.status === MissionStatus.Verifying ? 'bg-yellow-50/50 dark:bg-yellow-900/10' : ''
                                    }`}
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge className={STATUS_COLORS[mission.status]}>{mission.status}</Badge>
                                            <span className="text-xs text-slate-400 font-mono">#{mission.id}</span>
                                            {mission.status === MissionStatus.Verifying && (
                                                <Badge className="bg-red-500 text-white animate-pulse">Action Required</Badge>
                                            )}
                                        </div>
                                        <h4 className="font-bold text-slate-800 dark:text-slate-200 truncate">{mission.title}</h4>
                                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
                                            <span className="flex items-center gap-1">
                                                <Clock size={12} /> {new Date(mission.postedDate).toLocaleDateString()}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Users size={12} /> {mission.assigneeId ? `Agent: ${mission.assigneeId}` : 'Unassigned'}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Shield size={12} /> {mission.difficulty}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0 w-full md:w-auto justify-end">
                                        {mission.status === MissionStatus.Verifying ? (
                                            <Button className="bg-green-600 hover:bg-green-700 text-white shadow-md w-full md:w-auto">
                                                Review Proof
                                            </Button>
                                        ) : (
                                            <Button variant="secondary" className="group-hover:bg-slate-200 dark:group-hover:bg-slate-700 w-full md:w-auto">
                                                Manage
                                            </Button>
                                        )}
                                        <ChevronRight size={16} className="text-slate-300 hidden md:block" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};
