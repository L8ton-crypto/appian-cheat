"use client";

import { useState } from "react";

interface HistoryEntry {
  id: string;
  timestamp: number;
  label: string;
  input: string;
  output: string;
  score?: number;
  grade?: string;
}

// Grade calculation from scorecard text
export function extractGrade(output: string): { score: number; grade: string } | null {
  // Try to find "Overall Score: XX/50" or "Overall: X/10"
  const match50 = output.match(/Overall\s*Score:\s*(\d+)\s*\/\s*50/i);
  const match10 = output.match(/Overall:\s*(\d+(?:\.\d+)?)\s*\/\s*10/i);
  const matchGrade = output.match(/Grade:\s*([A-F])/i);
  
  let score = 0;
  if (match50) {
    score = Math.round((parseInt(match50[1]) / 50) * 10);
  } else if (match10) {
    score = Math.round(parseFloat(match10[1]));
  }
  
  let grade = matchGrade ? matchGrade[1].toUpperCase() : "";
  if (!grade && score > 0) {
    if (score >= 9) grade = "A";
    else if (score >= 7) grade = "B";
    else if (score >= 5) grade = "C";
    else if (score >= 3) grade = "D";
    else grade = "F";
  }
  
  if (score > 0 || grade) {
    return { score, grade };
  }
  return null;
}

// Grade badge colors
function gradeColor(grade: string): string {
  switch (grade) {
    case "A": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    case "B": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case "C": return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    case "D": return "bg-orange-500/20 text-orange-400 border-orange-500/30";
    case "F": return "bg-red-500/20 text-red-400 border-red-500/30";
    default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  }
}

export function GradeBadge({ grade, score }: { grade: string; score: number }) {
  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border ${gradeColor(grade)}`}>
      <span className="text-3xl font-black">{grade}</span>
      <div className="text-left">
        <p className="text-[10px] uppercase tracking-wider opacity-70">Overall</p>
        <p className="text-sm font-bold">{score}/10</p>
      </div>
    </div>
  );
}

// History management
const HISTORY_LIMIT = 20;

export function saveToHistory(storageKey: string, entry: Omit<HistoryEntry, "id" | "timestamp">) {
  try {
    const raw = localStorage.getItem(storageKey);
    const history: HistoryEntry[] = raw ? JSON.parse(raw) : [];
    const newEntry: HistoryEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    history.unshift(newEntry);
    if (history.length > HISTORY_LIMIT) history.pop();
    localStorage.setItem(storageKey, JSON.stringify(history));
  } catch {
    // localStorage might be full or unavailable
  }
}

export function getHistory(storageKey: string): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearHistory(storageKey: string) {
  try {
    localStorage.removeItem(storageKey);
  } catch {
    // ignore
  }
}

// Download as markdown
export function downloadAsMarkdown(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Action toolbar (Copy, Download, History, New)
interface ToolbarProps {
  output: string;
  onNew: () => void;
  downloadFilename: string;
  storageKey: string;
  onLoadHistory: (entry: HistoryEntry) => void;
}

export function ActionToolbar({ output, onNew, downloadFilename, storageKey, onLoadHistory }: ToolbarProps) {
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const history = getHistory(storageKey);

  const copyOutput = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const date = new Date().toISOString().split("T")[0];
    downloadAsMarkdown(output, `${downloadFilename}-${date}.md`);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={copyOutput}
          className="px-3 py-1.5 rounded-lg text-sm bg-gray-800 border border-gray-700 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
        >
          {copied ? "✓ Copied" : "📋 Copy"}
        </button>
        <button
          onClick={handleDownload}
          className="px-3 py-1.5 rounded-lg text-sm bg-gray-800 border border-gray-700 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
        >
          📥 Download .md
        </button>
        <button
          onClick={onNew}
          className="px-3 py-1.5 rounded-lg text-sm bg-gradient-to-r from-orange-500 to-red-600 text-white hover:from-orange-400 hover:to-red-500 transition-all"
        >
          ✨ New Analysis
        </button>
        {history.length > 0 && (
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="px-3 py-1.5 rounded-lg text-sm bg-gray-800 border border-gray-700 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
          >
            📜 History ({history.length})
          </button>
        )}
      </div>

      {showHistory && history.length > 0 && (
        <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700">
            <span className="text-xs text-gray-400 font-medium">Recent analyses</span>
            <button
              onClick={() => {
                clearHistory(storageKey);
                setShowHistory(false);
              }}
              className="text-[10px] text-red-400 hover:text-red-300"
            >
              Clear all
            </button>
          </div>
          {history.map((entry) => (
            <button
              key={entry.id}
              onClick={() => {
                onLoadHistory(entry);
                setShowHistory(false);
              }}
              className="w-full text-left px-4 py-2.5 hover:bg-gray-800/60 transition-colors border-b border-gray-800 last:border-0"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-gray-300 truncate flex-1">{entry.label}</span>
                <div className="flex items-center gap-2 shrink-0">
                  {entry.grade && (
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${gradeColor(entry.grade)}`}>
                      {entry.grade}
                    </span>
                  )}
                  <span className="text-[10px] text-gray-500">
                    {new Date(entry.timestamp).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-gray-500 truncate mt-0.5">{entry.input.slice(0, 80)}...</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
