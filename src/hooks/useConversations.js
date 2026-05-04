import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDocs,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../api/firebase';
import { useAuth } from './useAuth';

export function useConversations() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'users', user.uid, 'conversations'),
      orderBy('updatedAt', 'desc')
    );
    return onSnapshot(q, (snap) => {
      setConversations(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [user]);

  useEffect(() => {
    if (!user || !activeId) {
      setMessages([]);
      return;
    }
    const q = query(
      collection(db, 'users', user.uid, 'conversations', activeId, 'messages'),
      orderBy('timestamp', 'asc')
    );
    return onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [user, activeId]);

  const createConversation = useCallback(
    async (firstMessage, provider) => {
      if (!user) throw new Error('Not authenticated');
      const title = firstMessage.length > 50 ? firstMessage.slice(0, 50) + '...' : firstMessage;
      const conv = await addDoc(collection(db, 'users', user.uid, 'conversations'), {
        title,
        provider,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setActiveId(conv.id);
      return conv.id;
    },
    [user]
  );

  const addMessage = useCallback(
    async (conversationId, role, content, provider) => {
      if (!user) throw new Error('Not authenticated');
      await addDoc(
        collection(db, 'users', user.uid, 'conversations', conversationId, 'messages'),
        { role, content, provider, timestamp: serverTimestamp() }
      );
      await setDoc(
        doc(db, 'users', user.uid, 'conversations', conversationId),
        { updatedAt: serverTimestamp() },
        { merge: true }
      );
    },
    [user]
  );

  const deleteConversation = useCallback(
    async (conversationId) => {
      if (!user) throw new Error('Not authenticated');
      const msgs = await getDocs(
        collection(db, 'users', user.uid, 'conversations', conversationId, 'messages')
      );
      await Promise.all(msgs.docs.map((d) => deleteDoc(d.ref)));
      await deleteDoc(doc(db, 'users', user.uid, 'conversations', conversationId));
      if (activeId === conversationId) setActiveId(null);
    },
    [user, activeId]
  );

  return {
    conversations,
    activeId,
    setActiveId,
    messages,
    createConversation,
    addMessage,
    deleteConversation,
  };
}
