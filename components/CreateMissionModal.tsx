
import React, { useState } from 'react';
import { X, Sparkles, Loader2, MapPin, DollarSign, Tag, Briefcase, Video, Building2, Globe, Lock, Key, Monitor, Gift, Star } from 'lucide-react';
import { MissionType, MissionDifficulty, User } from '../types';
import { Button, Input, Card } from './Shared';
import { generateMissionDraft } from '../services/geminiService';

interface CreateMissionModalProps {
  onClose: () => void;
  onCreate: (mission: any) => void;
  currentUser: User;
}

export const CreateMissionModal: React.FC<CreateMissionModalProps> = ({ onClose, onCreate, currentUser }) => {
  const [loading, setLoading] = useState(false);
  const [draftKeywords, setDraftKeywords] = useState('');
  const [protocol, setProtocol] = useState<'on-site' | 'virtual'>('on-site');
  const [rewardType, setRewardType] = useState<'credits' | 'gift_card' | 'custom'>('credits');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: MissionType.Logistics,
    difficulty: MissionDifficulty.Rank_D,
    reward: 100,
    customReward: '',
    location: currentUser.location || '',
    tags: ''
  });

  const [virtualDetails, setVirtualDetails] = useState({
      platform: 'Google Meet',
      link: '',
      roomId: '',
      password: ''
  });

  const handleMagicDraft = async () => {
    if (!draftKeywords.trim()) return;
    setLoading(true);
    const draft = await generateMissionDraft(draftKeywords);
    if (draft) {
      setFormData(prev => ({
        ...prev,
        title: draft.title,
        description: draft.description
      }));
    }
    setLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Construct final data payload
    const missionData = {
        ...formData,
        reward: rewardType === 'credits' ? formData.reward : 0,
        customReward: rewardType === 'credits' ? undefined : formData.customReward,
        location: protocol === 'on-site' ? formData.location : 'Virtual Uplink',
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        isRemote: protocol === 'virtual',
        virtualCoordinates: protocol === 'virtual' ? {
            platform: virtualDetails.platform,
            link: virtualDetails.link,
            roomId: virtualDetails.roomId,
            password: virtualDetails.password,
            passcodeVisibility: 'limited'
        } : undefined
    };

    onCreate(missionData);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
        <Card className="w-full max-w-lg bg-white dark:bg-slate-900 border-0 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-indigo-600 text-white rounded-t-xl">
                <h2 className="text-lg font-bold flex items-center gap-2">
                    <Briefcase size={20} /> Distribute Mission
                </h2>
                <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                    <X size={20} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* AI Section */}
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
                    <label className="text-xs font-bold text-indigo-800 dark:text-indigo-300 uppercase mb-2 flex items-center gap-2">
                        <Sparkles size={14} /> Magic Draft
                    </label>
                    <div className="flex gap-2">
                        <Input 
                            placeholder="e.g. 'Rescue merchant from goblins in Frostpeaks'..." 
                            value={draftKeywords}
                            onChange={(e) => setDraftKeywords(e.target.value)}
                            className="bg-white dark:bg-white dark:text-slate-900 border-indigo-200 dark:border-indigo-800 text-sm"
                        />
                        <Button 
                            onClick={handleMagicDraft} 
                            disabled={loading || !draftKeywords.trim()}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0"
                        >
                            {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                        </Button>
                    </div>
                </div>

                <form id="create-mission-form" onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Mission Title</label>
                        <Input 
                            required 
                            value={formData.title} 
                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                            placeholder="Enter mission title..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                        <textarea 
                            required
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none h-24 resize-none dark:bg-white dark:border-slate-200 dark:text-slate-900"
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            placeholder="Describe the objective, risks, and details..."
                        />
                    </div>

                    {/* Protocol Section */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-3 dark:text-slate-400">Operational Protocol</label>
                        
                        <div className="flex gap-4 mb-4">
                            <button
                                type="button"
                                onClick={() => setProtocol('on-site')}
                                className={`flex-1 p-3 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${
                                    protocol === 'on-site' 
                                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' 
                                    : 'border-slate-200 text-slate-500 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400'
                                }`}
                            >
                                <Building2 size={24} />
                                <span className="font-bold text-sm">On-Site Meetup</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setProtocol('virtual')}
                                className={`flex-1 p-3 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${
                                    protocol === 'virtual' 
                                    ? 'border-purple-600 bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' 
                                    : 'border-slate-200 text-slate-500 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400'
                                }`}
                            >
                                <Video size={24} />
                                <span className="font-bold text-sm">Virtual Uplink</span>
                            </button>
                        </div>

                        {protocol === 'on-site' ? (
                            <div className="animate-in fade-in slide-in-from-top-2">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Physical Location</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <Input 
                                        required 
                                        className="pl-9"
                                        value={formData.location}
                                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                                        placeholder="Address, Landmark, or Coordinates..."
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1 dark:text-slate-400">Platform</label>
                                        <div className="relative">
                                            <Monitor className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                            <select 
                                                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm dark:bg-white dark:border-slate-200 dark:text-slate-900"
                                                value={virtualDetails.platform}
                                                onChange={(e) => setVirtualDetails({...virtualDetails, platform: e.target.value})}
                                            >
                                                <option>Google Meet</option>
                                                <option>Zoom</option>
                                                <option>Discord</option>
                                                <option>Microsoft Teams</option>
                                                <option>Custom</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1 dark:text-slate-400">Link URL</label>
                                        <div className="relative">
                                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                            <Input 
                                                required
                                                className="pl-9 !text-sm"
                                                placeholder="https://..."
                                                value={virtualDetails.link}
                                                onChange={(e) => setVirtualDetails({...virtualDetails, link: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1 dark:text-slate-400">Room ID (Optional)</label>
                                        <div className="relative">
                                            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                            <Input 
                                                className="pl-9 !text-sm"
                                                placeholder="e.g. 948-223"
                                                value={virtualDetails.roomId}
                                                onChange={(e) => setVirtualDetails({...virtualDetails, roomId: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1 dark:text-slate-400">Passcode (Optional)</label>
                                        <div className="relative">
                                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                            <Input 
                                                className="pl-9 !text-sm"
                                                placeholder="Secure Key"
                                                value={virtualDetails.password}
                                                onChange={(e) => setVirtualDetails({...virtualDetails, password: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Type</label>
                            <select 
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white dark:bg-white dark:border-slate-200 dark:text-slate-900"
                                value={formData.type}
                                onChange={(e) => setFormData({...formData, type: e.target.value as MissionType})}
                            >
                                {Object.values(MissionType).sort().map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Difficulty</label>
                            <select 
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-white dark:bg-white dark:border-slate-200 dark:text-slate-900"
                                value={formData.difficulty}
                                onChange={(e) => setFormData({...formData, difficulty: e.target.value as MissionDifficulty})}
                            >
                                {Object.values(MissionDifficulty).map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Reward & Tags Section */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Reward Type</label>
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
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {rewardType === 'credits' ? (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Amount</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <Input 
                                            type="number" 
                                            required 
                                            min="0"
                                            className="pl-9"
                                            value={formData.reward}
                                            onChange={(e) => setFormData({...formData, reward: Number(e.target.value)})}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        {rewardType === 'gift_card' ? 'Gift Card Details' : 'Custom Reward'}
                                    </label>
                                    <Input 
                                        required 
                                        value={formData.customReward}
                                        onChange={(e) => setFormData({...formData, customReward: e.target.value})}
                                        placeholder={rewardType === 'gift_card' ? "e.g. $50 Amazon Card" : "e.g. Rare Item, Access Pass"}
                                    />
                                </div>
                            )}
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tags</label>
                                <div className="relative">
                                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <Input 
                                        className="pl-9"
                                        placeholder="Stealth, Magic, Urgent..."
                                        value={formData.tags}
                                        onChange={(e) => setFormData({...formData, tags: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>

            <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-b-xl flex justify-end gap-3">
                <Button variant="secondary" onClick={onClose}>Cancel</Button>
                <Button form="create-mission-form" type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 dark:shadow-none">
                    Distribute Mission
                </Button>
            </div>
        </Card>
    </div>
  );
};
