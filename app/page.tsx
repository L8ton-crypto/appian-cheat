"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { functions, recipes, queryRecipesRecords, queryRecipesEntity, connectedSystems, categories, FunctionItem, ConnectedSystem } from "@/lib/data";
import { getEmbedding } from "@/lib/embeddings";

interface SemanticResult {
  name: string;
  category: string;
  content: string;
  similarity: number;
}

function FunctionCard({ fn }: { fn: FunctionItem }) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div 
      className="bg-gray-800/60 border border-gray-700/50 rounded-lg p-4 hover:bg-gray-800 hover:border-gray-600/50 transition-colors cursor-pointer"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <code className="text-sm font-mono text-blue-400 font-semibold">{fn.name}</code>
          {fn.subcategory && (
            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-gray-700 text-gray-400">
              {fn.subcategory}
            </span>
          )}
        </div>
        <span className="text-gray-600 text-xs">{expanded ? "−" : "+"}</span>
      </div>
      <p className="text-xs text-gray-400 mt-1">{fn.description}</p>
      
      {expanded && (
        <div className="mt-3 space-y-2">
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Syntax</p>
            <code className="block text-xs font-mono bg-gray-900 px-2 py-1.5 rounded text-emerald-400 overflow-x-auto">
              {fn.syntax}
            </code>
          </div>
          {fn.example && (
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Example</p>
              <code className="block text-xs font-mono bg-gray-900 px-2 py-1.5 rounded text-amber-400 overflow-x-auto">
                {fn.example}
              </code>
            </div>
          )}
          {fn.docUrl && (
            <a
              href={fn.docUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-block text-[11px] text-blue-400 hover:text-blue-300 mt-1"
            >
              📖 Appian Docs →
            </a>
          )}
        </div>
      )}
    </div>
  );
}

interface RecipeItem {
  title: string;
  description: string;
  code: string;
  category?: string;
  docUrl?: string;
}

