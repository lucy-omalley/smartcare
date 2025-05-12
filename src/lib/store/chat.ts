import { atom } from 'jotai';

export interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export const messagesAtom = atom<ChatMessage[]>([]); 