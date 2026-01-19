
import React, { useState, useMemo } from 'react';
import { Mission, User, MissionStatus, MissionType, MissionDifficulty } from '../types';
import { MissionCard } from './MissionCard';
import { Search, Filter, SortAsc, MapPin, Zap, Monitor, DollarSign, X } from 'lucide-react';
import { Button, Badge } from './Shared';

interface MissionBoardProps {
  missions: Mission[];
  user: User;
  onSelectMission: (id: string) => void;
  onQuickAccept: (id: string) => void;
  customStatusColors: Record<string, string>;
  onViewIssuer?: (id: string) => void;
}

type SortOption = 'newest' | 'reward' | 'difficulty';

export const MissionBoard: React.FC<MissionBoardProps> = ({
  missions,
  user,
  onSelectMission,
  onQuickAccept,
  customStatusColors,
  onViewIssuer
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<MissionType | 'All'>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<MissionDifficulty | 'All'>('All');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  
  // Quick Filters
  const [showRemoteOnly, setShowRemoteOnly] = useState(false);
  const [showHighPayOnly, setShowHighPayOnly] = useState(false);
  const [showUrgentOnly, setShowUrgentOnly] = useState(false);

  const filteredMissions = useMemo(() => {
    return missions.filter(m => {
      // Basic Search
      const matchesSearch = 
        m.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

      // Dropdowns
      const matchesType = selectedType === 'All' || m.type === selectedType;
      const matchesDiff = selectedDifficulty === 'All' || m.difficulty === selectedDifficulty;

      // Toggles
      const matchesRemote = !showRemoteOnly || m.isRemote;
      const matchesHighPay = !showHighPayOnly || m.reward >= 1000;
      const matchesUrgent = !showUrgentOnly || m.status === MissionStatus.Urgent;

      // Status Check: Hide expired or fully completed/archived missions from the main board to reduce clutter
      // But show Claimed if the current user is the assignee
      const isRelevantStatus = 
        m.status === MissionStatus.Open || 
        m.status === MissionStatus.Urgent ||
        (m.status === MissionStatus.Claimed && m.assigneeId === user.id) ||
        (m.status === MissionStatus.InProgress && m.assigneeId === user.id) ||
        (m.status === MissionStatus.Verifying && m.assigneeId === user.id) ||
        (m.status === MissionStatus.Verified && m.assigneeId === user.id);

      return matchesSearch && matchesType && matchesDiff && matchesRemote && matchesHighPay && matchesUrgent && isRelevantStatus;
    }).sort((a, b) => {
      if (sortBy === 'reward') return b.reward - a.reward;
      if (sortBy === 'difficulty') return a.difficulty.localeCompare(b.difficulty); // Approximate string sort for ranks
      return new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime(); // Newest first
    });
  }, [missions, searchQuery, selectedType, selectedDifficulty, sortBy, showRemoteOnly, showHighPayOnly, showUrgentOnly, user.id]);

  const activeFiltersCount = (selectedType !== 'All' ? 1 : 0) + (selectedDifficulty !== 'All' ? 1 : 0) + (showRemoteOnly ? 1 : 0) + (showHighPayOnly ? 1 : 0) + (showUrgentOnly ? 1 : 0);

  const clearFilters = () => {
      setSelectedType('All');
      setSelectedDifficulty('All');
      setShowRemoteOnly(false);
      setShowHighPayOnly(false);
      setShowUrgentOnly(false);
      setSearchQuery('');
  };

  return (
    <div className="space-y-6">
      {/* Controls Header */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Search missions, locations, or tags..." 
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
                <select 
                    className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 focus:outline-none focus:border-indigo-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                >
                    <option value="newest">Newest</option>
                    <option value="reward">Highest Reward</option>
                    <option value="difficulty">Difficulty</option>
                </select>
                
                <select 
                    className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 focus:outline-none focus:border-indigo-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value as MissionType | 'All')}
                >
                    <option value="All">All Types</option>
                    {Object.values(MissionType).map(t => <option key={t} value={t}>{t}</option>)}
                </select>

                <select 
                    className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 focus:outline-none focus:border-indigo-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value as MissionDifficulty | 'All')}
                >
                    <option value="All">All Ranks</option>
                    {Object.values(MissionDifficulty).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
            </div>
        </div>

        {/* Quick Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase mr-2 flex items-center gap-1"><Filter size={12}/> Filters:</span>
            
            <button 
                onClick={() => setShowUrgentOnly(!showUrgentOnly)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5 ${showUrgentOnly ? 'bg-red-50 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'}`}
            >
                <Zap size={12} className={showUrgentOnly ? 'fill-current' : ''} /> Urgent
            </button>

            <button 
                onClick={() => setShowRemoteOnly(!showRemoteOnly)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5 ${showRemoteOnly ? 'bg-purple-50 border-purple-200 text-purple-600 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-400' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'}`}
            >
                <Monitor size={12} /> Remote
            </button>

            <button 
                onClick={() => setShowHighPayOnly(!showHighPayOnly)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5 ${showHighPayOnly ? 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'}`}
            >
                <DollarSign size={12} /> High Pay {'>'}1k
            </button>

            {activeFiltersCount > 0 && (
                <button 
                    onClick={clearFilters}
                    className="ml-auto text-xs text-slate-500 hover:text-red-500 flex items-center gap-1 transition-colors"
                >
                    <X size={12} /> Clear All
                </button>
            )}
        </div>
      </div>

      {/* Grid */}
      {filteredMissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl dark:border-slate-800">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 dark:bg-slate-800">
                  <Search size={32} className="opacity-50" />
              </div>
              <h3 className="text-lg font-bold text-slate-600 dark:text-slate-300">No missions found</h3>
              <p className="text-sm">Try adjusting your search or filters to see more results.</p>
              <Button variant="ghost" onClick={clearFilters} className="mt-4">Reset Filters</Button>
          </div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {filteredMissions.map(mission => (
              <MissionCard 
                key={mission.id} 
                mission={mission} 
                user={user}
                onSelect={onSelectMission}
                customStatusColors={customStatusColors}
                onQuickAccept={onQuickAccept}
                onViewIssuer={onViewIssuer}
              />
            ))}
          </div>
      )}
    </div>
  );
};