function RecipeCard({ recipe }: { recipe: RecipeItem }) {
  const [copied, setCopied] = useState(false);
  
  const copyCode = () => {
    navigator.clipboard.writeText(recipe.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="bg-gray-800/60 border border-gray-700/50 rounded-lg p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-semibold text-gray-200">{recipe.title}</h3>
        {recipe.category && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 whitespace-nowrap">
            {recipe.category}
          </span>
        )}
      </div>
      <p className="text-xs text-gray-400 mb-3">{recipe.description}</p>
      <div className="relative">
        <pre className="text-xs font-mono bg-gray-900 px-3 py-2 rounded text-gray-300 overflow-x-auto whitespace-pre-wrap">
          {recipe.code}
        </pre>
        <button
          onClick={copyCode}
          className="absolute top-2 right-2 text-[10px] px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
        >
          {copied ? "✓ Copied" : "Copy"}
        </button>
      </div>
      {recipe.docUrl && (
        <a
          href={recipe.docUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-[11px] text-blue-400 hover:text-blue-300 mt-2"
        >
          📖 Appian Docs →
        </a>
      )}
    </div>
  );
}

function ConnectedSystemCard({ cs }: { cs: ConnectedSystem }) {
  return (
    <div className="bg-gray-800/60 border border-gray-700/50 rounded-lg p-4 hover:bg-gray-800 hover:border-gray-600/50 transition-colors">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-semibold text-blue-400">{cs.name}</h3>
      </div>
      <p className="text-xs text-gray-400 mb-3">{cs.description}</p>
      <div className="mb-3">
        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1.5">Authentication Types</p>
        <div className="flex flex-wrap gap-1">
          {cs.authTypes.map((auth, i) => (
            <span 
              key={i} 
              className="text-[10px] px-2 py-0.5 rounded-full bg-gray-700/80 text-gray-300"
            >
              {auth}
            </span>
          ))}
        </div>
      </div>
      <a
        href={cs.docUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block text-[11px] text-blue-400 hover:text-blue-300"
      >
        📖 Appian Docs →
      </a>
    </div>
  );
}

export default function Home() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"functions" | "functionRecipes" | "queryRecipes" | "connectedSystems">("functions");
  const [aiSearch, setAiSearch] = useState(false);
  const [aiResults, setAiResults] = useState<SemanticResult[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiModelStatus, setAiModelStatus] = useState<"idle" | "loading" | "ready">("idle");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doAiSearch = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setAiResults([]);
      return;
    }
    
    setAiLoading(true);
    try {
      if (aiModelStatus !== "ready") setAiModelStatus("loading");
      const embedding = await getEmbedding(query);
      setAiModelStatus("ready");
      
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ embedding, limit: 12 }),
      });
      const data = await res.json();
      setAiResults(data);
    } catch (err) {
      console.error("AI search failed:", err);
    } finally {
      setAiLoading(false);
    }
  }, [aiModelStatus]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (aiSearch) {
      if (searchTimer.current) clearTimeout(searchTimer.current);
      searchTimer.current = setTimeout(() => doAiSearch(value), 500);
    }
  };

  const filteredFunctions = useMemo(() => {
    return functions.filter((fn) => {
      const matchesSearch = !search || 
        fn.name.toLowerCase().includes(search.toLowerCase()) ||
        fn.description.toLowerCase().includes(search.toLowerCase()) ||
        fn.syntax.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategory === "all" || fn.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [search, selectedCategory]);

  const filteredRecipes = useMemo(() => {
    return recipes.filter((r) => {
      const matchesSearch = !search ||
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.description.toLowerCase().includes(search.toLowerCase()) ||
        r.code.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategory === "all" || r.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [search, selectedCategory]);

  const filteredQueryRecipesRecords = useMemo(() => {
    return queryRecipesRecords.filter((r) => {
      return !search ||
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.description.toLowerCase().includes(search.toLowerCase()) ||
        r.code.toLowerCase().includes(search.toLowerCase());
    });
  }, [search]);

  const filteredQueryRecipesEntity = useMemo(() => {
    return queryRecipesEntity.filter((r) => {
      return !search ||
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.description.toLowerCase().includes(search.toLowerCase()) ||
        r.code.toLowerCase().includes(search.toLowerCase());
    });
  }, [search]);

  const totalQueryRecipes = filteredQueryRecipesRecords.length + filteredQueryRecipesEntity.length;

  const filteredConnectedSystems = useMemo(() => {
    return connectedSystems.filter((cs) => {
      return !search ||
        cs.name.toLowerCase().includes(search.toLowerCase()) ||
        cs.description.toLowerCase().includes(search.toLowerCase()) ||
        cs.authTypes.some(auth => auth.toLowerCase().includes(search.toLowerCase()));
    });
  }, [search]);

  const groupedConnectedSystems = useMemo(() => {
    const integration = filteredConnectedSystems.filter(cs => cs.category === "integration");
    const database = filteredConnectedSystems.filter(cs => cs.category === "database");
    const prebuilt = filteredConnectedSystems.filter(cs => cs.category === "prebuilt");
    return { integration, database, prebuilt };
  }, [filteredConnectedSystems]);

  const groupedFunctions = useMemo(() => {
    const groups: Record<string, FunctionItem[]> = {};
    filteredFunctions.forEach((fn) => {
      if (!groups[fn.category]) groups[fn.category] = [];
      groups[fn.category].push(fn);
    });
    return groups;
  }, [filteredFunctions]);

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-lg font-bold">
                ⚡
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">AppianCheat</h1>
                <p className="text-[11px] text-gray-500">Quick reference for Appian 25.4</p>
              </div>
            </div>
            
            {/* Search */}
            <div className="flex items-center gap-2 flex-1 max-w-lg">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && aiSearch) doAiSearch(search); }}
                  placeholder={aiSearch ? "Ask naturally... e.g. 'loop through a list'" : "Search functions, syntax, descriptions..."}
                  className={`w-full bg-gray-800/60 border rounded-lg px-4 py-2 text-sm text-gray-300 placeholder-gray-500 focus:outline-none ${
                    aiSearch ? "border-purple-500/50 focus:border-purple-400/70" : "border-gray-700/50 focus:border-blue-500/50"
                  }`}
                />
                {aiLoading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  setAiSearch(!aiSearch);
                  setAiResults([]);
                  if (!aiSearch && search.length >= 3) doAiSearch(search);
                }}
                className={`shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  aiSearch
                    ? "bg-purple-600 text-white"
                    : "bg-gray-800/60 border border-gray-700/50 text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
                title="Toggle AI semantic search"
              >
                <span className="text-sm">🧠</span>
                AI Search
                {aiModelStatus === "loading" && <span className="text-[10px] text-purple-300">(loading...)</span>}
              </button>
            </div>
          </div>
          
          {/* Tabs & Filter */}
          <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
            <div className="flex gap-1 flex-wrap">
              <button
                onClick={() => setActiveTab("functions")}
                className={`px-4 py-1.5 rounded-lg text-sm transition-colors ${
                  activeTab === "functions"
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                Functions ({filteredFunctions.length})
              </button>
              <button
                onClick={() => setActiveTab("functionRecipes")}
                className={`px-4 py-1.5 rounded-lg text-sm transition-colors ${
                  activeTab === "functionRecipes"
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                Function Recipes ({filteredRecipes.length})
              </button>
              <button
                onClick={() => setActiveTab("queryRecipes")}
                className={`px-4 py-1.5 rounded-lg text-sm transition-colors ${
                  activeTab === "queryRecipes"
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                Query Recipes ({totalQueryRecipes})
              </button>
              <button
                onClick={() => setActiveTab("connectedSystems")}
                className={`px-4 py-1.5 rounded-lg text-sm transition-colors ${
                  activeTab === "connectedSystems"
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                Connected Systems ({filteredConnectedSystems.length})
              </button>
            </div>
            
            {(activeTab === "functions" || activeTab === "functionRecipes") && (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-gray-800/60 border border-gray-700/50 rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-blue-500/50"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* AI Search Results */}
        {aiSearch && aiResults.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm">🧠</span>
              <h2 className="text-sm font-semibold text-purple-400">Semantic Results</h2>
              <span className="text-xs text-gray-500">({aiResults.length} matches by meaning)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {aiResults.map((result, i) => {
                const fn = functions.find(f => f.name === result.name);
                if (fn) {
                  return (
                    <div key={i} className="relative">
                      <div className="absolute -top-1 -right-1 z-10 bg-purple-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-mono">
                        {(result.similarity * 100).toFixed(0)}%
                      </div>
                      <FunctionCard fn={fn} />
                    </div>
                  );
                }
                return (
                  <div key={i} className="relative bg-gray-800/60 border border-purple-500/20 rounded-lg p-4">
                    <div className="absolute -top-1 -right-1 z-10 bg-purple-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-mono">
                      {(result.similarity * 100).toFixed(0)}%
                    </div>
                    <code className="text-sm font-mono text-blue-400 font-semibold">{result.name}</code>
                    <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-gray-700 text-gray-400">{result.category}</span>
                    <pre className="text-xs text-gray-400 mt-2 whitespace-pre-wrap">{result.content}</pre>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 border-b border-gray-800" />
          </div>
        )}

        {aiSearch && search.length >= 3 && aiResults.length === 0 && !aiLoading && (
          <div className="mb-8 text-center py-8 text-gray-500">
            <span className="text-3xl mb-2 block">🧠</span>
            <p className="text-sm">Type a natural language query and press Enter</p>
            <p className="text-xs text-gray-600 mt-1">e.g. &quot;loop through a list&quot; or &quot;check user permissions&quot;</p>
          </div>
        )}

        {activeTab === "functions" ? (
          <div className="space-y-8">
            {Object.entries(groupedFunctions).map(([category, fns]) => (
              <section key={category}>
                <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  {category}
                  <span className="text-xs text-gray-500 font-normal">({fns.length})</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {fns.map((fn) => (
                    <FunctionCard key={fn.name + fn.category} fn={fn} />
                  ))}
                </div>
              </section>
            ))}
            {filteredFunctions.length === 0 && (
              <div className="text-center py-16 text-gray-500">
                <div className="text-4xl mb-3">🔍</div>
                <p>No functions found matching your search.</p>
              </div>
            )}
          </div>
        ) : activeTab === "functionRecipes" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRecipes.map((recipe, i) => (
              <RecipeCard key={i} recipe={recipe} />
            ))}
            {filteredRecipes.length === 0 && (
              <div className="col-span-2 text-center py-16 text-gray-500">
                <div className="text-4xl mb-3">🔍</div>
                <p>No recipes found matching your search.</p>
              </div>
            )}
          </div>
        ) : activeTab === "queryRecipes" ? (
          <div className="space-y-8">
            {/* Records Section */}
            <section>
              <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Querying Records
                <span className="text-xs text-gray-500 font-normal">a!queryRecordType / a!queryRecordByIdentifier</span>
              </h2>
              <p className="text-xs text-gray-500 mb-4">
                Use these recipes for querying record types directly. Recommended for most use cases.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredQueryRecipesRecords.map((recipe, i) => (
                  <RecipeCard key={`rec-${i}`} recipe={recipe} />
                ))}
              </div>
              {filteredQueryRecipesRecords.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No record query recipes found.</p>
                </div>
              )}
            </section>

            {/* Entity Section */}
            <section>
              <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                Querying Entities
                <span className="text-xs text-gray-500 font-normal">a!queryEntity</span>
              </h2>
              <p className="text-xs text-gray-500 mb-4">
                Use these recipes for querying data store entities directly. Useful for legacy patterns or specific needs.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredQueryRecipesEntity.map((recipe, i) => (
                  <RecipeCard key={`ent-${i}`} recipe={recipe} />
                ))}
              </div>
              {filteredQueryRecipesEntity.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No entity query recipes found.</p>
                </div>
              )}
            </section>

            {totalQueryRecipes === 0 && (
              <div className="text-center py-16 text-gray-500">
                <div className="text-4xl mb-3">🔍</div>
                <p>No query recipes found matching your search.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Integration Connected Systems */}
            {groupedConnectedSystems.integration.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  Integration Connected Systems
                </h2>
                <p className="text-xs text-gray-500 mb-4">
                  Generic connected systems for REST APIs, OpenAPI, and JDBC connections.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedConnectedSystems.integration.map((cs) => (
                    <ConnectedSystemCard key={cs.name} cs={cs} />
                  ))}
                </div>
              </section>
            )}

            {/* Database Connected Systems */}
            {groupedConnectedSystems.database.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Data Source Connected Systems
                </h2>
                <p className="text-xs text-gray-500 mb-4">
                  Connect to Appian-supported databases (MariaDB, MySQL, PostgreSQL, Oracle, SQL Server, DB2, Aurora).
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedConnectedSystems.database.map((cs) => (
                    <ConnectedSystemCard key={cs.name} cs={cs} />
                  ))}
                </div>
              </section>
            )}

            {/* Pre-built Connected Systems */}
            {groupedConnectedSystems.prebuilt.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                  Pre-Built Connected Systems
                </h2>
                <p className="text-xs text-gray-500 mb-4">
                  Ready-to-use integrations for popular third-party services.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groupedConnectedSystems.prebuilt.map((cs) => (
                    <ConnectedSystemCard key={cs.name} cs={cs} />
                  ))}
                </div>
              </section>
            )}

            {filteredConnectedSystems.length === 0 && (
              <div className="text-center py-16 text-gray-500">
                <div className="text-4xl mb-3">🔍</div>
                <p>No connected systems found matching your search.</p>
              </div>
            )}
          </div>
        )}
      </main>
      
      {/* Footer */}
      <footer className="border-t border-gray-800 py-6 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center text-xs text-gray-600">
          <p>Based on Appian 25.4 documentation • <a href="https://docs.appian.com/suite/help/25.4/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-400">Official Docs</a></p>
        </div>
      </footer>
    </div>
  );
}
