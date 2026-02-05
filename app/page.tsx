"use client";

import { useState, useMemo } from "react";
import { functions, recipes, categories, FunctionItem } from "@/lib/data";

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

function RecipeCard({ recipe }: { recipe: typeof recipes[0] }) {
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
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">
          {recipe.category}
        </span>
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
    </div>
  );
}

export default function Home() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"functions" | "recipes">("functions");

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
            <div className="flex items-center gap-3 flex-1 max-w-md">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search functions, syntax, descriptions..."
                className="flex-1 bg-gray-800/60 border border-gray-700/50 rounded-lg px-4 py-2 text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
              />
            </div>
          </div>
          
          {/* Tabs & Filter */}
          <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
            <div className="flex gap-1">
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
                onClick={() => setActiveTab("recipes")}
                className={`px-4 py-1.5 rounded-lg text-sm transition-colors ${
                  activeTab === "recipes"
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                Recipes ({filteredRecipes.length})
              </button>
            </div>
            
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
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
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
        ) : (
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
