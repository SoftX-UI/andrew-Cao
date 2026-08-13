
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User as UserIcon, Loader2, Globe, MapPin, Filter, ChevronDown, Users, Coins, Clock, Database } from 'lucide-react';
import { ChatMessage, User } from '../types';
import { sendMessageToGuild } from '../services/geminiService';
import { Button, Input, Card } from './Shared';
import { isSupabaseConfigured } from '../services/supabaseClient';
import { 
  getInitialChannelMessages, 
  saveChannelMessagesToLocal, 
  fetchChannelMessagesFromSupabase, 
  postMessageToSupabase, 
  subscribeToChannelMessages 
} from '../services/chatService';

type ChatChannel = 'reception' | 'local' | 'global' | 'trade';
type FilterType = 'all' | 'user' | 'agent';

interface GuildChatProps {
    cooldownDuration?: number; // In seconds
    user?: User | null;
}

const MOCK_NAMES = [
  "ShadowWalker", "IronHeart", "Mystic_Jay", "Trader_Sam", "NovaScout", 
  "QuestSeeker", "Warden_Kyra", "Bard_V", "Rogue_Zero"
];

const MOCK_ADVENTURER_REPLIES = [
  "Has anyone seen the notice for the rank B monster?",
  "I'm looking for a party member for the Frostpeaks raid.",
  "Just cashed in my rewards. Drinks on me!",
  "The taxes this month are ridiculous.",
  "Be careful near the West Gate, goblins are active.",
  "LFG Healer/Support. Serious inquiries only.",
  "Can someone verify my proof of completion?"
];

const MOCK_TRADE_REPLIES = [
  "WTS: +5 Iron Sword, DM for price.",
  "Buying: 50 Healing Potions, bulk discount needed.",
  "WTT: Rare gem for high-level armor.",
  "Selling: Map of the Northern Ruins.",
  "Anyone selling mana crystals?",
  "Auction ending soon for the Ancient Scroll!"
];

