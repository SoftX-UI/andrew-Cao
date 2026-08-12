import { getSupabase, isSupabaseConfigured } from './supabaseClient';
import { ChatMessage } from '../types';

export interface SupabaseChatMessage {
  id: string;
  channel: string;
  sender: 'user' | 'agent';
  sender_name?: string;
  text: string;
  created_at: string;
  recipient_id?: string;
}

export interface SupabasePrivateMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  recipient_id: string;
  recipient_name?: string;
  text: string;
  created_at: string;
}

const LOCAL_STORAGE_CHAT_KEY = 'nexus_nova_chat_messages_v1';

export const getInitialChannelMessages = (channel: string): ChatMessage[] => {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_CHAT_KEY}_${channel}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error loading chat from local storage:', e);
  }
  return [];
};

export const saveChannelMessagesToLocal = (channel: string, messages: ChatMessage[]) => {
  try {
    localStorage.setItem(`${LOCAL_STORAGE_CHAT_KEY}_${channel}`, JSON.stringify(messages));
  } catch (e) {
    console.error('Error saving chat to local storage:', e);
  }
};

// PUBLIC CHAT SERVICES
export const fetchChannelMessagesFromSupabase = async (channel: string): Promise<ChatMessage[]> => {
  const supabase = getSupabase();
  if (!supabase) return [];

  try {
    // Attempt query on public_chat_messages first, fallback to chat_messages
    let response = await supabase
      .from('public_chat_messages')
      .select('*')
      .eq('channel', channel)
      .order('created_at', { ascending: true })
      .limit(100);

    if (response.error && response.error.code === '42P01') {
      // Fallback if public_chat_messages doesn't exist yet
      response = await supabase
        .from('chat_messages')
        .select('*')
        .eq('channel', channel)
        .order('created_at', { ascending: true })
        .limit(100);
    }

    if (response.error) {
      console.warn('Supabase public chat fetch notice:', response.error.message);
      return [];
    }

    if (response.data) {
      return response.data.map((item: any) => ({
        id: item.id,
        sender: item.sender,
        senderName: item.sender_name,
        text: item.text,
        timestamp: new Date(item.created_at).getTime()
      }));
    }
  } catch (err) {
    console.error('Supabase query exception:', err);
  }
  return [];
};

export const postMessageToSupabase = async (
  channel: string,
  message: ChatMessage,
  recipientId?: string
): Promise<boolean> => {
  const supabase = getSupabase();
  if (!supabase) return false;

  const payload = {
    id: message.id,
    channel,
    sender: message.sender,
    sender_name: message.senderName || 'Agent',
    text: message.text,
    created_at: new Date(message.timestamp || Date.now()).toISOString(),
    recipient_id: recipientId
  };

  try {
    let { error } = await supabase.from('public_chat_messages').insert(payload);

    if (error && error.code === '42P01') {
      // Fallback table name
      const fallback = await supabase.from('chat_messages').insert(payload);
      error = fallback.error;
    }

    if (error) {
      console.warn('Supabase post notice:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase post exception:', err);
    return false;
  }
};

export const subscribeToChannelMessages = (
  channel: string,
  onNewMessage: (msg: ChatMessage) => void
) => {
  const supabase = getSupabase();
  if (!supabase) return () => {};

  try {
    const subscription = supabase
      .channel(`public_chat_${channel}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'public_chat_messages', filter: `channel=eq.${channel}` },
        (payload) => {
          const newRow = payload.new as any;
          if (newRow) {
            onNewMessage({
              id: newRow.id,
              sender: newRow.sender,
              senderName: newRow.sender_name,
              text: newRow.text,
              timestamp: new Date(newRow.created_at).getTime()
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  } catch (err) {
    console.error('Supabase subscription error:', err);
    return () => {};
  }
};

// PRIVATE CHAT SERVICES (1-on-1 User Direct Messages)
export const fetchPrivateMessagesFromSupabase = async (
  user1Id: string,
  user2Id: string
): Promise<ChatMessage[]> => {
  const supabase = getSupabase();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('private_chat_messages')
      .select('*')
      .or(`and(sender_id.eq.${user1Id},recipient_id.eq.${user2Id}),and(sender_id.eq.${user2Id},recipient_id.eq.${user1Id})`)
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) {
      console.warn('Supabase private chat fetch notice:', error.message);
      return [];
    }

    if (data) {
      return data.map((item: SupabasePrivateMessage) => ({
        id: item.id,
        sender: item.sender_id === user1Id ? 'user' : 'agent',
        senderName: item.sender_name,
        text: item.text,
        timestamp: new Date(item.created_at).getTime()
      }));
    }
  } catch (err) {
    console.error('Supabase private query exception:', err);
  }
  return [];
};

export const postPrivateMessageToSupabase = async (
  senderId: string,
  senderName: string,
  recipientId: string,
  text: string
): Promise<boolean> => {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('private_chat_messages').insert({
      id: 'pm_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      sender_id: senderId,
      sender_name: senderName,
      recipient_id: recipientId,
      text: text,
      created_at: new Date().toISOString()
    });

    if (error) {
      console.warn('Supabase post private message notice:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase post private message exception:', err);
    return false;
  }
};

export const subscribeToPrivateMessages = (
  user1Id: string,
  user2Id: string,
  onNewMessage: (msg: ChatMessage) => void
) => {
  const supabase = getSupabase();
  if (!supabase) return () => {};

  try {
    const subscription = supabase
      .channel(`private_chat_${user1Id}_${user2Id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'private_chat_messages' },
        (payload) => {
          const newRow = payload.new as SupabasePrivateMessage;
          if (
            newRow &&
            ((newRow.sender_id === user1Id && newRow.recipient_id === user2Id) ||
             (newRow.sender_id === user2Id && newRow.recipient_id === user1Id))
          ) {
            onNewMessage({
              id: newRow.id,
              sender: newRow.sender_id === user1Id ? 'user' : 'agent',
              senderName: newRow.sender_name,
              text: newRow.text,
              timestamp: new Date(newRow.created_at).getTime()
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  } catch (err) {
    console.error('Supabase private subscription error:', err);
    return () => {};
  }
};

