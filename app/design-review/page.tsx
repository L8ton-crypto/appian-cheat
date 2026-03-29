"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { checklistSections, ChecklistSection, ChecklistItem } from "@/lib/design-review-data";
import Link from "next/link";

const STORAGE_KEY = "appian-cheat-design-review";
const NOTES_KEY = "appian-cheat-design-review-notes";
const PROJECTS_KEY = "appian-cheat-design-review-projects";

interface ProjectChecklist {
  id: string;
  name: string;
  createdAt: string;
  checked: Record<string, boolean>;
  notes: Record<string, string>;
}

function ChecklistItemRow({
  item,
  checked,
  note,
  onToggle,
  onNoteChange,
}: {
  item: ChecklistItem;
  checked: boolean;
  note: string;
  onToggle: () => void;
  onNoteChange: (note: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editingNote, setEditingNote] = useState(false);
  const [noteText, setNoteText] = useState(note);

  useEffect(() => {
    setNoteText(note);
  }, [note]);

  const saveNote = () => {
    onNoteChange(noteText);
    setEditingNote(false);
  };

  return (
    <div
      className={`group rounded-lg border transition-all ${
        checked
          ? "bg-emerald-500/5 border-emerald-500/20"
          : "bg-gray-800/40 border-gray-700/30 hover:border-gray-600/50"
      }`}
    >
      <div className="flex items-start gap-3 p-3">
        <button
          onClick={onToggle}
          className={`mt-0.5 shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
            checked
              ? "bg-emerald-500 border-emerald-500 text-white"
              : "border-gray-600 hover:border-emerald-400"
          }`}
        >
          {checked && (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p
              className={`text-sm cursor-pointer ${
                checked ? "text-gray-400 line-through" : "text-gray-200"
              }`}
              onClick={() => setExpanded(!expanded)}
            >
              {item.text}
            </p>
            <div className="flex items-center gap-1 shrink-0">
              {item.detail && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="text-gray-600 hover:text-gray-400 transition-colors p-1"
                  title="Show details"
                >
                  <svg className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              )}
              <button
                onClick={() => setEditingNote(!editingNote)}
                className={`p-1 transition-colors ${
                  note ? "text-amber-400 hover:text-amber-300" : "text-gray-600 hover:text-gray-400"
                }`}
                title={note ? "Edit note" : "Add note"}
              >
                <svg className="w-4 h-4" fill={note ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </button>
            </div>
          </div>

          {expanded && item.detail && (
            <div className="mt-2 text-xs text-gray-400 leading-relaxed bg-gray-900/50 rounded p-2.5">
              {item.detail}
              {item.docUrl && (
                <a
                  href={item.docUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block mt-1.5 text-blue-400 hover:text-blue-300 transition-colors"
                >
                  📖 Appian Docs →
                </a>
              )}
            </div>
          )}

          {editingNote && (
            <div className="mt-2">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add a note about this item..."
                className="w-full bg-gray-900/80 border border-gray-700/50 rounded-lg px-3 py-2 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-amber-500/50 resize-none"
                rows={2}
                autoFocus
              />
              <div className="flex gap-2 mt-1.5">
                <button
                  onClick={saveNote}
                  className="text-[10px] px-2.5 py-1 rounded bg-amber-600 text-white hover:bg-amber-500 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => { setEditingNote(false); setNoteText(note); }}
                  className="text-[10px] px-2.5 py-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                {note && (
                  <button
                    onClick={() => { onNoteChange(""); setNoteText(""); setEditingNote(false); }}
                    className="text-[10px] px-2.5 py-1 rounded bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          )}

          {!editingNote && note && (
            <p className="mt-1.5 text-[11px] text-amber-400/80 italic cursor-pointer" onClick={() => setEditingNote(true)}>
              📝 {note}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionCard({
  section,
  checkedItems,
  notes,
  onToggle,
  onNoteChange,
  collapsed,
  onToggleCollapse,
}: {
  section: ChecklistSection;
  checkedItems: Record<string, boolean>;
  notes: Record<string, string>;
  onToggle: (id: string) => void;
  onNoteChange: (id: string, note: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}) {
  const total = section.items.length;
  const completed = section.items.filter((item) => checkedItems[item.id]).length;
  const progress = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div className="rounded-xl border border-gray-700/40 bg-gray-900/50 overflow-hidden">
      <button
        onClick={onToggleCollapse}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-800/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{section.icon}</span>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-gray-200">{section.title}</h3>
            <p className="text-[11px] text-gray-500">{section.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className={`text-sm font-mono font-semibold ${
              completed === total ? "text-emerald-400" : "text-gray-400"
            }`}>
              {completed}/{total}
            </span>
            <div className="w-24 h-1.5 bg-gray-800 rounded-full mt-1 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  completed === total ? "bg-emerald-500" : progress > 0 ? "bg-amber-500" : "bg-gray-700"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform ${collapsed ? "" : "rotate-180"}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {!collapsed && (
        <div className="px-4 pb-4 space-y-2">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-800/50">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400">
              {section.frequency}
            </span>
          </div>
          {section.items.map((item) => (
            <ChecklistItemRow
              key={item.id}
              item={item}
              checked={!!checkedItems[item.id]}
              note={notes[item.id] || ""}
              onToggle={() => onToggle(item.id)}
              onNoteChange={(note) => onNoteChange(item.id, note)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function DesignReviewPage() {
  const [projects, setProjects] = useState<ProjectChecklist[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [filterMode, setFilterMode] = useState<"all" | "unchecked" | "checked">("all");
  const [showExport, setShowExport] = useState(false);

  // Load projects from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(PROJECTS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as ProjectChecklist[];
        setProjects(parsed);
        if (parsed.length > 0) {
          setActiveProjectId(parsed[0].id);
        }
      }
    } catch (e) {
      console.error("Failed to load projects:", e);
    }
  }, []);

  // Save projects to localStorage
  const saveProjects = useCallback((updated: ProjectChecklist[]) => {
    setProjects(updated);
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(updated));
  }, []);

  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) || null,
    [projects, activeProjectId]
  );

  const createProject = () => {
    if (!newProjectName.trim()) return;
    const project: ProjectChecklist = {
      id: `proj-${Date.now()}`,
      name: newProjectName.trim(),
      createdAt: new Date().toISOString(),
      checked: {},
      notes: {},
    };
    const updated = [project, ...projects];
    saveProjects(updated);
    setActiveProjectId(project.id);
    setNewProjectName("");
    setShowNewProject(false);
  };

  const deleteProject = (id: string) => {
    if (!confirm("Delete this project checklist? This cannot be undone.")) return;
    const updated = projects.filter((p) => p.id !== id);
    saveProjects(updated);
    if (activeProjectId === id) {
      setActiveProjectId(updated[0]?.id || null);
    }
  };

  const toggleItem = (itemId: string) => {
    if (!activeProject) return;
    const updated = projects.map((p) =>
      p.id === activeProject.id
        ? { ...p, checked: { ...p.checked, [itemId]: !p.checked[itemId] } }
        : p
    );
    saveProjects(updated);
  };

  const updateNote = (itemId: string, note: string) => {
    if (!activeProject) return;
    const newNotes = { ...activeProject.notes };
    if (note) {
      newNotes[itemId] = note;
    } else {
      delete newNotes[itemId];
    }
    const updated = projects.map((p) =>
      p.id === activeProject.id ? { ...p, notes: newNotes } : p
    );
    saveProjects(updated);
  };

  const toggleSection = (sectionId: string) => {
    setCollapsedSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const resetChecklist = () => {
    if (!activeProject) return;
    if (!confirm("Reset all checkboxes for this project? Notes will be preserved.")) return;
    const updated = projects.map((p) =>
      p.id === activeProject.id ? { ...p, checked: {} } : p
    );
    saveProjects(updated);
  };

  // Stats
  const stats = useMemo(() => {
    if (!activeProject) return { total: 0, completed: 0, progress: 0 };
    const total = checklistSections.reduce((sum, s) => sum + s.items.length, 0);
    const completed = checklistSections.reduce(
      (sum, s) => sum + s.items.filter((item) => activeProject.checked[item.id]).length,
      0
    );
    return { total, completed, progress: total > 0 ? (completed / total) * 100 : 0 };
  }, [activeProject]);

  // Filtered sections
  const filteredSections = useMemo(() => {
    if (filterMode === "all" || !activeProject) return checklistSections;
    return checklistSections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) =>
          filterMode === "unchecked" ? !activeProject.checked[item.id] : !!activeProject.checked[item.id]
        ),
      }))
      .filter((section) => section.items.length > 0);
  }, [filterMode, activeProject]);

  // Export as Markdown
  const exportMarkdown = useCallback(() => {
    if (!activeProject) return "";
    let md = `# Design Review Checklist: ${activeProject.name}\n`;
    md += `_Generated ${new Date().toLocaleDateString()} - ${stats.completed}/${stats.total} items completed (${Math.round(stats.progress)}%)_\n\n`;

    checklistSections.forEach((section) => {
      const sectionCompleted = section.items.filter((item) => activeProject.checked[item.id]).length;
      md += `## ${section.icon} ${section.title} (${sectionCompleted}/${section.items.length})\n\n`;
      section.items.forEach((item) => {
        const checked = activeProject.checked[item.id] ? "x" : " ";
        md += `- [${checked}] ${item.text}\n`;
        const note = activeProject.notes[item.id];
        if (note) md += `  - _Note: ${note}_\n`;
      });
      md += "\n";
    });

    md += `---\n_Source: [Appian Design Review Checklist](https://community.appian.com/success/w/article/3063) via [AppianCheat](https://appian-cheat.vercel.app/design-review)_\n`;
    return md;
  }, [activeProject, stats]);

  const copyExport = () => {
    navigator.clipboard.writeText(exportMarkdown());
    setShowExport(false);
  };

  const downloadExport = () => {
    const blob = new Blob([exportMarkdown()], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `design-review-${activeProject?.name.replace(/\s+/g, "-").toLowerCase() || "export"}.md`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExport(false);
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-base font-bold">
                  ⚡
                </div>
                <span className="text-sm font-bold text-white hidden sm:block">AppianCheat</span>
              </Link>
              <span className="text-gray-600">/</span>
              <div>
                <h1 className="text-lg font-bold text-white">Design Review Checklist</h1>
                <p className="text-[11px] text-gray-500">
                  Based on{" "}
                  <a
                    href="https://community.appian.com/success/w/article/3063"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300"
                  >
                    Appian&apos;s official checklist
                  </a>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/builder"
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
              >
                🏗️ Builder
              </Link>
              <Link
                href="/process-optimizer"
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
              >
                🔍 Optimizer
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Project Selector */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {projects.length > 0 && (
              <select
                value={activeProjectId || ""}
                onChange={(e) => setActiveProjectId(e.target.value)}
                className="bg-gray-800/60 border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500/50 max-w-xs"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({Math.round(
                      (checklistSections.reduce(
                        (sum, s) => sum + s.items.filter((item) => p.checked[item.id]).length,
                        0
                      ) / checklistSections.reduce((sum, s) => sum + s.items.length, 0)) * 100
                    )}%)
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={() => setShowNewProject(true)}
              className="shrink-0 px-3 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-500 transition-colors"
            >
              + New Project
            </button>
            {activeProject && (
              <button
                onClick={() => deleteProject(activeProject.id)}
                className="shrink-0 px-2 py-2 rounded-lg text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                title="Delete project"
              >
                🗑️
              </button>
            )}
          </div>

          {activeProject && (
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border border-gray-700/50 overflow-hidden">
                {(["all", "unchecked", "checked"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setFilterMode(mode)}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                      filterMode === mode
                        ? "bg-blue-600 text-white"
                        : "bg-gray-800/60 text-gray-400 hover:text-white"
                    }`}
                  >
                    {mode === "all" ? "All" : mode === "unchecked" ? "Todo" : "Done"}
                  </button>
                ))}
              </div>
              <button
                onClick={resetChecklist}
                className="px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white bg-gray-800/60 hover:bg-gray-700 transition-colors"
                title="Reset all checkboxes"
              >
                ↺ Reset
              </button>
              <button
                onClick={() => setShowExport(!showExport)}
                className="px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white bg-gray-800/60 hover:bg-gray-700 transition-colors"
                title="Export checklist"
              >
                📋 Export
              </button>
            </div>
          )}
        </div>

        {/* New Project Form */}
        {showNewProject && (
          <div className="mb-6 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
            <h3 className="text-sm font-semibold text-emerald-400 mb-3">New Project Checklist</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createProject()}
                placeholder="Project name (e.g. HR Onboarding App)"
                className="flex-1 bg-gray-800/60 border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-emerald-500/50"
                autoFocus
              />
              <button
                onClick={createProject}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-500 transition-colors"
              >
                Create
              </button>
              <button
                onClick={() => { setShowNewProject(false); setNewProjectName(""); }}
                className="px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white bg-gray-800/60 hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Export Modal */}
        {showExport && activeProject && (
          <div className="mb-6 p-4 rounded-xl border border-blue-500/30 bg-blue-500/5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-blue-400">Export Checklist</h3>
              <button
                onClick={() => setShowExport(false)}
                className="text-gray-500 hover:text-gray-300 transition-colors"
              >
                ✕
              </button>
            </div>
            <pre className="bg-gray-900 rounded-lg p-3 text-[11px] text-gray-400 font-mono overflow-auto max-h-48 mb-3">
              {exportMarkdown()}
            </pre>
            <div className="flex gap-2">
              <button
                onClick={copyExport}
                className="px-4 py-2 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-500 transition-colors"
              >
                📋 Copy to Clipboard
              </button>
              <button
                onClick={downloadExport}
                className="px-4 py-2 rounded-lg text-xs font-medium bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
              >
                💾 Download .md
              </button>
            </div>
          </div>
        )}

        {/* Progress Overview */}
        {activeProject && (
          <div className="mb-6 p-4 rounded-xl border border-gray-700/40 bg-gray-900/50">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-base font-semibold text-white">{activeProject.name}</h2>
                <p className="text-[11px] text-gray-500">
                  Created {new Date(activeProject.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <span className={`text-2xl font-bold font-mono ${
                  stats.progress === 100 ? "text-emerald-400" : stats.progress > 50 ? "text-amber-400" : "text-gray-400"
                }`}>
                  {Math.round(stats.progress)}%
                </span>
                <p className="text-[11px] text-gray-500">
                  {stats.completed} of {stats.total} items
                </p>
              </div>
            </div>
            <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  stats.progress === 100
                    ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                    : stats.progress > 50
                    ? "bg-gradient-to-r from-amber-500 to-amber-400"
                    : "bg-gradient-to-r from-blue-500 to-blue-400"
                }`}
                style={{ width: `${stats.progress}%` }}
              />
            </div>

            {/* Section progress mini-bars */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-4">
              {checklistSections.map((section) => {
                const sectionTotal = section.items.length;
                const sectionDone = section.items.filter((item) => activeProject.checked[item.id]).length;
                const pct = sectionTotal > 0 ? (sectionDone / sectionTotal) * 100 : 0;
                return (
                  <button
                    key={section.id}
                    onClick={() => {
                      setCollapsedSections((prev) => ({ ...prev, [section.id]: false }));
                      document.getElementById(`section-${section.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                    className="text-left p-2 rounded-lg bg-gray-800/40 hover:bg-gray-800/60 transition-colors"
                  >
                    <p className="text-[10px] text-gray-500 truncate">{section.icon} {section.title}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            pct === 100 ? "bg-emerald-500" : pct > 0 ? "bg-amber-500" : "bg-gray-700"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-500 font-mono">{sectionDone}/{sectionTotal}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* No Project State */}
        {!activeProject && !showNewProject && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-xl font-bold text-white mb-2">Appian Design Review Checklist</h2>
            <p className="text-sm text-gray-400 mb-6 max-w-md mx-auto">
              The official Appian design review checklist with 67 items across 10 categories.
              Create a project to start tracking your review progress.
            </p>
            <button
              onClick={() => setShowNewProject(true)}
              className="px-6 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-400 hover:to-teal-500 transition-all"
            >
              + Create Your First Project
            </button>
            <div className="mt-12 grid grid-cols-2 sm:grid-cols-5 gap-3 max-w-3xl mx-auto">
              {checklistSections.map((section) => (
                <div key={section.id} className="p-3 rounded-xl bg-gray-900/50 border border-gray-800/50">
                  <span className="text-xl">{section.icon}</span>
                  <p className="text-xs text-gray-400 mt-1">{section.title}</p>
                  <p className="text-[10px] text-gray-600">{section.items.length} items</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Checklist Sections */}
        {activeProject && (
          <div className="space-y-4">
            {filteredSections.map((section) => (
              <div key={section.id} id={`section-${section.id}`}>
                <SectionCard
                  section={section}
                  checkedItems={activeProject.checked}
                  notes={activeProject.notes}
                  onToggle={toggleItem}
                  onNoteChange={updateNote}
                  collapsed={!!collapsedSections[section.id]}
                  onToggleCollapse={() => toggleSection(section.id)}
                />
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 pb-8 text-center">
          <p className="text-[11px] text-gray-600">
            Based on the{" "}
            <a
              href="https://community.appian.com/success/w/article/3063"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400/60 hover:text-blue-400"
            >
              Appian Design Review Checklist
            </a>
            {" "}· Built with AppianCheat
          </p>
        </footer>
      </main>
    </div>
  );
}
