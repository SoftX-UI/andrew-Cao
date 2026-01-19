import React, { useState } from 'react';
import { MailMessage, Contact } from '../types';
import { Card, Badge, Button, Input } from './Shared';
import { 
    Inbox, Trash2, RotateCcw, XCircle, Send, Plus, 
    AlertCircle, Briefcase, User, Shield, Star, Reply, 
    Archive, MoreVertical, Paperclip, X
} from 'lucide-react';

interface MailboxPanelProps {
  mail: MailMessage[];
  contacts: Contact[];
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
  onRestore: (id: string) => void;
  onPermanentDelete: (id: string) => void;
  onViewMission: (id: string) => void;
  onReply: (id: string) => void;
  onSendMail: (recipientId: string, subject: string, body: string) => void;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
    system: <Shield size={16} />,
    mission: <Briefcase size={16} />,
    personal: <User size={16} />,
    guild: <Star size={16} />
};

export const MailboxPanel: React.FC<MailboxPanelProps> = ({
    mail,
    contacts,
    onMarkRead,
    onDelete,
    onRestore,
    onPermanentDelete,
    onViewMission,
    onReply,
    onSendMail
}) => {
    const [filter, setFilter] = useState<'inbox' | 'trash'>('inbox');
    const [selectedMailId, setSelectedMailId] = useState<string | null>(null);
    const [isComposing, setIsComposing] = useState(false);
    
    // Composition state
    const [recipientId, setRecipientId] = useState('');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');

    const filteredMail = mail.filter(m => {
        if (filter === 'trash') return m.isDeleted;
        return !m.isDeleted;
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const selectedMail = mail.find(m => m.id === selectedMailId);

    const handleSelect = (m: MailMessage) => {
        setSelectedMailId(m.id);
        if (!m.isRead) {
            onMarkRead(m.id);
        }
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        onDelete(id);
        if (selectedMailId === id) setSelectedMailId(null);
    };

    const handleRestore = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        onRestore(id);
        if (selectedMailId === id) setSelectedMailId(null);
    };

    const handlePermanentDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        onPermanentDelete(id);
        if (selectedMailId === id) setSelectedMailId(null);
    };

    const handleSend = () => {
        if (!recipientId || !subject || !body) return;
        onSendMail(recipientId, subject, body);
        setIsComposing(false);
        setRecipientId('');
        setSubject('');
        setBody('');
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] gap-4">
            <div className="flex justify-between items-center">
                <div className="flex gap-2 bg-slate-100 p-1 rounded-lg dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <button 
                        onClick={() => { setFilter('inbox'); setSelectedMailId(null); }}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                            filter === 'inbox' 
                            ? 'bg-white shadow-sm text-indigo-600 dark:bg-slate-800 dark:text-indigo-400' 
                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                        }`}
                    >
                        <Inbox size={16} /> Inbox
                    </button>
                    <button 
                        onClick={() => { setFilter('trash'); setSelectedMailId(null); }}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                            filter === 'trash' 
                            ? 'bg-white shadow-sm text-red-600 dark:bg-slate-800 dark:text-red-400' 
                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                        }`}
                    >
                        <Trash2 size={16} /> Trash
                    </button>
                </div>
                <Button onClick={() => setIsComposing(true)} className="gap-2">
                    <Plus size={18} /> Compose
                </Button>
            </div>

            <div className="flex-1 flex gap-6 min-h-0">
                {/* Mail List */}
                <Card className="w-full md:w-1/3 flex flex-col p-0 overflow-hidden bg-white dark:bg-slate-900/50">
                    <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            {filter === 'trash' ? 'Trash Bin' : 'Inbox'} ({filteredMail.length})
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {filteredMail.length === 0 ? (
                            <div className="text-center py-10 text-slate-400 text-sm">
                                {filter === 'trash' ? 'Trash is empty.' : 'No messages found.'}
                            </div>
                        ) : (
                            filteredMail.map(m => (
                                <div 
                                    key={m.id}
                                    onClick={() => handleSelect(m)}
                                    className={`group p-3 rounded-lg border cursor-pointer transition-all relative ${
                                        selectedMailId === m.id 
                                        ? 'bg-white border-indigo-500 shadow-md dark:bg-slate-800 dark:border-indigo-500' 
                                        : `bg-white border-slate-200 hover:border-indigo-300 dark:bg-slate-800 dark:border-slate-700 ${!m.isRead && !m.isDeleted ? 'border-l-4 border-l-indigo-500' : ''}`
                                    } ${m.isDeleted ? 'opacity-70 grayscale' : ''}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex items-center gap-2">
                                            {TYPE_ICONS[m.type] || <Inbox size={16}/>}
                                            <span className={`text-sm font-bold ${!m.isRead && !m.isDeleted ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                                                {m.senderName}
                                            </span>
                                        </div>
                                        <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                            {new Date(m.timestamp).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className={`text-xs truncate mb-2 ${!m.isRead && !m.isDeleted ? 'font-medium text-slate-800 dark:text-slate-200' : 'text-slate-500'}`}>
                                        {m.subject}
                                    </p>
                                    <div className="flex justify-between items-center">
                                        <Badge className={`text-[10px] px-1.5 py-0 ${m.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500 dark:bg-slate-900'}`}>
                                            {m.type}
                                        </Badge>
                                        
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {m.isDeleted ? (
                                                <>
                                                    <button 
                                                        onClick={(e) => handleRestore(e, m.id)}
                                                        className="text-slate-300 hover:text-green-500 p-1"
                                                        title="Restore"
                                                    >
                                                        <RotateCcw size={14} />
                                                    </button>
                                                    <button 
                                                        onClick={(e) => handlePermanentDelete(e, m.id)}
                                                        className="text-slate-300 hover:text-red-500 p-1"
                                                        title="Delete Forever"
                                                    >
                                                        <XCircle size={14} />
                                                    </button>
                                                </>
                                            ) : (
                                                <button 
                                                    onClick={(e) => handleDelete(e, m.id)}
                                                    className="text-slate-300 hover:text-red-500 p-1"
                                                    title="Move to Trash"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </Card>

                {/* Mail Content */}
                <Card className="flex-1 p-0 overflow-hidden flex flex-col bg-white dark:bg-slate-900/50">
                    {selectedMail ? (
                        <div className="flex flex-col h-full animate-in fade-in duration-200">
                            {/* Header */}
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                                <div className="flex justify-between items-start mb-4">
                                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{selectedMail.subject}</h2>
                                    <div className="flex gap-2">
                                        {!selectedMail.isDeleted && (
                                            <>
                                                <Button variant="secondary" className="!p-2 h-auto text-xs" onClick={() => onReply(selectedMail.id)}>
                                                    <Reply size={14} className="mr-1" /> Reply
                                                </Button>
                                                <Button variant="danger" className="!p-2 h-auto text-xs" onClick={(e) => handleDelete(e, selectedMail.id)}>
                                                    <Trash2 size={14} />
                                                </Button>
                                            </>
                                        )}
                                        {selectedMail.isDeleted && (
                                            <Button variant="ghost" className="!p-2 h-auto text-xs" onClick={(e) => handlePermanentDelete(e, selectedMail.id)}>
                                                Delete Forever
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 border border-slate-200 dark:border-slate-700">
                                        {TYPE_ICONS[selectedMail.type] || <User size={20} />}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-slate-700 dark:text-slate-300">
                                            {selectedMail.senderName} 
                                            {selectedMail.senderRole && <span className="text-xs font-normal text-slate-400 ml-1">({selectedMail.senderRole})</span>}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            to me • {new Date(selectedMail.timestamp).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Body */}
                            <div className="flex-1 p-6 overflow-y-auto">
                                <div className="prose prose-sm dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                                    {selectedMail.content}
                                </div>

                                {selectedMail.relatedMissionId && (
                                    <div className="mt-8 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Briefcase className="text-indigo-600 dark:text-indigo-400" size={16} />
                                            <span className="font-bold text-indigo-700 dark:text-indigo-300 text-sm">Related Mission</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-mono text-slate-600 dark:text-slate-400">ID: {selectedMail.relatedMissionId}</span>
                                            <Button onClick={() => onViewMission(selectedMail.relatedMissionId!)} className="!py-1 !px-3 !text-xs">
                                                View Mission Details
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                <Inbox size={40} className="opacity-20" />
                            </div>
                            <p>Select a message to read</p>
                        </div>
                    )}
                </Card>
            </div>

            {/* Compose Modal */}
            {isComposing && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-lg p-0 overflow-hidden flex flex-col h-[600px] shadow-2xl">
                        <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
                            <h3 className="font-bold">New Message</h3>
                            <button onClick={() => setIsComposing(false)} className="text-slate-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex-1 flex flex-col p-4 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">To</label>
                                <select 
                                    className="w-full p-2 rounded-lg border border-slate-200 bg-white text-sm"
                                    value={recipientId}
                                    onChange={(e) => setRecipientId(e.target.value)}
                                >
                                    <option value="" disabled>Select Recipient</option>
                                    <option value="admin">System Admin</option>
                                    {contacts.map(c => (
                                        <option key={c.id} value={c.id}>{c.name} ({c.role})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Subject</label>
                                <Input 
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="Enter subject..."
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Message</label>
                                <textarea 
                                    className="w-full h-full p-3 rounded-lg border border-slate-200 resize-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm"
                                    placeholder="Type your message..."
                                    value={body}
                                    onChange={(e) => setBody(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="p-4 border-t border-slate-100 flex justify-between items-center">
                            <div className="flex gap-2">
                                <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-full">
                                    <Paperclip size={18} />
                                </button>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="secondary" onClick={() => setIsComposing(false)}>Discard</Button>
                                <Button onClick={handleSend} disabled={!recipientId || !subject || !body} className="gap-2">
                                    <Send size={16} /> Send
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};
