"use client";
import { use, useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Thread {
  id: string;
  title: string;
  body: string;
  category: string;
  author_name: string;
  upvotes: number;
  reply_count: number;
  is_pinned: boolean;
  created_at: string;
}

interface Reply {
  id: string;
  thread_id: string;
  body: string;
  author_name: string;
  upvotes: number;
  is_accepted: boolean;
  created_at: string;
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
}

function getCategoryColor(category: string): string {
  const colorMap: { [key: string]: string } = {
    'SAIL': 'bg-blue-500',
    'Process Models': 'bg-orange-500',
    'Records': 'bg-emerald-500',
    'Integrations': 'bg-cyan-500',
    'CDTs': 'bg-purple-500',
    'Expression Rules': 'bg-yellow-500',
    'Performance': 'bg-red-500',
    'Design Patterns': 'bg-green-500',
    'Portals': 'bg-pink-500',
    'Admin & DevOps': 'bg-indigo-500',
    'General': 'bg-gray-500'
  };
  return colorMap[category] || 'bg-gray-500';
}

export default function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
  const [thread, setThread] = useState<Thread | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [votedItems, setVotedItems] = useState<Set<string>>(new Set());
  const [voterHash, setVoterHash] = useState<string>('');
  
  // Reply form state
  const [replyContent, setReplyContent] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Generate voter hash
  const generateVoterHash = useCallback(async () => {
    try {
      const cached = localStorage.getItem('ac_voter_hash');
      if (cached) {
        setVoterHash(cached);
        return cached;
      }

      const data = navigator.userAgent + screen.width + screen.height;
      const encoder = new TextEncoder();
      const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      localStorage.setItem('ac_voter_hash', hashHex);
      setVoterHash(hashHex);
      return hashHex;
    } catch (err) {
      console.error('Failed to generate voter hash:', err);
      return '';
    }
  }, []);

  // Load thread and replies
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/community/${id}`);
      if (!response.ok) {
        throw new Error('Failed to load thread');
      }
      
      const data = await response.json();
      setThread(data.thread);
      
      // Sort replies: accepted first, then by upvotes desc, then chronological
      const sortedReplies = data.replies.sort((a: Reply, b: Reply) => {
        if (a.is_accepted && !b.is_accepted) return -1;
        if (!a.is_accepted && b.is_accepted) return 1;
        if (a.upvotes !== b.upvotes) return b.upvotes - a.upvotes;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
      
      setReplies(sortedReplies);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Handle voting
  const handleVote = useCallback(async (targetType: 'thread' | 'reply', targetId: string) => {
    if (!voterHash) return;

    try {
      const response = await fetch('/api/community/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetType,
          targetId,
          voterHash
        }),
      });

      if (response.ok) {
        const voted = votedItems.has(targetId);
        const newVotedItems = new Set(votedItems);
        
        if (voted) {
          newVotedItems.delete(targetId);
        } else {
          newVotedItems.add(targetId);
        }
        setVotedItems(newVotedItems);

        // Update vote count locally
        if (targetType === 'thread' && thread) {
          setThread({
            ...thread,
            upvotes: voted ? thread.upvotes - 1 : thread.upvotes + 1
          });
        } else {
          setReplies(prev => prev.map(reply => 
            reply.id === targetId 
              ? { ...reply, upvotes: voted ? reply.upvotes - 1 : reply.upvotes + 1 }
              : reply
          ));
        }
      }
    } catch (err) {
      console.error('Failed to vote:', err);
    }
  }, [voterHash, votedItems, thread]);

  // Submit reply
  const handleReplySubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !authorName.trim() || submitting) return;

    try {
      setSubmitting(true);
      const response = await fetch(`/api/community/${id}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: replyContent.trim(),
          authorName: authorName.trim()
        }),
      });

      if (response.ok) {
        // Save name to localStorage
        localStorage.setItem('ac_display_name', authorName.trim());
        
        // Clear form
        setReplyContent('');
        
        // Reload data to get updated replies
        await loadData();
      } else {
        throw new Error('Failed to submit reply');
      }
    } catch (err) {
      console.error('Failed to submit reply:', err);
      alert('Failed to submit reply. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [replyContent, authorName, submitting, id, loadData]);

  useEffect(() => {
    generateVoterHash();
    loadData();
    
    // Load saved display name
    const savedName = localStorage.getItem('ac_display_name');
    if (savedName) {
      setAuthorName(savedName);
    }
  }, [generateVoterHash, loadData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p>Loading thread...</p>
        </div>
      </div>
    );
  }

  if (error || !thread) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-200 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'Thread not found'}</p>
          <Link href="/community" className="text-orange-400 hover:text-orange-300">
            ← Back to Community
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/community" 
            className="text-orange-400 hover:text-orange-300 mb-4 inline-flex items-center text-sm"
          >
            ← Back to Community
          </Link>
          
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <h1 className="text-xl font-bold">{thread.title}</h1>
            <span className={`px-2 py-1 rounded text-xs font-medium text-white ${getCategoryColor(thread.category)}`}>
              {thread.category}
            </span>
          </div>
        </div>

        {/* Thread Body */}
        <div className="bg-gray-800/60 rounded-lg border border-gray-700/50 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-400">
              {thread.author_name} • {formatDate(thread.created_at)}
            </div>
            <button
              onClick={() => handleVote('thread', thread.id)}
              className={`flex items-center space-x-1 px-3 py-1 rounded text-sm transition-colors ${
                votedItems.has(thread.id)
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                  : 'bg-gray-700/50 text-gray-300 border border-gray-600/50 hover:bg-gray-600/50'
              }`}
            >
              <span>▲</span>
              <span>{thread.upvotes}</span>
            </button>
          </div>
          
          <div className="text-gray-200 whitespace-pre-wrap">
            {thread.body}
          </div>
        </div>

        {/* Replies Section */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-6">
            {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
          </h2>
          
          {replies.length > 0 ? (
            <div className="space-y-4">
              {replies.map((reply) => (
                <div key={reply.id} className="bg-gray-800/60 rounded-lg border border-gray-700/50 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="text-sm text-gray-400">
                        {reply.author_name} • {timeAgo(reply.created_at)}
                      </div>
                      {reply.is_accepted && (
                        <span className="bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-1 rounded text-xs font-medium">
                          ✓ Accepted Answer
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleVote('reply', reply.id)}
                      className={`flex items-center space-x-1 px-3 py-1 rounded text-sm transition-colors ${
                        votedItems.has(reply.id)
                          ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                          : 'bg-gray-700/50 text-gray-300 border border-gray-600/50 hover:bg-gray-600/50'
                      }`}
                    >
                      <span>▲</span>
                      <span>{reply.upvotes}</span>
                    </button>
                  </div>
                  
                  <div className="text-gray-200 whitespace-pre-wrap">
                    {reply.body}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">No replies yet. Be the first to help!</p>
          )}
        </div>

        {/* Reply Form */}
        <div className="bg-gray-800/60 rounded-lg border border-gray-700/50 p-6">
          <h3 className="text-lg font-semibold mb-4">Add Your Reply</h3>
          
          <form onSubmit={handleReplySubmit} className="space-y-4">
            <div>
              <label htmlFor="authorName" className="block text-sm font-medium text-gray-300 mb-2">
                Your Name
              </label>
              <input
                type="text"
                id="authorName"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50"
                placeholder="Enter your name"
                required
              />
            </div>
            
            <div>
              <label htmlFor="replyContent" className="block text-sm font-medium text-gray-300 mb-2">
                Content
              </label>
              <textarea
                id="replyContent"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                maxLength={5000}
                rows={6}
                className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 resize-y"
                placeholder="Share your knowledge and help the community..."
                required
              />
              <div className="text-right text-xs text-gray-400 mt-1">
                {replyContent.length} / 5000
              </div>
            </div>
            
            <button
              type="submit"
              disabled={submitting || !replyContent.trim() || !authorName.trim()}
              className="px-6 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium rounded transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Reply'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}