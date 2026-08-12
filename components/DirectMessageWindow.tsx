
import React, { useState, useEffect, useRef } from 'react';
import { X, Send, User as UserIcon, Phone, Video, MoreVertical, Paperclip, Smile } from 'lucide-react';
import { Contact, ChatMessage } from '../types';
import { Button, Input, Card } from './Shared';
import { 
  fetchPrivateMessagesFromSupabase, 
  postPrivateMessageToSupabase, 
  subscribeToPrivateMessages 
} from '../services/chatService';

interface DirectMessageWindowProps {
  contact: Contact;
  currentUserAvatar: string;
  onClose: () => void;
}

// Simulated automated replies based on contact ID or Role
const GET_AUTOMATED_REPLY = (contact: Contact, text: string): string => {
  const lowerText = text.toLowerCase();
  
  if (contact.id === 'u2') { // Gary (Rival)
    if (lowerText.includes('hello') || lowerText.includes('hi')) return "Oh, it's you. Don't think I'm falling behind on quests.";
    if (lowerText.includes('mission') || lowerText.includes('quest')) return "I already cleared that one. Try to keep up.";
    return "Whatever. Smell ya later.";
  }
  
  if (contact.role === 'Professor') {
    if (lowerText.includes('analysis') || lowerText.includes('help')) return "Interesting query! Have you consulted the ancient archives first?";
    return "I am currently conducting field research. I shall respond shortly.";
  }

  if (contact.role === 'Professional') {
    if (lowerText.includes('trade') || lowerText.includes('buy')) return "I have new wares in stock. Meet me at the marketplace.";
    return "Time is money, friend. Be brief.";
  }

  return "I've received your message. I'll get back to you when I'm back at the Guild Hall.";
};

export const DirectMessageWindow: React.FC<DirectMessageWindowProps> = ({ 
  contact, 
  currentUserAvatar,
  onClose 
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentUserId = 'currentUser'; // Current logged in user ID

  // Load private messages from Supabase or fallback
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const loadPrivateChat = async () => {
      const remoteMsgs = await fetchPrivateMessagesFromSupabase(currentUserId, contact.id);
      if (remoteMsgs && remoteMsgs.length > 0) {
        setMessages(remoteMsgs);
      } else {
        // Initial fallback channel
        setMessages([
          {
            id: 'init-1',
            sender: 'agent', // representing the contact
            text: `Connected with ${contact.name}. Secure channel established.`,
            timestamp: Date.now() - 100000
          }
        ]);
      }

      // Subscribe to real-time incoming private messages
      unsubscribe = subscribeToPrivateMessages(currentUserId, contact.id, (newMsg) => {
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      });
    };

    loadPrivateChat();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [contact]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const textToSend = inputText.trim();
    const newMsg: ChatMessage = {
      id: 'usr_' + Date.now().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, newMsg]);
    setInputText('');
    setIsTyping(true);

    // Save to Supabase private chat table if configured
    await postPrivateMessageToSupabase(currentUserId, 'Operative', contact.id, textToSend);

    // Simulate reply delay from contact
    setTimeout(async () => {
      const replyText = GET_AUTOMATED_REPLY(contact, newMsg.text);
      const replyMsg: ChatMessage = {
        id: 'rep_' + (Date.now() + 1).toString(),
        sender: 'agent',
        text: replyText,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, replyMsg]);
      setIsTyping(false);

      // Save automated reply to Supabase as well
      await postPrivateMessageToSupabase(contact.id, contact.name, currentUserId, replyText);
    }, 1500 + Math.random() * 1000);
  };

  return (
    <Card className="fixed bottom-6 right-24 w-80 md:w-96 h-[450px] flex flex-col shadow-2xl z-[60] border-indigo-200 animate-in slide-in-from-right-10 fade-in duration-300 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="p-3 bg-white border-b border-slate-100 flex justify-between items-center dark:bg-slate-900 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="relative">
             <img src={contact.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${contact.id}`} alt={contact.name} className="w-10 h-10 rounded-full border border-slate-200 bg-slate-100 object-cover" />
             <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900 ${
                contact.status === 'Online' ? 'bg-green-500' : 'bg-slate-400'
             }`}></div>
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">{contact.name}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{contact.profession || contact.role}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-full transition-colors dark:hover:bg-slate-800">
             <Phone size={16} />
          </button>
          <button className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-full transition-colors dark:hover:bg-slate-800">
             <Video size={16} />
          </button>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors dark:hover:bg-red-900/20">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-slate-950">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <img 
               src={(msg.sender === 'user' ? currentUserAvatar : contact.avatarUrl) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.sender}`} 
               className="w-6 h-6 rounded-full self-end mb-1 object-cover"
               alt="Avatar"
            />
            <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
              msg.sender === 'user' 
                ? 'bg-indigo-600 text-white rounded-br-none' 
                : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        
        {isTyping && (
           <div className="flex gap-2">
              <img src={contact.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${contact.id}`} className="w-6 h-6 rounded-full self-end mb-1 object-cover" alt="Avatar" />
              <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none px-3 py-2 shadow-sm dark:bg-slate-900 dark:border-slate-800">
                 <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                 </div>
              </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-white border-t border-slate-100 flex gap-2 items-center dark:bg-slate-900 dark:border-slate-800">
        <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-full dark:hover:bg-slate-800">
           <Paperclip size={18} />
        </button>
        <Input
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={`Message ${contact.name}...`}
          className="flex-1 !py-2 !px-3 text-sm !rounded-full"
        />
        <Button 
          onClick={handleSend} 
          disabled={!inputText.trim()}
          className="!px-3 !rounded-full !w-10 !h-10 !p-0"
        >
          <Send size={16} />
        </Button>
      </div>
    </Card>
  );
};