export const GuildChat: React.FC<GuildChatProps> = ({ cooldownDuration = 30, user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeChannel, setActiveChannel] = useState<ChatChannel>('reception');
  const [senderFilter, setSenderFilter] = useState<FilterType>('all');
  const [showChannelMenu, setShowChannelMenu] = useState(false);
  
  // Cooldown State
  const [lastSentTime, setLastSentTime] = useState(0);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  // Store messages per channel
  const [channels, setChannels] = useState<Record<ChatChannel, ChatMessage[]>>({
    reception: [
      {
        id: 'welcome',
        sender: 'agent',
        senderName: 'Lira (Receptionist)',
        text: "Greetings, Adventurer! I am Lira. How may I assist you with your missions today?",
        timestamp: Date.now()
      }
    ],
    local: [
      {
        id: 'loc-1',
        sender: 'agent',
        senderName: 'System',
        text: "[System] You have entered the Local Area Network.",
        timestamp: Date.now() - 50000
      },
      {
        id: 'loc-2',
        sender: 'agent',
        senderName: 'IronHeart',
        text: "Anyone heading to the market later?",
        timestamp: Date.now() - 20000
      }
    ],
    global: [
      {
        id: 'glob-1',
        sender: 'agent',
        senderName: 'System',
        text: "[System] Connected to Cross-City Relay.",
        timestamp: Date.now() - 100000
      }
    ],
    trade: [
      {
        id: 'trade-1',
        sender: 'agent',
        senderName: 'System',
        text: "[System] Trade Channel Open. Scamming is a bannable offense.",
        timestamp: Date.now() - 120000
      }
    ]
  });

  // Load from local storage or Supabase on mount/channel change
  useEffect(() => {
    // 1. Try local cache
    const cached = getInitialChannelMessages(activeChannel);
    if (cached.length > 0) {
      setChannels(prev => ({
        ...prev,
        [activeChannel]: cached
      }));
    }

    // 2. Fetch from Supabase if configured
    if (isSupabaseConfigured) {
      fetchChannelMessagesFromSupabase(activeChannel).then((remoteMsgs) => {
        if (remoteMsgs && remoteMsgs.length > 0) {
          setChannels(prev => ({
            ...prev,
            [activeChannel]: remoteMsgs
          }));
        }
      });

      // 3. Subscribe to real-time additions
      const unsubscribe = subscribeToChannelMessages(activeChannel, (newMsg) => {
        setChannels(prev => {
          const currentList = prev[activeChannel] || [];
          if (currentList.some(m => m.id === newMsg.id)) return prev;
          const updated = [...currentList, newMsg];
          saveChannelMessagesToLocal(activeChannel, updated);
          return {
            ...prev,
            [activeChannel]: updated
          };
        });
      });

      return () => {
        unsubscribe();
      };
    }
  }, [activeChannel]);

  // Persist locally whenever channels change
  useEffect(() => {
    Object.keys(channels).forEach(ch => {
      saveChannelMessagesToLocal(ch, channels[ch as ChatChannel]);
    });
  }, [channels]);

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [channels, isOpen, activeChannel, senderFilter]);

  // Cooldown Timer
  useEffect(() => {
    let interval: number;
    if (cooldownRemaining > 0) {
      interval = window.setInterval(() => {
        setCooldownRemaining((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [cooldownRemaining]);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    
    // Check cooldown
    if (cooldownRemaining > 0) return;

    // Set cooldown logic
    if (cooldownDuration > 0 && activeChannel !== 'reception') { // Reception is AI, maybe no cooldown needed? Or keep consistent.
       // Let's enforce it globally as requested "time limited on all account"
       setLastSentTime(Date.now());
       setCooldownRemaining(cooldownDuration);
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputText,
      timestamp: Date.now()
    };

    // Add user message to current channel
    setChannels(prev => ({
      ...prev,
      [activeChannel]: [...prev[activeChannel], userMsg]
    }));
    
    // Post user message to Supabase
    postMessageToSupabase(activeChannel, userMsg);
    
    setInputText('');
    setIsTyping(true);

    try {
      if (activeChannel === 'reception') {
          // AI Logic for Reception
          const aiMsgId = (Date.now() + 1).toString();
          
          // Add placeholder AI message
          setChannels(prev => ({
              ...prev,
              reception: [...prev.reception, {
                  id: aiMsgId,
                  sender: 'agent',
                  senderName: 'Lira (Receptionist)',
                  text: '...',
                  timestamp: Date.now(),
                  isTyping: true
              }]
          }));

          const history = channels.reception.slice(-8).map(msg => ({
              role: msg.sender === 'user' ? 'user' as const : 'model' as const,
              parts: [{ text: msg.text }]
          }));

          const userProfile = user ? {
            name: user.name,
            level: user.level,
            rank: user.rank
          } : undefined;

          const replyText = await sendMessageToGuild(userMsg.text, activeChannel, history, userProfile);

          if (replyText) {
              setChannels(prev => ({
                  ...prev,
                  reception: prev.reception.map(msg => 
                      msg.id === aiMsgId 
                      ? { ...msg, text: replyText, isTyping: false } 
                      : msg
                  )
              }));
              postMessageToSupabase(activeChannel, {
                  id: aiMsgId,
                  sender: 'agent',
                  senderName: 'Lira (Receptionist)',
                  text: replyText,
                  timestamp: Date.now()
              });
          } else {
              const fallbackText = "I apologize, the mana lines seem disrupted.";
              setChannels(prev => ({
                  ...prev,
                  reception: prev.reception.map(msg => 
                      msg.id === aiMsgId 
                      ? { ...msg, text: fallbackText, isTyping: false } 
                      : msg
                  )
              }));
              postMessageToSupabase(activeChannel, {
                  id: aiMsgId,
                  sender: 'agent',
                  senderName: 'Lira (Receptionist)',
                  text: fallbackText,
                  timestamp: Date.now()
              });
          }
      } else {
          // Mock Logic for Local/Global/Trade (Simulate other users)
          setTimeout(() => {
              const replyPool = activeChannel === 'trade' ? MOCK_TRADE_REPLIES : MOCK_ADVENTURER_REPLIES;
              const randomReply = replyPool[Math.floor(Math.random() * replyPool.length)];
              const randomName = MOCK_NAMES[Math.floor(Math.random() * MOCK_NAMES.length)];
              
              const otherUserMsg: ChatMessage = {
                  id: (Date.now() + 1).toString(),
                  sender: 'agent',
                  senderName: randomName,
                  text: randomReply,
                  timestamp: Date.now()
              };

              setChannels(prev => ({
                  ...prev,
                  [activeChannel]: [...prev[activeChannel], otherUserMsg]
              }));
              postMessageToSupabase(activeChannel, otherUserMsg);
              setIsTyping(false);
          }, 1500);
      }
    } finally {
      if (activeChannel === 'reception') {
        setIsTyping(false);
      }
    }
    
    if (activeChannel !== 'reception') {
        setIsTyping(false); // Immediate visual stop for non-streaming
    }
  };

  const cycleFilter = () => {
    if (senderFilter === 'all') setSenderFilter('user');
    else if (senderFilter === 'user') setSenderFilter('agent');
    else setSenderFilter('all');
  };

  const getFilteredMessages = () => {
    const msgs = channels[activeChannel];
    if (senderFilter === 'all') return msgs;
    return msgs.filter(m => m.sender === senderFilter);
  };

  const CHANNEL_CONFIG = {
    reception: { icon: Bot, label: 'Reception (AI)', color: 'bg-guild-600' },
    local: { icon: MapPin, label: 'Local Area', color: 'bg-emerald-600' },
    global: { icon: Globe, label: 'Cross City', color: 'bg-indigo-600' },
    trade: { icon: Coins, label: 'Trade Channel', color: 'bg-amber-600' },
  };

  const ActiveIcon = CHANNEL_CONFIG[activeChannel].icon;

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-guild-600 hover:bg-guild-700 text-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-105 z-50 dark:shadow-slate-900/50"
        >
          <MessageSquare size={24} />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[10px] items-center justify-center text-white">1</span>
          </span>
        </button>
      )}

      {/* Chat Window Panel */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-96 h-[550px] flex flex-col shadow-2xl z-50 border-guild-200 animate-in slide-in-from-bottom-5 fade-in duration-300 dark:border-slate-700 overflow-visible">
          
          {/* Header */}
          <div className={`p-3 text-white rounded-t-xl flex flex-col gap-2 transition-colors duration-300 ${CHANNEL_CONFIG[activeChannel].color}`}>
            <div className="flex justify-between items-center">
                <div className="relative">
                    <button 
                        onClick={() => setShowChannelMenu(!showChannelMenu)}
                        className="flex items-center gap-2 hover:bg-white/20 px-2 py-1 rounded-lg transition-colors"
                    >
                        <div className="p-1 bg-white/20 rounded-full">
                            <ActiveIcon size={16} />
                        </div>
                        <span className="font-bold text-sm">{CHANNEL_CONFIG[activeChannel].label}</span>
                        <ChevronDown size={14} className={`transition-transform ${showChannelMenu ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Channel Dropdown */}
                    {showChannelMenu && (
                        <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-[60] text-slate-800 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-200">
                            {(Object.keys(CHANNEL_CONFIG) as ChatChannel[]).map((key) => {
                                const ChannelIcon = CHANNEL_CONFIG[key].icon;
                                return (
                                    <button
                                        key={key}
                                        onClick={() => {
                                            setActiveChannel(key);
                                            setShowChannelMenu(false);
                                        }}
                                        className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 ${activeChannel === key ? 'bg-slate-100 dark:bg-slate-700 font-semibold' : ''}`}
                                    >
                                        <ChannelIcon size={16} className={
                                            key === 'reception' ? 'text-guild-500' : 
                                            key === 'local' ? 'text-emerald-500' : 
                                            key === 'global' ? 'text-indigo-500' : 'text-amber-500'
                                        } />
                                        {CHANNEL_CONFIG[key].label}
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>
                
                <div className="flex gap-1">
                    <button 
                        onClick={cycleFilter}
                        className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium border ${
                            senderFilter !== 'all' ? 'bg-white text-guild-600 border-white' : 'bg-white/10 text-white border-transparent hover:bg-white/20'
                        }`}
                        title="Filter messages"
                    >
                        <Filter size={14} />
                        {senderFilter === 'all' ? 'All' : senderFilter === 'user' ? 'Me' : 'Others'}
                    </button>
                    <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1.5 rounded-lg transition-colors">
                        <X size={18} />
                    </button>
                </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950 relative">
            {/* Background Watermark/Icon based on channel */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                <ActiveIcon size={120} />
            </div>

            {getFilteredMessages().length === 0 ? (
                <div className="text-center text-slate-400 text-sm mt-10 italic">
                    No messages match your filter.
                </div>
            ) : (
                getFilteredMessages().map((msg) => (
                <div
                    key={msg.id}
                    className={`flex gap-3 relative z-10 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
                >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border shadow-sm ${
                    msg.sender === 'user' 
                        ? 'bg-slate-200 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700' 
                        : activeChannel === 'reception'
                        ? 'bg-guild-100 text-guild-600 border-guild-200 dark:bg-guild-900/30 dark:text-guild-400 dark:border-guild-800'
                        : 'bg-white text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                    }`}>
                        {msg.sender === 'user' ? <UserIcon size={14} /> : activeChannel === 'reception' ? <Bot size={14} /> : <Users size={14} />}
                    </div>
                    
                    <div className={`flex flex-col max-w-[80%] ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                        {/* Name Label */}
                        {msg.sender === 'agent' && (
                             <span className="text-[10px] text-slate-400 ml-1 mb-0.5 font-medium">{msg.senderName || 'Unknown'}</span>
                        )}
                        <div className={`rounded-2xl p-3 text-sm shadow-sm ${
                        msg.sender === 'user' 
                            ? 'bg-guild-600 text-white rounded-tr-none' 
                            : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200'
                        }`}>
                            {msg.text || (msg.isTyping && <Loader2 className="animate-spin" size={16} />)}
                        </div>
                    </div>
                </div>
                ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-slate-100 rounded-b-xl flex gap-2 dark:bg-slate-900 dark:border-slate-800">
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={activeChannel === 'reception' ? "Ask Lira anything..." : `Message ${CHANNEL_CONFIG[activeChannel].label}...`}
              className="flex-1 !py-2 !px-3 text-sm"
              disabled={(activeChannel === 'reception' && isTyping) || cooldownRemaining > 0}
            />
            <Button 
              onClick={handleSend} 
              disabled={(activeChannel === 'reception' && isTyping) || !inputText.trim() || cooldownRemaining > 0}
              className={`!px-3 min-w-[3rem] transition-all duration-200 ${
                activeChannel === 'local' ? '!bg-emerald-600' : 
                activeChannel === 'global' ? '!bg-indigo-600' : 
                activeChannel === 'trade' ? '!bg-amber-600' : ''
              } ${cooldownRemaining > 0 ? 'opacity-70 cursor-not-allowed !bg-slate-500' : ''}`}
              title={cooldownRemaining > 0 ? `Wait ${cooldownRemaining}s` : 'Send'}
            >
              {cooldownRemaining > 0 ? (
                 <span className="font-mono text-xs">{cooldownRemaining}</span>
              ) : (
                 <Send size={18} />
              )}
            </Button>
          </div>
        </Card>
      )}
    </>
  );
};
