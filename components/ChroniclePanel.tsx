import React, { useState } from 'react';
import { ChronicleEntry, User, Mission, UserRole } from '../types';
import { Card, Button, Badge } from './Shared';
import { 
  BookOpen, Sparkles, Search, Bookmark, Heart, Plus, Filter, 
  Share2, Trash2, Calendar, User as UserIcon, Tag, Shield, 
  CheckCircle2, Clock, Eye, Sparkle, Feather, Flame, Award, 
  Layers, Lock, Globe, Users, ArrowRight, X, RefreshCw
} from 'lucide-react';
import { generateChronicleEntry, AIChronicleDraft } from '../services/geminiService';

interface ChroniclePanelProps {
  chronicles: ChronicleEntry[];
  currentUser: User;
  missions: Mission[];
  onCreateEntry: (entry: Omit<ChronicleEntry, 'id' | 'timestamp' | 'likesCount'>) => void;
  onToggleBookmark: (id: string) => void;
  onLikeEntry: (id: string) => void;
  onDeleteEntry: (id: string) => void;
}

const SIGNIFICANCE_STYLES = {
  Legendary: {
    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    card: 'border-amber-400/40 dark:border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5',
    icon: <Flame size={14} className="text-amber-500 animate-pulse" />,
    label: 'Legendary Saga'
  },
  Historic: {
    badge: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
    card: 'border-purple-300 dark:border-purple-800/60 bg-gradient-to-br from-purple-500/5 via-transparent to-indigo-500/5',
    icon: <Award size={14} className="text-purple-500" />,
    label: 'Historic Chronicle'
  },
  Notable: {
    badge: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
    card: 'border-indigo-200 dark:border-indigo-900/60',
    icon: <Shield size={14} className="text-indigo-500" />,
    label: 'Notable Record'
  },
  Minor: {
    badge: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30',
    card: 'border-slate-200 dark:border-slate-800',
    icon: <Feather size={14} className="text-slate-400" />,
    label: 'Field Log'
  }
};

