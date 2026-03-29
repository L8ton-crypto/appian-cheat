"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";

// Helper function for time formatting
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

// Category badge colors mapping
const categoryColors: Record<string, string> = {
  "SAIL": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "Process Models": "bg-orange-500/20 text-orange-400 border-orange-500/30",
  "Records": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "Integrations": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  "CDTs": "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "Expression Rules": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  "Performance": "bg-red-500/20 text-red-400 border-red-500/30",
  "Design Patterns": "bg-green-500/20 text-green-400 border-green-500/30",
  "Portals": "bg-pink-500/20 text-pink-400 border-pink-500/30",
  "Admin & DevOps": "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  "General": "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const categories = [
  "SAIL", "Process Models", "Records", "Integrations", "CDTs", 
  "Expression Rules", "Performance", "Design Patterns", 
  "Portals", "Admin & DevOps", "General"
];

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
  updated_at: string;
}

interface ApiResponse {
  threads: Thread[];
  total: number;
  page: number;
  totalPages: number;
  categoryCounts: Record<string, number>;
}

// Modal Component
function NewQuestionModal({ isOpen, onClose, onSubmit }: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; content: string; category: string; authorName: string }) => void;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("General");
  const [authorName, setAuthorName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const savedName = localStorage.getItem("ac_display_name") || "";
      setAuthorName(savedName);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !authorName.trim()) return;
    
    setLoading(true);
    try {
      await onSubmit({ title: title.trim(), content: content.trim(), category, authorName: authorName.trim() });
      localStorage.setItem("ac_display_name", authorName.trim());
      // Reset form
      setTitle("");
      setContent("");
      setCategory("General");
      setAuthorName("");
      onClose();
    } catch (error) {
      console.error("Failed to submit question:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700/50 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Ask a Question</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">×</button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                className="w-full bg-gray-800/60 border border-gray-700/50 rounded-lg px-4 py-2 text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-orange-500/50"
                placeholder="What's your question?"
                required
              />
              <div className="text-xs text-gray-500 mt-1">{title.length}/200</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-gray-800/60 border border-gray-700/50 rounded-lg px-4 py-2 text-sm text-gray-300 focus:outline-none focus:border-orange-500/50"
                required
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Your Name</label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-full bg-gray-800/60 border border-gray-700/50 rounded-lg px-4 py-2 text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-orange-500/50"
                placeholder="Your display name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Content</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={10000}
                rows={6}
                className="w-full bg-gray-800/60 border border-gray-700/50 rounded-lg px-4 py-2 text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-orange-500/50 resize-none"
                placeholder="Describe your question in detail..."
                required
              />
              <div className="text-xs text-gray-500 mt-1">{content.length}/10000</div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 px-4 border border-gray-700/50 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !title.trim() || !content.trim() || !authorName.trim()}
                className="flex-1 py-2 px-4 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:from-orange-400 hover:to-red-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Posting..." : "Post Question"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function CommunityPage() {
  const router = useRouter();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState<"latest" | "popular" | "unanswered">("latest");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [votedThreads, setVotedThreads] = useState<Set<string>>(new Set());
  const [voterHash, setVoterHash] = useState("");
  
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Generate and cache voter hash
  useEffect(() => {
    const generateVoterHash = async () => {
      let hash = localStorage.getItem("ac_voter_hash");
      if (!hash) {
        const hashInput = navigator.userAgent + screen.width + screen.height;
        const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(hashInput));
        hash = Array.from(new Uint8Array(hashBuffer))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
        localStorage.setItem("ac_voter_hash", hash);
      }
      setVoterHash(hash);
    };
    generateVoterHash();
  }, []);

  const debouncedSearch = (query: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setPage(1); // Reset to first page on search
      fetchThreads(1, selectedCategory, sortBy, query);
    }, 300);
  };

  const fetchThreads = async (pageNum = 1, category = selectedCategory, sort = sortBy, query = searchQuery) => {
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        sort,
        ...(category !== "All" && { category }),
        ...(query && { q: query }),
      });
      
      const response = await fetch(`/api/community?${params}`);
      const data: ApiResponse = await response.json();
      
      setThreads(data.threads || []);
      setCategoryCounts(data.categoryCounts || {});
      setTotalPages(data.totalPages || 1);
      setPage(pageNum);
    } catch (error) {
      console.error("Failed to fetch threads:", error);
      setThreads([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThreads();
  }, [selectedCategory, sortBy]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    debouncedSearch(query);
  };

  const handleUpvote = async (threadId: string) => {
    if (!voterHash) return;
    
    try {
      const response = await fetch('/api/community/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType: 'thread',
          targetId: threadId,
          voterHash,
        }),
      });
      
      const result = await response.json();
      
      // Update local state
      const newVotedThreads = new Set(votedThreads);
      if (result.voted === false) {
        newVotedThreads.delete(threadId);
      } else {
        newVotedThreads.add(threadId);
      }
      setVotedThreads(newVotedThreads);
      
      // Refresh threads to get updated counts
      fetchThreads(page, selectedCategory, sortBy, searchQuery);
    } catch (error) {
      console.error("Failed to vote:", error);
    }
  };

  const handleNewQuestion = async (data: { title: string; content: string; category: string; authorName: string }) => {
    try {
      const response = await fetch('/api/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (response.ok) {
        const result = await response.json();
        await fetchThreads(); // Refresh list
        router.push(`/community/${result.id}`); // Navigate to new thread
      }
    } catch (error) {
      console.error("Failed to create question:", error);
      throw error;
    }
  };

  const totalCount = Object.values(categoryCounts).reduce((sum, count) => sum + count, 0);

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      
      {/* Sub-header */}
      <div className="border-b border-gray-800 bg-gray-950/60">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">💬 Community Hub</h2>
            <p className="text-sm text-gray-500">Ask questions, share knowledge</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setModalOpen(true)}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-orange-500 to-red-600 text-white hover:from-orange-400 hover:to-red-500 transition-all"
            >
              New Question
            </button>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg bg-gray-800/60 border border-gray-700/50 text-gray-400 hover:text-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className={`w-80 space-y-6 ${sidebarOpen ? 'block' : 'hidden'} lg:block`}>
            <div className="bg-gray-800/60 border border-gray-700/50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-white mb-3">Categories</h3>
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedCategory("All")}
                  className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors flex items-center justify-between ${
                    selectedCategory === "All" 
                      ? "bg-orange-500/20 text-orange-400" 
                      : "text-gray-400 hover:text-white hover:bg-gray-700/50"
                  }`}
                >
                  <span>All</span>
                  <span className="text-xs">{totalCount}</span>
                </button>
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors flex items-center justify-between ${
                      selectedCategory === category 
                        ? "bg-orange-500/20 text-orange-400" 
                        : "text-gray-400 hover:text-white hover:bg-gray-700/50"
                    }`}
                  >
                    <span>{category}</span>
                    <span className="text-xs">{categoryCounts[category] || 0}</span>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 space-y-6">
            {/* Search and Sort */}
            <div className="bg-gray-800/60 border border-gray-700/50 rounded-lg p-4">
              <div className="space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search questions..."
                    className="w-full bg-gray-900/60 border border-gray-700/50 rounded-lg px-4 py-2 text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-orange-500/50"
                  />
                </div>
                
                {/* Sort Tabs */}
                <div className="flex gap-1">
                  {[
                    { key: "latest", label: "Latest" },
                    { key: "popular", label: "Popular" },
                    { key: "unanswered", label: "Unanswered" }
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setSortBy(key as typeof sortBy)}
                      className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                        sortBy === key
                          ? "bg-orange-600 text-white"
                          : "text-gray-400 hover:text-white hover:bg-gray-700/50"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Thread List */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : threads.length === 0 ? (
              <div className="text-center py-16 bg-gray-800/60 border border-gray-700/50 rounded-lg">
                <div className="text-4xl mb-3">💬</div>
                <p className="text-gray-400 mb-4">No questions yet. Be the first to ask!</p>
                <button
                  onClick={() => setModalOpen(true)}
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:from-orange-400 hover:to-red-500 transition-all"
                >
                  Ask a Question
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {threads.map((thread) => (
                  <div key={thread.id} className="bg-gray-800/60 border border-gray-700/50 rounded-lg p-4 hover:bg-gray-800 hover:border-gray-600/50 transition-colors">
                    <div className="flex gap-4">
                      {/* Upvote Section */}
                      <div className="flex flex-col items-center gap-1">
                        <button
                          onClick={() => handleUpvote(thread.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            votedThreads.has(thread.id)
                              ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                              : "bg-gray-700/50 text-gray-500 hover:text-orange-400 hover:bg-orange-500/10 border border-gray-600/50"
                          }`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <span className="text-sm font-semibold text-gray-300">{thread.upvotes}</span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3 mb-2">
                          {thread.is_pinned && (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded">
                              📌 Pinned
                            </span>
                          )}
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-medium border rounded ${
                            categoryColors[thread.category] || categoryColors["General"]
                          }`}>
                            {thread.category}
                          </span>
                        </div>
                        
                        <Link href={`/community/${thread.id}`} className="group">
                          <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-orange-400 transition-colors">
                            {thread.title}
                          </h3>
                        </Link>
                        
                        <p className="text-sm text-gray-400 mb-3 line-clamp-3">
                          {thread.body.slice(0, 150)}{thread.body.length > 150 && "..."}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>by {thread.author_name}</span>
                          <span>{timeAgo(thread.created_at)}</span>
                          {thread.reply_count > 0 && (
                            <span className="flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                              {thread.reply_count} {thread.reply_count === 1 ? 'reply' : 'replies'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <button
                  onClick={() => page > 1 && fetchThreads(page - 1)}
                  disabled={page <= 1}
                  className="px-4 py-2 text-sm bg-gray-800/60 border border-gray-700/50 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                
                <span className="text-sm text-gray-500">
                  Page {page} of {totalPages}
                </span>
                
                <button
                  onClick={() => page < totalPages && fetchThreads(page + 1)}
                  disabled={page >= totalPages}
                  className="px-4 py-2 text-sm bg-gray-800/60 border border-gray-700/50 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* New Question Modal */}
      <NewQuestionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleNewQuestion}
      />
    </div>
  );
}