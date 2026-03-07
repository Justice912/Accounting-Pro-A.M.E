import { useNavigate } from 'react-router-dom';
import { Sparkles, MessageSquare, Clock } from 'lucide-react';
import DomainCard from '../components/home/DomainCard';
import { useWorkspace } from '../contexts/WorkspaceContext';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { DOMAINS, conversations, createConversation } = useWorkspace();

  const handleDomainClick = async (domain) => {
    const id = await createConversation(domain.id, 'New conversation');
    if (id) navigate(`/workspace/${domain.id}/${id}`);
  };

  const recentConversations = conversations.slice(0, 5);

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-6 py-12">
      {/* Greeting */}
      <div className="text-center mb-10">
        <Sparkles className="w-10 h-10 text-emerald-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-slate-800 mb-2">
          {getGreeting()}. How can I help?
        </h1>
        <p className="text-slate-500 text-sm max-w-lg mx-auto">
          AI-powered workspace for South African accounting, tax, audit, and professional services.
        </p>
      </div>

      {/* Domain Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl w-full mb-12">
        {DOMAINS.map(domain => (
          <DomainCard key={domain.id} domain={domain} onClick={handleDomainClick} />
        ))}
      </div>

      {/* Recent Conversations */}
      {recentConversations.length > 0 && (
        <div className="w-full max-w-2xl">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Recent Conversations
          </h3>
          <div className="space-y-1">
            {recentConversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => navigate(`/workspace/${conv.domain}/${conv.id}`)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all text-left"
              >
                <MessageSquare className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 truncate">{conv.title || 'New conversation'}</p>
                  <p className="text-xs text-slate-400">
                    {conv.domain?.replace('-', ' ')} &middot; {new Date(conv.updated_at || conv.created_at).toLocaleDateString('en-ZA')}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