export const ChroniclePanel: React.FC<ChroniclePanelProps> = ({
  chronicles,
  currentUser,
  missions,
  onCreateEntry,
  onToggleBookmark,
  onLikeEntry,
  onDeleteEntry
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSignificance, setSelectedSignificance] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [readingEntry, setReadingEntry] = useState<ChronicleEntry | null>(null);

  // New Entry Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ChronicleEntry['category']>('Personal Log');
  const [content, setContent] = useState('');
  const [significance, setSignificance] = useState<ChronicleEntry['significance']>('Notable');
  const [tagsInput, setTagsInput] = useState('');
  const [visibility, setVisibility] = useState<ChronicleEntry['visibility']>('Public');
  const [relatedMissionId, setRelatedMissionId] = useState('');

  // AI Generator State
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiSelectedMission, setAiSelectedMission] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiDraft, setAiDraft] = useState<AIChronicleDraft | null>(null);

  // Copy alert feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filtered Chronicles
  const filteredChronicles = chronicles.filter(entry => {
    // Visibility Check
    if (entry.visibility === 'Private' && entry.authorId !== currentUser.id && currentUser.role !== UserRole.Admin) {
      return false;
    }

    const matchesSearch = 
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.authorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = 
      selectedCategory === 'All' ? true :
      selectedCategory === 'Bookmarked' ? entry.isBookmarked :
      selectedCategory === 'My Entries' ? entry.authorId === currentUser.id :
      entry.category === selectedCategory;

    const matchesSignificance = 
      selectedSignificance === 'All' ? true :
      entry.significance === selectedSignificance;

    return matchesSearch && matchesCategory && matchesSignificance;
  });

  const totalEntries = chronicles.length;
  const bookmarkedCount = chronicles.filter(c => c.isBookmarked).length;
  const legendaryCount = chronicles.filter(c => c.significance === 'Legendary').length;
  const myEntriesCount = chronicles.filter(c => c.authorId === currentUser.id).length;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const tagsArr = tagsInput
      .split(',')
      .map(t => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    onCreateEntry({
      title,
      category,
      content,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorRole: currentUser.role,
      tags: tagsArr.length > 0 ? tagsArr : ['Journal'],
      significance,
      isBookmarked: false,
      relatedMissionId: relatedMissionId || undefined,
      isAiGenerated: false,
      visibility
    });

    // Reset Form
    setTitle('');
    setContent('');
    setTagsInput('');
    setShowCreateModal(false);
  };

  const handleGenerateAiChronicle = async () => {
    if (!aiPrompt.trim() && !aiSelectedMission) return;
    setIsGenerating(true);

    let promptText = aiPrompt;
    if (aiSelectedMission) {
      const missionObj = missions.find(m => m.id === aiSelectedMission);
      if (missionObj) {
        promptText = `Mission Debrief for: ${missionObj.title}. Type: ${missionObj.type}, Location: ${missionObj.location}. ${aiPrompt}`;
      }
    }

    const userContextText = `Agent ${currentUser.name}, Role: ${currentUser.role}, Level: ${currentUser.level}`;
    const draft = await generateChronicleEntry(promptText, userContextText);
    setIsGenerating(false);

    if (draft) {
      setAiDraft(draft);
    }
  };

  const handleSaveAiDraft = () => {
    if (!aiDraft) return;

    onCreateEntry({
      title: aiDraft.title,
      category: aiDraft.category,
      content: aiDraft.content,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorRole: currentUser.role,
      tags: aiDraft.tags,
      significance: aiDraft.significance,
      isBookmarked: false,
      relatedMissionId: aiSelectedMission || undefined,
      isAiGenerated: true,
      visibility: 'Public'
    });

    setAiDraft(null);
    setAiPrompt('');
    setAiSelectedMission('');
    setShowAiModal(false);
  };

  const handleCopyShare = (entry: ChronicleEntry) => {
    const text = `[Chronicle] ${entry.title} by ${entry.authorName}\n${entry.content.slice(0, 100)}...`;
    navigator.clipboard.writeText(text);
    setCopiedId(entry.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 text-white shadow-xl border border-indigo-500/20">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <BookOpen size={300} />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-400/30 flex items-center gap-1.5">
                <BookOpen size={14} /> Guild Archives
              </span>
              <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-400/30 flex items-center gap-1.5">
                <Sparkles size={14} /> AI Powered
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Guild Chronicles & Field Sagas</h1>
            <p className="text-slate-300 text-xs md:text-sm max-w-2xl mt-1 leading-relaxed">
              Record history, archive mission debriefs, and synthesize epic field journals. Every agent's deed leaves a mark on the Nova Core history logs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button 
              onClick={() => setShowAiModal(true)}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/25 border border-indigo-400/30"
            >
              <Sparkles size={16} className="text-amber-300" /> Synthesize AI Saga
            </Button>
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/25"
            >
              <Plus size={16} /> New Record
            </Button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-900/60 backdrop-blur-sm p-3 rounded-xl border border-slate-800">
            <p className="text-slate-400 text-xs">Total Records</p>
            <p className="text-lg md:text-xl font-bold text-white flex items-center gap-1.5">
              <Layers size={16} className="text-indigo-400" /> {totalEntries}
            </p>
          </div>
          <div className="bg-slate-900/60 backdrop-blur-sm p-3 rounded-xl border border-slate-800">
            <p className="text-slate-400 text-xs">Bookmarked</p>
            <p className="text-lg md:text-xl font-bold text-amber-400 flex items-center gap-1.5">
              <Bookmark size={16} className="text-amber-400 fill-amber-400/20" /> {bookmarkedCount}
            </p>
          </div>
          <div className="bg-slate-900/60 backdrop-blur-sm p-3 rounded-xl border border-slate-800">
            <p className="text-slate-400 text-xs">Legendary Sagas</p>
            <p className="text-lg md:text-xl font-bold text-orange-400 flex items-center gap-1.5">
              <Flame size={16} className="text-orange-400" /> {legendaryCount}
            </p>
          </div>
          <div className="bg-slate-900/60 backdrop-blur-sm p-3 rounded-xl border border-slate-800">
            <p className="text-slate-400 text-xs">My Authored</p>
            <p className="text-lg md:text-xl font-bold text-emerald-400 flex items-center gap-1.5">
              <Feather size={16} className="text-emerald-400" /> {myEntriesCount}
            </p>
          </div>
        </div>
      </div>

      {/* Control & Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 custom-scrollbar">
          {['All', 'Guild Saga', 'Mission Debrief', 'World Lore', 'Personal Log', 'Bookmarked', 'My Entries'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {cat === 'Bookmarked' && <Bookmark size={12} className="inline mr-1 text-amber-400" />}
              {cat === 'My Entries' && <UserIcon size={12} className="inline mr-1" />}
              {cat}
            </button>
          ))}
        </div>

        {/* Filters & Search */}
        <div className="flex items-center gap-2">
          {/* Significance Selector */}
          <div className="relative">
            <select
              value={selectedSignificance}
              onChange={e => setSelectedSignificance(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All">All Significance</option>
              <option value="Legendary">🔥 Legendary</option>
              <option value="Historic">🏆 Historic</option>
              <option value="Notable">🛡️ Notable</option>
              <option value="Minor">🪶 Minor</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 md:w-56">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Search chronicles..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={12} />
              </button>
            )}
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded text-xs transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              title="Grid View"
            >
              <Layers size={14} />
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`p-1 rounded text-xs transition-colors ${viewMode === 'timeline' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              title="Timeline View"
            >
              <Clock size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Feed */}
      {filteredChronicles.length === 0 ? (
        <Card className="p-12 text-center flex flex-col items-center justify-center bg-white/80 dark:bg-slate-900/80">
          <BookOpen size={48} className="text-slate-300 dark:text-slate-700 mb-3" />
          <h3 className="font-bold text-slate-700 dark:text-slate-200 text-base">No Chronicles Found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1 mb-4">
            No history logs match your search filters. Try selecting another category or record a new entry!
          </p>
          <div className="flex items-center gap-3">
            <Button onClick={() => { setSearchQuery(''); setSelectedCategory('All'); setSelectedSignificance('All'); }} variant="outline" className="text-xs">
              Reset Filters
            </Button>
            <Button onClick={() => setShowCreateModal(true)} className="text-xs bg-indigo-600 text-white">
              Create Entry
            </Button>
          </div>
        </Card>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredChronicles.map(entry => {
            const sigStyle = SIGNIFICANCE_STYLES[entry.significance] || SIGNIFICANCE_STYLES.Minor;
            return (
              <Card 
                key={entry.id} 
                className={`flex flex-col justify-between p-5 transition-all duration-200 hover:shadow-md ${sigStyle.card} bg-white dark:bg-slate-900 relative group overflow-hidden`}
              >
                {/* Significance indicator line top */}
                <div className="top-0 left-0 right-0 h-1 absolute bg-slate-200 dark:bg-slate-800 group-hover:opacity-100" />

                <div>
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border flex items-center gap-1 ${sigStyle.badge}`}>
                        {sigStyle.icon} {sigStyle.label}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        {entry.category}
                      </span>
                      {entry.isAiGenerated && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center gap-1">
                          <Sparkles size={10} /> AI Synthesized
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => onToggleBookmark(entry.id)}
                        className={`p-1.5 rounded-lg transition-colors ${entry.isBookmarked ? 'text-amber-500 bg-amber-500/10' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                        title={entry.isBookmarked ? 'Remove Bookmark' : 'Bookmark'}
                      >
                        <Bookmark size={16} className={entry.isBookmarked ? 'fill-amber-500' : ''} />
                      </button>
                    </div>
                  </div>

                  {/* Title & Author */}
                  <h3 
                    onClick={() => setReadingEntry(entry)}
                    className="font-bold text-base md:text-lg text-slate-800 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer transition-colors leading-snug mb-2"
                  >
                    {entry.title}
                  </h3>

                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-3">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <UserIcon size={12} /> {entry.authorName}
                    </span>
                    <span>•</span>
                    <span className="text-[11px]">{entry.authorRole}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-[11px]">
                      <Calendar size={11} /> {new Date(entry.timestamp).toLocaleDateString()}
                    </span>
                    {entry.visibility === 'Private' && (
                      <span className="text-amber-500 flex items-center gap-1 text-[10px] font-bold">
                        <Lock size={10} /> Private
                      </span>
                    )}
                  </div>

                  {/* Content snippet */}
                  <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed mb-4">
                    {entry.content}
                  </p>
                </div>

                <div>
                  {/* Tags */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-4">
                    {entry.tags.map((t, idx) => (
                      <span key={idx} className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 flex items-center gap-0.5">
                        <Tag size={10} className="opacity-60" /> #{t}
                      </span>
                    ))}
                  </div>

                  {/* Footer Actions */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => onLikeEntry(entry.id)}
                        className="flex items-center gap-1 text-slate-500 hover:text-rose-500 transition-colors"
                      >
                        <Heart size={14} className={entry.likesCount && entry.likesCount > 0 ? 'text-rose-500 fill-rose-500' : ''} />
                        <span className="font-medium text-xs">{entry.likesCount || 0}</span>
                      </button>

                      <button 
                        onClick={() => handleCopyShare(entry)}
                        className="flex items-center gap-1 text-slate-500 hover:text-indigo-500 transition-colors"
                        title="Copy Summary"
                      >
                        <Share2 size={14} />
                        {copiedId === entry.id ? <span className="text-[10px] text-emerald-500 font-bold">Copied!</span> : null}
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      {(entry.authorId === currentUser.id || currentUser.role === UserRole.Admin) && (
                        <button 
                          onClick={() => onDeleteEntry(entry.id)}
                          className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                          title="Delete Record"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                      <button 
                        onClick={() => setReadingEntry(entry)}
                        className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                      >
                        Read Full <ArrowRight size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        /* TIMELINE VIEW */
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-indigo-500/30">
          {filteredChronicles.map((entry, index) => {
            const sigStyle = SIGNIFICANCE_STYLES[entry.significance] || SIGNIFICANCE_STYLES.Minor;
            return (
              <div key={entry.id} className="relative group">
                {/* Timeline dot */}
                <div className={`absolute -left-6 top-4 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${
                  entry.significance === 'Legendary' ? 'bg-amber-500 shadow-md shadow-amber-500/50 ring-4 ring-amber-500/20' :
                  entry.significance === 'Historic' ? 'bg-purple-500' :
                  entry.significance === 'Notable' ? 'bg-indigo-500' : 'bg-slate-400'
                }`} />

                <Card className={`p-5 ${sigStyle.card} bg-white dark:bg-slate-900 transition-all hover:shadow-md`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${sigStyle.badge}`}>
                        {sigStyle.label}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {entry.category}
                      </span>
                    </div>

                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar size={12} /> {new Date(entry.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <h3 
                    onClick={() => setReadingEntry(entry)}
                    className="font-bold text-base md:text-lg text-slate-800 dark:text-slate-100 hover:text-indigo-600 cursor-pointer mb-2"
                  >
                    {entry.title}
                  </h3>

                  <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                    {entry.content}
                  </p>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-slate-500">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{entry.authorName}</span>
                      <span>({entry.authorRole})</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => onLikeEntry(entry.id)}
                        className="flex items-center gap-1 text-slate-500 hover:text-rose-500"
                      >
                        <Heart size={14} className={entry.likesCount && entry.likesCount > 0 ? 'text-rose-500 fill-rose-500' : ''} />
                        <span>{entry.likesCount || 0}</span>
                      </button>
                      <button 
                        onClick={() => onToggleBookmark(entry.id)}
                        className={`p-1 rounded ${entry.isBookmarked ? 'text-amber-500' : 'text-slate-400'}`}
                      >
                        <Bookmark size={14} className={entry.isBookmarked ? 'fill-amber-500' : ''} />
                      </button>
                    </div>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: Create Custom Entry Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-xl p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl relative">
            <button 
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Feather size={20} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Record Field Chronicle</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Publish a journal entry, debrief, or historical saga to the guild records.</p>
              </div>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Field Recon: Sub-Level Anomaly"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Personal Log">Personal Log</option>
                    <option value="Guild Saga">Guild Saga</option>
                    <option value="Mission Debrief">Mission Debrief</option>
                    <option value="World Lore">World Lore</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Significance Rating
                  </label>
                  <select
                    value={significance}
                    onChange={e => setSignificance(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Minor">🪶 Minor (Routine Entry)</option>
                    <option value="Notable">🛡️ Notable (Key Event)</option>
                    <option value="Historic">🏆 Historic (Guild Milestone)</option>
                    <option value="Legendary">🔥 Legendary (Major World Event)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Chronicle Narrative / Content <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Detail your observations, mission milestones, or field discoveries..."
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 custom-scrollbar"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tags (comma separated)
                  </label>
                  <input 
                    type="text"
                    placeholder="e.g. Anomaly, Etherium, Recon"
                    value={tagsInput}
                    onChange={e => setTagsInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Visibility
                  </label>
                  <select
                    value={visibility}
                    onChange={e => setVisibility(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Public">🌐 Public (All Guild Members)</option>
                    <option value="Guild Only">🛡️ Guild Only</option>
                    <option value="Private">🔒 Private (Only Me)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Link Related Mission (Optional)
                </label>
                <select
                  value={relatedMissionId}
                  onChange={e => setRelatedMissionId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">None</option>
                  {missions.map(m => (
                    <option key={m.id} value={m.id}>
                      [{m.difficulty}] {m.title} ({m.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)} className="text-xs">
                  Cancel
                </Button>
                <Button type="submit" className="text-xs bg-amber-600 hover:bg-amber-500 text-white">
                  Publish Chronicle
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* MODAL 2: AI Historian Synthesizer Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-xl p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl relative">
            <button 
              onClick={() => { setShowAiModal(false); setAiDraft(null); }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  AI Guild Historian & Saga Synthesizer
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Leverage Gemini AI to generate rich RPG chronicle entries and debriefs automatically.
                </p>
              </div>
            </div>

            {!aiDraft ? (
              <div className="space-y-4">
                {/* Inspiration Prompts */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Quick Inspiration Prompts
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      "Synthesize recent mission victory against sub-space breach",
                      "Record discovery of an ancient etherium core artifact",
                      "Document agent ascension to Rank B Guild Operative",
                      "Craft a legendary saga of guild team defense in Sector 4"
                    ].map((prompt, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setAiPrompt(prompt)}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors border border-indigo-200 dark:border-indigo-800/50 text-left"
                      >
                        ⚡ {prompt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Select Mission to Debrief (Optional)
                  </label>
                  <select
                    value={aiSelectedMission}
                    onChange={e => setAiSelectedMission(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">None (Custom Prompt)</option>
                    {missions.map(m => (
                      <option key={m.id} value={m.id}>
                        [{m.difficulty}] {m.title} ({m.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Story Directives / Keywords
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe what happened or key elements you want included in the saga..."
                    value={aiPrompt}
                    onChange={e => setAiPrompt(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 custom-scrollbar"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <Button variant="outline" onClick={() => setShowAiModal(false)} className="text-xs">
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleGenerateAiChronicle} 
                    disabled={isGenerating || (!aiPrompt.trim() && !aiSelectedMission)}
                    className="text-xs bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw size={14} className="animate-spin mr-1.5" /> Synthesizing Saga...
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} className="mr-1.5 text-amber-300" /> Synthesize Saga
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              /* Generated Draft Review */
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-slate-900/10 border border-indigo-500/30">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                      {aiDraft.significance} Significance
                    </span>
                    <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-300">
                      Category: {aiDraft.category}
                    </span>
                  </div>

                  <h4 className="font-bold text-base text-slate-800 dark:text-slate-100 mb-2">{aiDraft.title}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">{aiDraft.content}</p>

                  <div className="flex flex-wrap gap-1">
                    {aiDraft.tags.map((t, idx) => (
                      <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <Button 
                    variant="outline" 
                    onClick={() => setAiDraft(null)} 
                    className="text-xs flex items-center gap-1"
                  >
                    <RefreshCw size={12} /> Regenerate
                  </Button>
                  <Button 
                    onClick={handleSaveAiDraft}
                    className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                  >
                    <CheckCircle2 size={14} className="mr-1" /> Save to Guild Chronicles
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* MODAL 3: Full Screen Reading Reader Modal */}
      {readingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-200">
          <Card className="w-full max-w-2xl max-h-[85vh] flex flex-col p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl relative overflow-hidden">
            <button 
              onClick={() => setReadingEntry(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X size={20} />
            </button>

            {/* Header */}
            <div className="mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${SIGNIFICANCE_STYLES[readingEntry.significance]?.badge}`}>
                  {SIGNIFICANCE_STYLES[readingEntry.significance]?.label}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  {readingEntry.category}
                </span>
                {readingEntry.isAiGenerated && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center gap-1">
                    <Sparkles size={10} /> AI Synthesized
                  </span>
                )}
              </div>

              <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">{readingEntry.title}</h2>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-slate-700 dark:text-slate-300">By {readingEntry.authorName} ({readingEntry.authorRole})</span>
                <span>•</span>
                <span>{new Date(readingEntry.timestamp).toLocaleString()}</span>
              </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar my-2 text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed space-y-4">
              <p className="whitespace-pre-wrap">{readingEntry.content}</p>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {readingEntry.tags.map((t, idx) => (
                  <span key={idx} className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    #{t}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <Button 
                  onClick={() => onLikeEntry(readingEntry.id)}
                  variant="outline" 
                  className="text-xs"
                >
                  <Heart size={14} className={readingEntry.likesCount && readingEntry.likesCount > 0 ? 'text-rose-500 fill-rose-500 mr-1' : 'mr-1'} />
                  {readingEntry.likesCount || 0}
                </Button>
                <Button 
                  onClick={() => onToggleBookmark(readingEntry.id)}
                  variant="outline"
                  className="text-xs"
                >
                  <Bookmark size={14} className={readingEntry.isBookmarked ? 'text-amber-500 fill-amber-500 mr-1' : 'mr-1'} />
                  {readingEntry.isBookmarked ? 'Bookmarked' : 'Bookmark'}
                </Button>
                <Button onClick={() => setReadingEntry(null)} className="text-xs bg-indigo-600 text-white">
                  Close
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
