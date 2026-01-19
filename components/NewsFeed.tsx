
import React, { useState } from 'react';
import { NewsItem } from '../types';
import { Card, Button } from './Shared';
import { Bell, Info, Zap, Calendar, AlertTriangle, X, ChevronRight, Newspaper } from 'lucide-react';

interface NewsFeedProps {
  news: NewsItem[];
}

const TYPE_ICONS = {
  notice: <Info size={16} />,
  update: <Zap size={16} />,
  event: <Calendar size={16} />,
  maintenance: <AlertTriangle size={16} />
};

const TYPE_STYLES = {
  notice: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-700 dark:text-blue-400',
    iconBg: 'bg-blue-100 dark:bg-blue-900/40'
  },
  update: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    text: 'text-purple-700 dark:text-purple-400',
    iconBg: 'bg-purple-100 dark:bg-purple-900/40'
  },
  event: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    text: 'text-green-700 dark:text-green-400',
    iconBg: 'bg-green-100 dark:bg-green-900/40'
  },
  maintenance: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    text: 'text-amber-700 dark:text-amber-400',
    iconBg: 'bg-amber-100 dark:bg-amber-900/40'
  }
};

export const NewsFeed: React.FC<NewsFeedProps> = ({ news }) => {
  const [items, setItems] = useState(news);

  const handleDismiss = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  return (
    <Card className="h-full max-h-[calc(100vh-140px)] flex flex-col bg-white/80 backdrop-blur-sm border-guild-200 dark:bg-slate-900/80 dark:border-slate-800 overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-guild-50/50 dark:bg-slate-800 dark:border-slate-700">
        <div className="flex items-center gap-2">
            <Bell className="text-guild-600 dark:text-guild-400" size={18} />
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Guild Notices</h3>
        </div>
        <span className="text-[10px] font-bold bg-guild-200 text-guild-800 px-2 py-0.5 rounded-full dark:bg-guild-900 dark:text-guild-300">
            {items.length}
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400 text-center p-4">
                <Newspaper size={32} className="mb-2 opacity-50" />
                <p className="text-xs">No new notices.</p>
                <p className="text-[10px]">Check back later for guild updates.</p>
            </div>
        ) : (
            items.map(item => {
                const style = TYPE_STYLES[item.type] || TYPE_STYLES.notice;
                return (
                  <div key={item.id} className="group relative p-3 rounded-xl border border-slate-100 bg-white shadow-sm hover:shadow-md hover:border-guild-200 transition-all dark:bg-slate-800 dark:border-slate-700 dark:hover:border-slate-600">
                    <button 
                        onClick={() => handleDismiss(item.id)}
                        className="absolute top-2 right-2 p-1 text-slate-300 hover:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity dark:hover:text-slate-200 z-10"
                        title="Dismiss"
                    >
                        <X size={14} />
                    </button>
                    
                    <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg shrink-0 ${style.iconBg} ${style.text}`}>
                            {TYPE_ICONS[item.type]}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 mb-0.5 pr-4 leading-tight">{item.title}</h4>
                            <p className="text-[10px] text-slate-400 mb-2">{new Date(item.date).toLocaleDateString()}</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                {item.content}
                            </p>
                        </div>
                    </div>
                  </div>
                );
            })
        )}
      </div>
      
      <div className="p-2 border-t border-slate-100 bg-slate-50 dark:bg-slate-900 dark:border-slate-800">
         <Button variant="ghost" className="w-full text-xs h-8">View All Archives <ChevronRight size={12}/></Button>
      </div>
    </Card>
  );
};
