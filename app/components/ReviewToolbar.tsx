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

/**
 * Download as self-contained HTML with diagrams baked in as static SVGs.
 * Captures already-rendered mermaid SVGs from the page DOM so there's
 * zero dependency on mermaid.js in the exported file.
 */
export function downloadAsHtml(markdown: string, filename: string, title?: string) {
  const docTitle = title || filename.replace(/\.html$/, "");

  // Grab rendered SVGs from the page before we touch the markdown
  const renderedSvgs: string[] = [];
  const containers = document.querySelectorAll(".mermaid-container[data-rendered='true']");
  containers.forEach(el => {
    const svg = el.querySelector("svg");
    if (svg) {
      // Clone and make self-contained
      const clone = svg.cloneNode(true) as SVGElement;
      clone.setAttribute("width", "100%");
      clone.removeAttribute("height");
      clone.style.maxWidth = "800px";
      renderedSvgs.push(clone.outerHTML);
    }
  });

  let svgIndex = 0;

  // Convert markdown to HTML, replacing mermaid blocks with captured SVGs
  let body = markdown
    .replace(/```mermaid\n([\s\S]*?)```/g, () => {
      if (svgIndex < renderedSvgs.length) {
        const svg = renderedSvgs[svgIndex++];
        return '<div class="diagram">' + svg + '</div>';
      }
      // No rendered SVG available - skip the diagram
      return '<div class="diagram diagram-unavailable"><p><em>Diagram not available in export</em></p></div>';
    })
    .replace(/```(\w*)\n([\s\S]*?)```/g, (_m, _lang, code) => {
      return '<pre class="code-block"><code>' + code.replace(/</g, "&lt;").replace(/>/g, "&gt;") + '</code></pre>';
    })
    .replace(/^#### (.*$)/gm, '<h4>$1</h4>')
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
    .replace(/^\|(.+)\|\s*\n\|[-| :]+\|\s*\n((?:\|.+\|\s*\n?)*)/gm, (_m, header, tbody) => {
      const headers = header.split('|').map((h: string) => h.trim()).filter(Boolean);
      const rows = tbody.trim().split('\n').map((row: string) =>
        row.split('|').map((c: string) => c.trim()).filter(Boolean)
      );
      let table = '<table><thead><tr>';
      headers.forEach((h: string) => { table += '<th>' + h + '</th>'; });
      table += '</tr></thead><tbody>';
      rows.forEach((row: string[]) => {
        table += '<tr>';
        row.forEach((cell: string) => { table += '<td>' + cell + '</td>'; });
        table += '</tr>';
      });
      return table + '</tbody></table>';
    })
    .replace(/^- (.*$)/gm, '<li>$1</li>')
    .replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');

  body = '<p>' + body + '</p>';

  const dateStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const html = [
    '<!DOCTYPE html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
    '<title>' + docTitle + '</title>',
    '<style>',
    '  :root { --bg: #ffffff; --text: #1a1a2e; --heading: #16213e; --accent: #e67e22; --code-bg: #f5f5f5; --code-text: #333; --border: #dee2e6; --table-stripe: #f9f9f9; }',
    '  @media (prefers-color-scheme: dark) { :root { --bg: #0f172a; --text: #e2e8f0; --heading: #f59e0b; --accent: #f59e0b; --code-bg: #1e293b; --code-text: #e2e8f0; --border: #334155; --table-stripe: #1e293b; } }',
    '  * { margin: 0; padding: 0; box-sizing: border-box; }',
    '  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: var(--bg); color: var(--text); line-height: 1.7; max-width: 900px; margin: 0 auto; padding: 40px 24px; }',
    '  h1 { font-size: 2em; color: var(--heading); margin: 1.5em 0 0.5em; border-bottom: 2px solid var(--accent); padding-bottom: 0.3em; }',
    '  h2 { font-size: 1.5em; color: var(--heading); margin: 1.5em 0 0.5em; border-bottom: 1px solid var(--border); padding-bottom: 0.2em; }',
    '  h3 { font-size: 1.2em; color: var(--heading); margin: 1.2em 0 0.4em; }',
    '  h4 { font-size: 1.05em; color: var(--heading); margin: 1em 0 0.3em; }',
    '  p { margin: 0.5em 0; }',
    '  strong { color: var(--heading); }',
    '  li { margin: 0.3em 0 0.3em 1.5em; }',
    '  .inline-code { background: var(--code-bg); color: var(--accent); padding: 2px 6px; border-radius: 4px; font-size: 0.9em; font-family: "Fira Code", Consolas, monospace; }',
    '  .code-block { background: var(--code-bg); color: var(--code-text); padding: 16px; border-radius: 8px; overflow-x: auto; margin: 1em 0; font-size: 0.85em; font-family: "Fira Code", Consolas, monospace; }',
    '  .diagram { background: var(--code-bg); border-radius: 8px; padding: 16px; margin: 1em 0; text-align: center; overflow-x: auto; }',
    '  .diagram svg { max-width: 100%; height: auto; }',
    '  .diagram-unavailable { color: #888; font-style: italic; padding: 2em; }',
    '  table { width: 100%; border-collapse: collapse; margin: 1em 0; font-size: 0.9em; }',
    '  th { background: var(--accent); color: white; text-align: left; padding: 10px 12px; font-weight: 600; }',
    '  td { padding: 8px 12px; border-bottom: 1px solid var(--border); }',
    '  tr:nth-child(even) { background: var(--table-stripe); }',
    '  .doc-header { text-align: center; margin-bottom: 2em; padding-bottom: 1em; border-bottom: 3px solid var(--accent); }',
    '  .doc-header h1 { border: none; margin: 0; }',
    '  .doc-header .meta { color: #888; font-size: 0.9em; margin-top: 0.5em; }',
    '  @media print { body { max-width: 100%; padding: 20px; } .diagram svg { max-width: 100%; } }',
    '</style>',
    '</head>',
    '<body>',
    '<div class="doc-header">',
    '  <h1>' + docTitle + '</h1>',
    '  <div class="meta">Generated on ' + dateStr + '</div>',
    '</div>',
    body,
    '</body>',
    '</html>'
  ].join('\n');

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith('.html') ? filename : filename + '.html';
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
