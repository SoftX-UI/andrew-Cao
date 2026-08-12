
import React from 'react';
import { MapPin, Calendar, Clock, Tag, ChevronRight, Briefcase, CheckCircle2, Bookmark } from 'lucide-react';
import { Mission, User, MissionStatus } from '../types';
import { Card, Badge, Button } from './Shared';
import { TYPE_COLORS, TYPE_ICONS, STATUS_COLORS, DIFFICULTY_COLORS, ISSUERS } from '../constants';

interface MissionCardProps {
  mission: Mission;
  user: User;
  onSelect: (id: string) => void;
  onCompareToggle?: (id: string, selected: boolean) => void;
  isSelectedForCompare?: boolean;
  customStatusColors?: Record<string, string>;
  onQuickAccept?: (id: string) => void;
  onViewIssuer?: (id: string) => void;
}

export const MissionCard: React.FC<MissionCardProps> = ({ 
  mission, 
  user, 
  onSelect,
  onCompareToggle,
  isSelectedForCompare,
  customStatusColors = {},
  onQuickAccept,
  onViewIssuer
}) => {

  const calculateTimeLeft = () => {
    const expiry = new Date(mission.expiryDate);
    const now = new Date();
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d remaining`;
    return `${hours}h remaining`;
  };

  const timeLeft = calculateTimeLeft();
  const issuerName = ISSUERS[mission.issuerId] || 'Unknown Client';
  const isAssignee = user?.id === mission.assigneeId;

  return (
    <Card 
      className={`relative flex flex-col h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer group ${isSelectedForCompare ? 'ring-2 ring-indigo-500' : ''}`}
    >
      <div onClick={() => onSelect(mission.id)} className="flex-1 p-5">
        <div className="flex justify-between items-start mb-3">
          <div className="flex gap-2">
             <Badge 
               className={!customStatusColors[mission.status] ? STATUS_COLORS[mission.status] : ''}
               style={customStatusColors[mission.status] ? {
                  backgroundColor: `${customStatusColors[mission.status]}26`,
                  color: customStatusColors[mission.status],
                  borderColor: `${customStatusColors[mission.status]}4D`,
                  borderWidth: '1px',
                  borderStyle: 'solid'
               } : undefined}
             >
               {mission.status}
             </Badge>
             <Badge className={DIFFICULTY_COLORS[mission.difficulty]}>{mission.difficulty}</Badge>
          </div>
          {onCompareToggle && (
             <div onClick={(e) => e.stopPropagation()}>
               <input 
                 type="checkbox" 
                 checked={isSelectedForCompare}
                 onChange={(e) => onCompareToggle(mission.id, e.target.checked)}
                 className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                 title="Compare"
               />
             </div>
          )}
        </div>

        <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-1 line-clamp-2 leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {mission.title}
        </h3>
        
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-4" onClick={(e) => e.stopPropagation()}>
           <Briefcase size={12} />
           <button onClick={() => onViewIssuer && onViewIssuer(mission.issuerId)} className="hover:underline hover:text-indigo-500">
              {issuerName}
           </button>
        </div>

        <div className="flex flex-wrap items-center text-sm text-slate-500 mb-4 gap-y-2 gap-x-4 dark:text-slate-400">
          <div className="flex items-center gap-1.5" title="Type">
            <Badge className={`${TYPE_COLORS[mission.type] || 'bg-slate-100 text-slate-700'} border flex items-center gap-1`}>
                {TYPE_ICONS[mission.type] || '📋'} {mission.type}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5" title="Location">
            <MapPin size={14} className="text-slate-400 dark:text-slate-500" />
            <span className="truncate max-w-[120px]">{mission.isRemote ? 'Remote' : mission.location}</span>
          </div>
          <div className="flex items-center gap-1.5" title="Date Distributed">
            <Calendar size={14} className="text-slate-400 dark:text-slate-500" />
            <span>{new Date(mission.postedDate).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-1.5" title="Time Remaining">
            <Clock size={14} className="text-slate-400 dark:text-slate-500" />
            <span className={mission.status === MissionStatus.Urgent ? 'text-red-600 font-bold dark:text-red-400' : ''}>{timeLeft}</span>
          </div>
        </div>

        <p className="text-slate-600 text-sm mb-4 line-clamp-3 bg-slate-50/50 p-2 rounded-lg border border-slate-100/50 dark:bg-slate-800/30 dark:border-slate-800 dark:text-slate-300">
          {mission.description}
        </p>

        {/* Tags Display */}
        {mission.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4 items-center" role="group" aria-label="Mission tags">
            <Tag size={14} className="text-slate-400 mr-1 shrink-0" aria-hidden="true" />
            {mission.tags.slice(0, 3).map(tag => (
              <Badge key={tag} className="text-[10px] font-medium px-2 py-1 bg-white text-slate-700 border border-slate-200 shadow-sm dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 transition-colors">
                {tag}
              </Badge>
            ))}
            {mission.tags.length > 3 && (
                <span 
                  className="text-[10px] text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 cursor-help"
                  title={mission.tags.slice(3).join(', ')}
                  aria-label={`${mission.tags.length - 3} more tags`}
                >
                  +{mission.tags.length - 3}
                </span>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-auto border-t border-slate-100 bg-slate-50/50 p-4 rounded-b-xl flex items-center justify-between dark:border-slate-800 dark:bg-slate-900/50" onClick={(e) => e.stopPropagation()}>
         <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Reward</p>
            <p className="font-bold text-guild-600 dark:text-guild-400">{mission.reward} Credits</p>
         </div>
         
         <div className="flex gap-2">
            {mission.status === MissionStatus.Open && onQuickAccept && !isAssignee && user?.id !== mission.issuerId && (
                <Button 
                    variant="ghost" 
                    className="!p-2 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/20"
                    onClick={() => onQuickAccept(mission.id)}
                    title="Quick Accept"
                >
                    <Bookmark size={18} />
                </Button>
            )}
            {mission.status === MissionStatus.InProgress && isAssignee && (
                <Button 
                    className="!p-2 !px-3 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-900/50 dark:hover:bg-blue-900/50"
                    onClick={() => onSelect(mission.id)}
                    title="Complete & Verify"
                >
                    <CheckCircle2 size={16} /> Complete
                </Button>
            )}
            <Button 
                variant="secondary" 
                className="!py-1.5 !px-3 text-xs group-hover:bg-guild-600 group-hover:text-white group-hover:border-guild-600 transition-colors"
                onClick={() => onSelect(mission.id)}
            >
                Details <ChevronRight size={14} />
            </Button>
         </div>
      </div>
      
      {isAssignee && (
          <div className="absolute top-0 right-0 p-2">
              <div className="bg-green-500 text-white p-1 rounded-full shadow-md" title="Assigned to You">
                  <CheckCircle2 size={16} />
              </div>
          </div>
      )}
    </Card>
  );
};
