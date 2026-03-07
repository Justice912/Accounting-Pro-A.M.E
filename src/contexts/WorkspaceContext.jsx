import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const WorkspaceContext = createContext();

export const useWorkspace = () => useContext(WorkspaceContext);

const DOMAINS = [
  { id: 'sa-tax', name: 'SA Tax', icon: 'Calculator', color: 'emerald' },
  { id: 'auditing', name: 'Auditing', icon: 'Shield', color: 'blue' },
  { id: 'quantity-surveying', name: 'Quantity Surveying', icon: 'Ruler', color: 'amber' },
  { id: 'hr-payroll', name: 'HR & Payroll', icon: 'Users', color: 'purple' },
  { id: 'accounting', name: 'Accounting', icon: 'BookOpen', color: 'sky' },
  { id: 'finance', name: 'Finance', icon: 'TrendingUp', color: 'rose' },
  { id: 'general', name: 'General', icon: 'MessageSquare', color: 'slate' },
];

function groupConversationsByDate(conversations) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  const last7 = new Date(today); last7.setDate(last7.getDate() - 7);
  const last30 = new Date(today); last30.setDate(last30.getDate() - 30);

  const groups = { Today: [], Yesterday: [], 'Last 7 Days': [], 'Last 30 Days': [], Older: [] };

  conversations.forEach(conv => {
    const d = new Date(conv.updated_at || conv.created_at);
    if (d >= today) groups.Today.push(conv);
    else if (d >= yesterday) groups.Yesterday.push(conv);
    else if (d >= last7) groups['Last 7 Days'].push(conv);
    else if (d >= last30) groups['Last 30 Days'].push(conv);
    else groups.Older.push(conv);
  });

  return Object.entries(groups).filter(([, items]) => items.length > 0);
}

export function WorkspaceProvider({ children }) {
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [activeDomain, setActiveDomain] = useState(null);
  const [domainFilter, setDomainFilter] = useState('all');
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Load conversations from SQLite
  const loadConversations = useCallback(async () => {
    try {
      if (window.api) {
        const convs = await window.api.getConversations();
        setConversations(convs || []);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Create a new conversation
  const createConversation = useCallback(async (domain, title) => {
    const convData = {
      domain: domain || 'general',
      subdomain: 'general',
      title: title || 'New conversation',
    };

    try {
      if (window.api) {
        const result = await window.api.saveConversation(convData);
        const newConv = {
          ...convData,
          id: result.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setConversations(prev => [newConv, ...prev]);
        setActiveConversationId(result.id);
        setActiveDomain(domain);
        setAttachedFiles([]);
        return result.id;
      }
      // Dev fallback
      const id = `conv-${Date.now()}`;
      const newConv = { ...convData, id, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      setConversations(prev => [newConv, ...prev]);
      setActiveConversationId(id);
      setActiveDomain(domain);
      setAttachedFiles([]);
      return id;
    } catch (err) {
      console.error('Failed to create conversation:', err);
      return null;
    }
  }, []);

  // Switch to an existing conversation
  const switchConversation = useCallback((id) => {
    const conv = conversations.find(c => c.id === id);
    if (conv) {
      setActiveConversationId(id);
      setActiveDomain(conv.domain);
      setAttachedFiles([]);
    }
  }, [conversations]);

  // Delete a conversation
  const deleteConversation = useCallback(async (id) => {
    try {
      if (window.api?.deleteConversation) {
        await window.api.deleteConversation(id);
      }
      setConversations(prev => prev.filter(c => c.id !== id));
      if (activeConversationId === id) {
        setActiveConversationId(null);
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  }, [activeConversationId]);

  // Rename a conversation
  const renameConversation = useCallback(async (id, title) => {
    try {
      if (window.api?.renameConversation) {
        await window.api.renameConversation(id, title);
      }
      setConversations(prev =>
        prev.map(c => c.id === id ? { ...c, title, updated_at: new Date().toISOString() } : c)
      );
    } catch (err) {
      console.error('Failed to rename conversation:', err);
    }
  }, []);

  // File attachment
  const attachFile = useCallback((file) => {
    setAttachedFiles(prev => [...prev, file]);
  }, []);

  const removeFile = useCallback((fileId) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== fileId));
  }, []);

  const clearFiles = useCallback(() => {
    setAttachedFiles([]);
  }, []);

  // Update conversation title (auto-title from first message)
  const updateConversationTitle = useCallback(async (id, title) => {
    setConversations(prev =>
      prev.map(c => c.id === id ? { ...c, title } : c)
    );
    if (window.api?.renameConversation) {
      try {
        await window.api.renameConversation(id, title);
      } catch (_) {}
    }
  }, []);

  // Filtered conversations
  const filteredConversations = conversations.filter(c => {
    if (domainFilter !== 'all' && c.domain !== domainFilter) return false;
    if (searchQuery && !c.title?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const groupedConversations = groupConversationsByDate(filteredConversations);

  const activeConversation = conversations.find(c => c.id === activeConversationId);

  const value = {
    // State
    conversations,
    activeConversationId,
    activeConversation,
    activeDomain,
    domainFilter,
    attachedFiles,
    loading,
    searchQuery,
    groupedConversations,
    // Constants
    DOMAINS,
    // Actions
    setActiveDomain,
    setDomainFilter,
    setSearchQuery,
    createConversation,
    switchConversation,
    deleteConversation,
    renameConversation,
    updateConversationTitle,
    attachFile,
    removeFile,
    clearFiles,
    loadConversations,
    setActiveConversationId,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}
