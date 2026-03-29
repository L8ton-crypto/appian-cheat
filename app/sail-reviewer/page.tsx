"use client";

import { useState } from "react";
import Navbar from "../components/Navbar";

// Simple markdown-to-HTML function for basic formatting
function markdownToHtml(text: string): string {
  return text
    // Headers
    .replace(/^### (.*$)/gm, '<h3 class="text-lg font-bold text-orange-400 mt-6 mb-3">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold text-orange-400 mt-8 mb-4">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold text-orange-400 mt-10 mb-6">$1</h1>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    // Code blocks
    .replace(/```[\s\S]*?```/g, (match) => {
      const code = match.replace(/```/g, '').trim();
      return `<div class="bg-gray-900 border border-gray-700 rounded-lg p-4 my-4 overflow-x-auto"><pre class="text-gray-300 text-sm"><code>${code}</code></pre></div>`;
    })
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="bg-gray-800 text-orange-300 px-1.5 py-0.5 rounded text-sm">$1</code>')
    // Bullet lists
    .replace(/^\* (.*)$/gm, '<li class="ml-4 mb-2">• $1</li>')
    .replace(/(<li[\s\S]*<\/li>)/, '<ul class="mb-4">$1</ul>')
    // Line breaks
    .replace(/\n/g, '<br>');
}

const EXAMPLE_SNIPPETS = [
  {
    name: "Nested forEach Issue",
    code: `a!localVariables(
  local!items: {1, 2, 3, 4, 5},
  local!categories: {"A", "B", "C"},
  a!gridField(
    data: a!forEach(
      items: local!categories,
      expression: a!forEach(
        items: local!items,
        expression: {
          category: fv!item,
          itemId: fv!item,
          total: sum(local!items)
        }
      )
    ),
    columns: {
      a!gridColumn(label: "Category", value: fv!row.category),
      a!gridColumn(label: "Item", value: fv!row.itemId)
    }
  )
)`
  },
  {
    name: "Inline Query Anti-pattern",
    code: `a!sectionLayout(
  label: "Customer Orders",
  contents: {
    a!forEach(
      items: a!queryEntity(
        entity: cons!CUSTOMER_ENTITY,
        query: a!query(
          selection: a!querySelection(columns: {
            a!queryColumn(field: "customerId"),
            a!queryColumn(field: "name")
          })
        )
      ).data,
      expression: a!cardLayout(
        contents: {
          a!richTextDisplayField(
            value: {
              a!richTextItem(text: fv!item.name, style: "STRONG"),
              char(10),
              a!richTextItem(
                text: "Orders: " & length(a!queryEntity(
                  entity: cons!ORDER_ENTITY,
                  query: a!query(
                    filter: a!queryFilter(field: "customerId", operator: "=", value: fv!item.customerId)
                  )
                ).data)
              )
            }
          )
        }
      )
    )
  }
)`
  },
  {
    name: "Poor Error Handling",
    code: `a!localVariables(
  local!customerId: ri!customerId,
  local!customer: a!queryEntity(
    entity: cons!CUSTOMER_ENTITY,
    query: a!query(
      selection: a!querySelection(columns: {
        a!queryColumn(field: "name"),
        a!queryColumn(field: "email"),
        a!queryColumn(field: "status")
      }),
      filter: a!queryFilter(field: "id", operator: "=", value: local!customerId)
    )
  ).data[1],
  a!formLayout(
    contents: {
      a!textField(
        label: "Name",
        value: local!customer.name,
        saveInto: local!customer.name
      ),
      a!textField(
        label: "Email", 
        value: local!customer.email,
        saveInto: local!customer.email
      ),
      a!dropdownField(
        label: "Status",
        choiceLabels: {"Active", "Inactive"},
        choiceValues: {"ACTIVE", "INACTIVE"},
        value: local!customer.status,
        saveInto: local!customer.status
      )
    },
    buttons: a!buttonArrayLayout(
      buttons: {
        a!buttonWidget(
          label: "Save",
          style: "SOLID",
          submit: true
        )
      }
    )
  )
)`
  }
];

export default function SAILReviewer() {
  const [code, setCode] = useState("");
  const [level, setLevel] = useState<"quick" | "standard" | "deep">("standard");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState("");
  const [showResults, setShowResults] = useState(false);

  const handleReview = async () => {
    if (!code.trim()) return;
    
    setIsAnalyzing(true);
    setShowResults(false);
    setAnalysis("");

    try {
      const response = await fetch("/api/sail-reviewer/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, level })
      });

      if (!response.ok) {
        throw new Error("Analysis failed");
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let analysisContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data.trim() === "") continue;
            
            try {
              const parsed = JSON.parse(data);
              if (parsed.type === "content" && parsed.text) {
                analysisContent += parsed.text;
                setAnalysis(analysisContent);
              } else if (parsed.type === "done") {
                setShowResults(true);
                setIsAnalyzing(false);
                return;
              }
            } catch (e) {
              // Skip unparseable lines
            }
          }
        }
      }
    } catch (error) {
      console.error("Analysis error:", error);
      setAnalysis("❌ **Error**: Failed to analyze code. Please try again.");
      setShowResults(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExampleClick = (exampleCode: string) => {
    setCode(exampleCode);
    setShowResults(false);
    setAnalysis("");
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(analysis);
  };

  const newReview = () => {
    setCode("");
    setAnalysis("");
    setShowResults(false);
    setLevel("standard");
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-950 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              <span className="mr-3">🔍</span>
              SAIL Code Reviewer
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Get comprehensive code reviews for your SAIL expressions. Identifies anti-patterns, performance issues, and suggests best practices.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input Panel */}
            <div className="space-y-6">
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h2 className="text-xl font-semibold text-white mb-4">Your SAIL Code</h2>
                
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Paste your SAIL code here..."
                  rows={12}
                  className="w-full bg-gray-900 text-gray-100 border border-gray-600 rounded-lg p-4 font-mono text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                />

                <div className="flex items-center justify-between mt-4">
                  <div>
                    <label htmlFor="review-level" className="block text-sm font-medium text-gray-300 mb-2">
                      Review Level
                    </label>
                    <select
                      id="review-level"
                      value={level}
                      onChange={(e) => setLevel(e.target.value as "quick" | "standard" | "deep")}
                      className="bg-gray-700 text-white border border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="quick">Quick Scan</option>
                      <option value="standard">Standard Review</option>
                      <option value="deep">Deep Dive</option>
                    </select>
                  </div>

                  <button
                    onClick={handleReview}
                    disabled={!code.trim() || isAnalyzing}
                    className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <span>🔍</span>
                        Review Code
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Example Snippets */}
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Example Code Snippets</h3>
                <p className="text-gray-400 text-sm mb-4">Click any example to auto-populate the code area:</p>
                
                <div className="space-y-3">
                  {EXAMPLE_SNIPPETS.map((snippet, index) => (
                    <button
                      key={index}
                      onClick={() => handleExampleClick(snippet.code)}
                      className="w-full text-left p-4 bg-gray-700 hover:bg-gray-600 rounded-lg border border-gray-600 hover:border-orange-500 transition-all duration-200 group"
                    >
                      <h4 className="text-orange-400 font-medium group-hover:text-orange-300">
                        {snippet.name}
                      </h4>
                      <p className="text-gray-400 text-xs mt-1">
                        Click to load this example with common issues
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Results Panel */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-semibold text-white mb-4">Analysis Results</h2>
              
              {!analysis && !isAnalyzing && (
                <div className="text-center py-12">
                  <div className="text-gray-500 text-6xl mb-4">📋</div>
                  <p className="text-gray-400">
                    Enter your SAIL code and click "Review Code" to get started
                  </p>
                </div>
              )}

              {isAnalyzing && (
                <div className="flex flex-col items-center py-12">
                  <div className="w-12 h-12 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-400">Analyzing your SAIL code...</p>
                </div>
              )}

              {analysis && (
                <div className="space-y-4">
                  <div 
                    className="prose prose-invert max-w-none text-gray-300 text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: markdownToHtml(analysis) }}
                  />

                  {showResults && (
                    <div className="flex gap-3 pt-4 border-t border-gray-700">
                      <button
                        onClick={copyToClipboard}
                        className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2 text-sm"
                      >
                        <span>📋</span>
                        Copy
                      </button>
                      <button
                        onClick={newReview}
                        className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2 text-sm"
                      >
                        <span>✨</span>
                        New Review
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}