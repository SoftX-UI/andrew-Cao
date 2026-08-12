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

export const fetchChannelMessagesFromSupabase = async (channel: string): Promise<ChatMessage[]> => {
  const supabase = getSupabase();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('channel', channel)
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) {
      console.warn('Supabase chat fetch notice:', error.message);
      return [];
    }

    if (data) {
      return data.map((item: SupabaseChatMessage) => ({
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

  try {
    const { error } = await supabase
      .from('chat_messages')
      .insert({
        id: message.id,
        channel,
        sender: message.sender,
        sender_name: message.senderName || 'Agent',
        text: message.text,
        created_at: new Date(message.timestamp || Date.now()).toISOString(),
        recipient_id: recipientId
      });

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
      .channel(`chat_${channel}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `channel=eq.${channel}` },
        (payload) => {
          const newRow = payload.new as SupabaseChatMessage;
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
