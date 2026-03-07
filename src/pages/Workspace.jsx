import { useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ChatInterface from '../components/ai/ChatInterface';
import { useWorkspace } from '../contexts/WorkspaceContext';

export default function Workspace() {
  const { domain, conversationId } = useParams();
  const navigate = useNavigate();
  const { setActiveDomain, setActiveConversationId, switchConversation, createConversation } = useWorkspace();

  // Sync URL params to workspace context
  useEffect(() => {
    if (domain) setActiveDomain(domain);
    if (conversationId) {
      setActiveConversationId(conversationId);
    } else {
      setActiveConversationId(null);
    }
  }, [domain, conversationId, setActiveDomain, setActiveConversationId]);

  // Called when ChatInterface needs to create a conversation on first message
  const handleConversationCreated = useCallback(async (chatDomain, firstMessagePreview) => {
    const id = await createConversation(chatDomain || domain || 'general', firstMessagePreview || 'New conversation');
    if (id) {
      navigate(`/workspace/${chatDomain || domain || 'general'}/${id}`, { replace: true });
      return id;
    }
    return null;
  }, [domain, createConversation, navigate]);

  return (
    <div className="h-full flex flex-col">
      <ChatInterface
        domain={domain || 'general'}
        conversationId={conversationId}
        onConversationCreated={handleConversationCreated}
      />
    </div>
  );
}
