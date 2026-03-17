"use client";

import { useState, useMemo } from "react";
import { designPatterns, designPatternCategories, DesignPattern, CodeExample } from "@/lib/design-patterns";

interface PatternCardProps {
  pattern: DesignPattern;
  onRelatedClick: (patternId: string) => void;
  expanded: boolean;
  onToggle: () => void;
}

function PatternCard({ pattern, onRelatedClick, expanded, onToggle }: PatternCardProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyCode = (code: string, title: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(title);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const difficultyColors = {
    beginner: "bg-green-500/20 text-green-400",
    intermediate: "bg-amber-500/20 text-amber-400",
    advanced: "bg-red-500/20 text-red-400",
  };

  return (
    <div className="bg-gray-800/60 border border-gray-700/50 rounded-lg p-6 hover:bg-gray-800 hover:border-gray-600/50 transition-colors">
      <div 
        className="cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-400">
              {pattern.category}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded font-medium ${difficultyColors[pattern.difficulty]}`}>
              {pattern.difficulty.charAt(0).toUpperCase() + pattern.difficulty.slice(1)}
            </span>
          </div>
          <span className="text-gray-600 text-sm">{expanded ? "−" : "+"}</span>
        </div>
        
        <h2 className="text-lg font-bold text-gray-200 mb-3">{pattern.title}</h2>
        <p className="text-sm text-gray-300">{pattern.overview}</p>
      </div>

      {expanded && (
        <div className="mt-6 space-y-6">
          {/* Problem Section */}
          <div>
            <h3 className="text-sm font-semibold text-orange-400 mb-2 flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-orange-500"></span>
              Problem
            </h3>
            <p className="text-sm text-gray-300">{pattern.problem}</p>
          </div>

          {/* Solution Section */}
          <div>
            <h3 className="text-sm font-semibold text-blue-400 mb-2 flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-blue-500"></span>
              Solution
            </h3>
            <p className="text-sm text-gray-300">{pattern.solution}</p>
          </div>

          {/* Code Examples */}
          {pattern.codeExamples.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-emerald-400 mb-3">Code Examples</h3>
              <div className="space-y-4">
                {pattern.codeExamples.map((example, i) => (
                  <div key={i}>
                    <p className="text-xs text-gray-400 mb-2">{example.title}</p>
                    <div className="relative">
                      <pre className="text-xs font-mono bg-gray-900 px-3 py-3 rounded text-emerald-400 overflow-x-auto whitespace-pre-wrap">
                        {example.code}
                      </pre>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyCode(example.code, example.title);
                        }}
                        className="absolute top-2 right-2 text-[10px] px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
                      >
                        {copiedCode === example.title ? "✓ Copied" : "Copy"}
                      </button>
                    </div>
                    {example.description && (
                      <p className="text-xs text-gray-400 mt-1">{example.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Best Practices */}
          {pattern.bestPractices.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-green-400 mb-2">Best Practices</h3>
              <ul className="space-y-1">
                {pattern.bestPractices.map((practice, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-300">
                    <span className="text-green-400 mt-0.5">✓</span>
                    <span>{practice}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Pitfalls */}
          {pattern.pitfalls.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-red-400 mb-2">Pitfalls</h3>
              <ul className="space-y-1">
                {pattern.pitfalls.map((pitfall, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-300">
                    <span className="text-red-400 mt-0.5">⚠</span>
                    <span>{pitfall}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* When to Use / When Not to Use */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pattern.whenToUse.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-green-400 mb-2">When to Use</h3>
                <ul className="space-y-1">
                  {pattern.whenToUse.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-gray-300">
                      <span className="text-green-400 mt-0.5">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {pattern.whenNotToUse.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-red-400 mb-2">When Not to Use</h3>
                <ul className="space-y-1">
                  {pattern.whenNotToUse.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-gray-300">
                      <span className="text-red-400 mt-0.5">✗</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Related Patterns */}
          {pattern.relatedPatterns.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-purple-400 mb-2">Related Patterns</h3>
              <div className="flex flex-wrap gap-2">
                {pattern.relatedPatterns.map((relatedId) => {
                  const relatedPattern = designPatterns.find(p => p.id === relatedId);
                  return relatedPattern ? (
                    <button
                      key={relatedId}
                      onClick={(e) => {
                        e.stopPropagation();
                        onRelatedClick(relatedId);
                      }}
                      className="text-xs px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors"
                    >
                      {relatedPattern.title}
                    </button>
                  ) : null;
                })}
              </div>
            </div>
          )}

          {/* Tags */}
          {pattern.tags.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-400 mb-2">Tags</h3>
              <div className="flex flex-wrap gap-1">
                {pattern.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Documentation Link */}
          {pattern.docUrl && (
            <div className="pt-4 border-t border-gray-700/50">
              <a
                href={pattern.docUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-sm text-blue-400 hover:text-blue-300"
              >
                📖 Appian Docs →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PatternsPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [expandedPatterns, setExpandedPatterns] = useState<Set<string>>(new Set());

  const filteredPatterns = useMemo(() => {
    return designPatterns.filter(pattern => {
      // Search filter
      const searchTerm = search.toLowerCase();
      const matchesSearch = !searchTerm || 
        pattern.title.toLowerCase().includes(searchTerm) ||
        pattern.overview.toLowerCase().includes(searchTerm) ||
        pattern.problem.toLowerCase().includes(searchTerm) ||
        pattern.solution.toLowerCase().includes(searchTerm) ||
        pattern.tags.some(tag => tag.toLowerCase().includes(searchTerm));
      
      // Category filter
      const matchesCategory = selectedCategory === "all" || pattern.category === selectedCategory;
      
      // Difficulty filter
      const matchesDifficulty = selectedDifficulty === "all" || pattern.difficulty === selectedDifficulty;
      
      return matchesSearch && matchesCategory && matchesDifficulty;
    });
  }, [search, selectedCategory, selectedDifficulty]);

  const togglePattern = (patternId: string) => {
    setExpandedPatterns(prev => {
      const next = new Set(prev);
      if (next.has(patternId)) {
        next.delete(patternId);
      } else {
        next.add(patternId);
      }
      return next;
    });
  };

  const scrollToPattern = (patternId: string) => {
    const element = document.getElementById(`pattern-${patternId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Expand the pattern
      setExpandedPatterns(prev => new Set(prev).add(patternId));
    }
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-lg font-bold">
                ⚡
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">Design Pattern Library</h1>
                <p className="text-[11px] text-gray-500">Architectural patterns & best practices for Appian 25.4</p>
              </div>
            </div>
            
            <a
              href="/"
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white transition-colors"
            >
              ← Back to Cheat Sheet
            </a>
          </div>
          
          {/* Search */}
          <div className="mt-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search patterns by title, overview, problem, solution, or tags..."
              className="w-full bg-gray-800/60 border border-gray-700/50 rounded-lg px-4 py-2 text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
            />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        {/* Left Sidebar */}
        <div className="w-80 flex-shrink-0">
          <div className="sticky top-24 space-y-6">
            {/* Category Filter */}
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-3">Category</h3>
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedCategory === "all"
                      ? "bg-blue-600 text-white"
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                  }`}
                >
                  All Categories ({designPatterns.length})
                </button>
                {designPatternCategories.map((category) => {
                  const count = designPatterns.filter(p => p.category === category).length;
                  return (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedCategory === category
                          ? "bg-blue-600 text-white"
                          : "text-gray-400 hover:text-white hover:bg-gray-800"
                      }`}
                    >
                      {category} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Difficulty Filter */}
            <div>
              <h3 className="text-sm font-semibold text-gray-300 mb-3">Difficulty</h3>
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedDifficulty("all")}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedDifficulty === "all"
                      ? "bg-blue-600 text-white"
                      : "text-gray-400 hover:text-white hover:bg-gray-800"
                  }`}
                >
                  All Levels
                </button>
                {[
                  { value: "beginner", label: "Beginner", color: "text-green-400" },
                  { value: "intermediate", label: "Intermediate", color: "text-amber-400" },
                  { value: "advanced", label: "Advanced", color: "text-red-400" },
                ].map(({ value, label, color }) => {
                  const count = designPatterns.filter(p => p.difficulty === value).length;
                  return (
                    <button
                      key={value}
                      onClick={() => setSelectedDifficulty(value)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedDifficulty === value
                          ? "bg-blue-600 text-white"
                          : "text-gray-400 hover:text-white hover:bg-gray-800"
                      }`}
                    >
                      <span className={selectedDifficulty === value ? "text-white" : color}>
                        {label}
                      </span>
                      <span className="text-gray-500 ml-1">({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-6">
          {filteredPatterns.length > 0 ? (
            filteredPatterns.map((pattern) => (
              <div key={pattern.id} id={`pattern-${pattern.id}`}>
                <PatternCard
                  pattern={pattern}
                  onRelatedClick={scrollToPattern}
                  expanded={expandedPatterns.has(pattern.id)}
                  onToggle={() => togglePattern(pattern.id)}
                />
              </div>
            ))
          ) : (
            <div className="text-center py-16 text-gray-500">
              <div className="text-4xl mb-3">🔍</div>
              <p>No design patterns found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}