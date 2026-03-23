"use client";

import { useState, useRef, useCallback, useEffect } from "react";

const EXAMPLES = [
  {
    title: "Employee Dashboard",
    description:
      "A dashboard with 4 KPI cards across the top (Total Employees, Open Positions, Avg Tenure, Satisfaction Score), a data grid below showing employee records with columns for Name, Department, Start Date, Status, and Actions. Include a search bar and department filter dropdown above the grid.",
    icon: "📊",
  },
  {
    title: "Approval Form",
    description:
      "A multi-section approval form with: Section 1 - Request Details (text field for title, paragraph for description, dropdown for priority, date picker for due date). Section 2 - Attachments (file upload). Section 3 - Approval section with approve/reject buttons and a comments field. Show submitted by info at the top.",
    icon: "✅",
  },
  {
    title: "Project Tracker",
    description:
      "A project tracking interface with tabs for Overview, Tasks, and Timeline. Overview tab shows project name, status badge, progress bar, and team members. Tasks tab has a sortable grid with task name, assignee, status dropdown, and due date. Include a button to add new tasks.",
    icon: "📋",
  },
  {
    title: "Customer Profile",
    description:
      "A customer profile page with a header card showing customer name, company, and avatar. Below that, a two-column layout: left column has contact details (email, phone, address) in a card, right column has a recent activity timeline showing last 5 interactions with timestamps and type icons.",
    icon: "👤",
  },
  {
    title: "Inventory Grid",
    description:
      "An inventory management grid with inline editing. Columns: Product Name, SKU, Category (dropdown), Quantity (integer), Unit Price (decimal), Status (tag-style). Include a toolbar above with search, category filter, and 'Add Item' button. Show total items count.",
    icon: "📦",
  },
  {
    title: "Onboarding Wizard",
    description:
      "A 4-step onboarding wizard with: Step 1 - Personal Info (name, email, phone). Step 2 - Role Setup (department dropdown, manager picker, start date). Step 3 - System Access (checkboxes for different systems). Step 4 - Review & Confirm showing all entered data. Include step indicators, back/next/submit buttons.",
    icon: "🧙",
  },
];

export default function BuilderPage() {
  const [mode, setMode] = useState<"text" | "sketch">("text");
  const [description, setDescription] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codeWarnings, setCodeWarnings] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const codeRef = useRef<HTMLPreElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleImageFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (PNG, JPG, WEBP)");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be under 10MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setImagePreview(dataUrl);
      setImageData(dataUrl);
      setError(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleImageFile(file);
    },
    [handleImageFile]
  );

  const generate = async () => {
    if (mode === "text" && !description.trim()) return;
    if (mode === "sketch" && !imageData) return;

    setIsGenerating(true);
    setGeneratedCode("");
    setError(null);
    setCopied(false);
    setCodeWarnings([]);

    try {
      const response = await fetch("/api/builder/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          description: description.trim() || undefined,
          image: mode === "sketch" ? imageData : undefined,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Generation failed");
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                accumulated += parsed.text;
                setGeneratedCode(accumulated);
              }
            } catch {
              // skip
            }
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsGenerating(false);
      // Run post-generation sanitiser
      setGeneratedCode(prev => {
        const { code, warnings } = sanitizeCode(prev);
        setCodeWarnings(warnings);
        return code;
      });
    }
  };

  // Post-generation sanitiser: fix known Claude hallucinations
  const sanitizeCode = (code: string): { code: string; warnings: string[] } => {
    const warnings: string[] = [];
    let sanitized = code;

    // Fix: a!tagField inside a!richTextDisplayField value
    // Pattern: value: { ... a!tagField( ... } inside a richTextDisplayField context
    const tagInRichTextRegex = /a!richTextDisplayField\s*\([^)]*value\s*:\s*\{[^}]*a!tagField\s*\(/g;
    if (tagInRichTextRegex.test(sanitized)) {
      warnings.push("⚠️ a!tagField was used inside a!richTextDisplayField value - tags are standalone components, not rich text types. Move a!tagField to the parent layout's contents.");
    }

    // Fix: backgroundColor on a!richTextDisplayField
    const bgColorOnRichText = /a!richTextDisplayField\s*\([^)]*backgroundColor\s*:/g;
    if (bgColorOnRichText.test(sanitized)) {
      sanitized = sanitized.replace(
        /(a!richTextDisplayField\s*\([^)]*),\s*backgroundColor\s*:\s*"[^"]*"/g,
        '$1'
      );
      warnings.push("⚠️ Removed backgroundColor from a!richTextDisplayField (not a valid parameter). Wrap in a!cardLayout(style: ...) for background color.");
    }

    // Fix: invalid button styles
    const invalidBtnStyles = /a!buttonWidget\s*\([^)]*style\s*:\s*"(PRIMARY|SECONDARY|DESTRUCTIVE|NORMAL)"/g;
    const btnMatch = sanitized.match(invalidBtnStyles);
    if (btnMatch) {
      sanitized = sanitized.replace(
        /style\s*:\s*"PRIMARY"/g, 'style: "SOLID", color: "ACCENT"'
      ).replace(
        /style\s*:\s*"SECONDARY"/g, 'style: "OUTLINE"'
      ).replace(
        /style\s*:\s*"DESTRUCTIVE"/g, 'style: "SOLID", color: "NEGATIVE"'
      ).replace(
        /style\s*:\s*"NORMAL"/g, 'style: "OUTLINE"'
      );
      warnings.push("⚠️ Fixed invalid button styles (PRIMARY→SOLID+ACCENT, SECONDARY→OUTLINE, DESTRUCTIVE→SOLID+NEGATIVE).");
    }

    // Fix: invalid tagItem backgroundColor values
    const invalidTagBg = /a!tagItem\s*\([^)]*backgroundColor\s*:\s*"(SUCCESS|INFO|WARN|ERROR|STANDARD|PRIMARY)"/g;
    if (invalidTagBg.test(sanitized)) {
      sanitized = sanitized.replace(
        /backgroundColor\s*:\s*"SUCCESS"/g, 'backgroundColor: "POSITIVE"'
      ).replace(
        /backgroundColor\s*:\s*"INFO"/g, 'backgroundColor: "ACCENT"'
      ).replace(
        /backgroundColor\s*:\s*"WARN"/g, 'backgroundColor: "SECONDARY"'
      ).replace(
        /backgroundColor\s*:\s*"ERROR"/g, 'backgroundColor: "NEGATIVE"'
      ).replace(
        /backgroundColor\s*:\s*"STANDARD"/g, 'backgroundColor: "SECONDARY"'
      ).replace(
        /backgroundColor\s*:\s*"PRIMARY"/g, 'backgroundColor: "ACCENT"'
      );
      warnings.push("⚠️ Fixed invalid tagItem backgroundColor values (mapped to valid ACCENT/POSITIVE/NEGATIVE/SECONDARY).");
    }

    // Fix: invalid align values (only LEFT, CENTER, RIGHT are valid)
    const invalidAligns = /align\s*:\s*"(END|START|JUSTIFY|TOP|BOTTOM|MIDDLE)"/gi;
    if (invalidAligns.test(sanitized)) {
      sanitized = sanitized.replace(/align\s*:\s*"END"/gi, 'align: "RIGHT"');
      sanitized = sanitized.replace(/align\s*:\s*"START"/gi, 'align: "LEFT"');
      sanitized = sanitized.replace(/align\s*:\s*"JUSTIFY"/gi, 'align: "LEFT"');
      sanitized = sanitized.replace(/align\s*:\s*"TOP"/gi, 'align: "LEFT"');
      sanitized = sanitized.replace(/align\s*:\s*"BOTTOM"/gi, 'align: "LEFT"');
      sanitized = sanitized.replace(/align\s*:\s*"MIDDLE"/gi, 'align: "CENTER"');
      warnings.push("⚠️ Fixed invalid align values (only LEFT, CENTER, RIGHT are valid).");
    }

    // Fix: named CSS colors used as color values (Appian only accepts hex or semantic names)
    const namedColors: Record<string, string> = {
      "white": "#FFFFFF", "black": "#000000", "red": "#CC0000", "blue": "#1D6FA5",
      "green": "#2E8B57", "gray": "#808080", "grey": "#808080", "orange": "#E67E22",
      "yellow": "#F1C40F", "purple": "#8E44AD", "pink": "#E91E63", "brown": "#795548",
      "WHITE": "#FFFFFF", "BLACK": "#000000", "RED": "#CC0000", "BLUE": "#1D6FA5",
      "GREEN": "#2E8B57", "GRAY": "#808080", "GREY": "#808080", "ORANGE": "#E67E22"
    };
    const colorNameRegex = /color\s*:\s*"(white|black|red|blue|green|gray|grey|orange|yellow|purple|pink|brown)"/gi;
    if (colorNameRegex.test(sanitized)) {
      sanitized = sanitized.replace(colorNameRegex, (match, name) => {
        const hex = namedColors[name] || namedColors[name.toLowerCase()] || "#000000";
        return `color: "${hex}"`;
      });
      warnings.push("⚠️ Fixed named CSS colors (Appian requires hex colors or semantic names like ACCENT/POSITIVE/NEGATIVE/SECONDARY).");
    }

    return { code: sanitized, warnings };
  };

  const copyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const loadExample = (example: (typeof EXAMPLES)[0]) => {
    setMode("text");
    setDescription(example.description);
    setImagePreview(null);
    setImageData(null);
    setGeneratedCode("");
    setError(null);
  };

  const clearAll = () => {
    setDescription("");
    setImagePreview(null);
    setImageData(null);
    setGeneratedCode("");
    setError(null);
  };

  // Auto-scroll code as it streams
  useEffect(() => {
    if (codeRef.current && isGenerating) {
      codeRef.current.scrollTop = codeRef.current.scrollHeight;
    }
  }, [generatedCode, isGenerating]);

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-lg font-bold">
                  ⚡
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white tracking-tight">
                    AI Interface Builder
                  </h1>
                  <p className="text-[11px] text-gray-500">
                    Describe or sketch - get production SAIL code
                  </p>
                </div>
              </a>
            </div>
            <a
              href="/"
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-800 border border-gray-700 text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
            >
              ← Back to Cheat Sheet
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Input */}
          <div className="space-y-4">
            {/* Mode Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setMode("text")}
                className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  mode === "text"
                    ? "bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/20"
                    : "bg-gray-800/60 border border-gray-700/50 text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
                </svg>
                Describe It
              </button>
              <button
                onClick={() => setMode("sketch")}
                className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  mode === "sketch"
                    ? "bg-gradient-to-r from-purple-500 to-blue-600 text-white shadow-lg shadow-purple-500/20"
                    : "bg-gray-800/60 border border-gray-700/50 text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v13.5A1.5 1.5 0 003.75 21z" />
                </svg>
                Upload Sketch
              </button>
            </div>

            {/* Text Input */}
            {mode === "text" && (
              <div>
                <label className="block text-xs text-gray-400 mb-2 font-medium">
                  Describe the interface you need
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. A dashboard with 3 KPI cards at the top, a filterable data grid below showing employee records, and action buttons for create/edit/delete..."
                  rows={6}
                  className="w-full bg-gray-800/60 border border-gray-700/50 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-orange-500/50 resize-none leading-relaxed"
                />
              </div>
            )}

            {/* Sketch Upload */}
            {mode === "sketch" && (
              <div>
                <label className="block text-xs text-gray-400 mb-2 font-medium">
                  Upload a sketch, wireframe, or screenshot
                </label>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                    dragOver
                      ? "border-purple-400 bg-purple-500/10"
                      : imagePreview
                      ? "border-gray-700/50 bg-gray-800/30"
                      : "border-gray-700/50 bg-gray-800/30 hover:border-gray-600 hover:bg-gray-800/50"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageFile(file);
                    }}
                    className="hidden"
                  />

                  {imagePreview ? (
                    <div className="space-y-3">
                      <img
                        src={imagePreview}
                        alt="Uploaded sketch"
                        className="max-h-64 mx-auto rounded-lg border border-gray-700/50"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setImagePreview(null);
                          setImageData(null);
                        }}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors"
                      >
                        Remove image
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-4xl">📎</div>
                      <p className="text-sm text-gray-400">
                        Drop an image here or click to browse
                      </p>
                      <p className="text-xs text-gray-600">
                        PNG, JPG, WEBP up to 10MB
                      </p>
                    </div>
                  )}
                </div>

                {/* Optional description for sketch mode */}
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional: add extra requirements (e.g. 'make the grid sortable', 'use record type Customer')"
                  rows={3}
                  className="w-full mt-3 bg-gray-800/60 border border-gray-700/50 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-purple-500/50 resize-none"
                />
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}

            {/* Generate Button */}
            <button
              onClick={generate}
              disabled={
                isGenerating ||
                (mode === "text" && !description.trim()) ||
                (mode === "sketch" && !imageData)
              }
              className={`w-full py-3.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed ${
                mode === "sketch"
                  ? "bg-gradient-to-r from-purple-500 to-blue-600 text-white hover:from-purple-400 hover:to-blue-500 shadow-lg shadow-purple-500/20"
                  : "bg-gradient-to-r from-orange-500 to-red-600 text-white hover:from-orange-400 hover:to-red-500 shadow-lg shadow-orange-500/20"
              }`}
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating SAIL code...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                  </svg>
                  Generate SAIL Code
                </>
              )}
            </button>

            {/* Examples */}
            <div>
              <p className="text-xs text-gray-500 mb-2 font-medium">
                Quick examples - click to load
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex.title}
                    onClick={() => loadExample(ex)}
                    className="text-left px-3 py-2.5 rounded-lg bg-gray-800/40 border border-gray-700/30 hover:bg-gray-800 hover:border-gray-600/50 transition-colors group"
                  >
                    <div className="text-lg mb-1">{ex.icon}</div>
                    <p className="text-xs font-medium text-gray-300 group-hover:text-white transition-colors">
                      {ex.title}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Tips */}
            <div className="bg-gray-800/30 border border-gray-700/30 rounded-xl p-4">
              <p className="text-xs font-medium text-gray-300 mb-2">💡 Tips for better results</p>
              <ul className="text-xs text-gray-500 space-y-1.5">
                <li>
                  <span className="text-gray-400">Be specific about layout:</span> &quot;3 columns&quot;,
                  &quot;cards in a grid&quot;, &quot;side-by-side&quot;
                </li>
                <li>
                  <span className="text-gray-400">Mention data types:</span> &quot;date picker&quot;,
                  &quot;dropdown with statuses&quot;, &quot;integer field&quot;
                </li>
                <li>
                  <span className="text-gray-400">Specify interactions:</span> &quot;sortable grid&quot;,
                  &quot;inline editing&quot;, &quot;submit button&quot;
                </li>
                <li>
                  <span className="text-gray-400">For sketches:</span> whiteboard photos, Figma
                  exports, or hand-drawn wireframes all work
                </li>
              </ul>
            </div>
          </div>

          {/* Right Panel - Output */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Generated SAIL Code
              </h2>
              <div className="flex gap-2">
                {generatedCode && (
                  <>
                    <button
                      onClick={clearAll}
                      className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700/50 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                    >
                      Clear
                    </button>
                    <button
                      onClick={copyCode}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                        copied
                          ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400"
                          : "bg-gradient-to-r from-orange-500 to-red-600 text-white hover:from-orange-400 hover:to-red-500"
                      }`}
                    >
                      {copied ? "✓ Copied to clipboard" : "Copy Code"}
                    </button>
                  </>
                )}
              </div>
            </div>

            <div
              className={`relative rounded-xl border overflow-hidden ${
                generatedCode
                  ? "bg-gray-900 border-gray-700/50"
                  : "bg-gray-800/20 border-gray-700/30"
              }`}
              style={{ minHeight: "500px" }}
            >
              {generatedCode ? (
                <pre
                  ref={codeRef}
                  className="p-4 text-xs font-mono text-emerald-400 overflow-auto whitespace-pre-wrap leading-relaxed"
                  style={{ maxHeight: "calc(100vh - 280px)", minHeight: "500px" }}
                >
                  {generatedCode}
                  {isGenerating && (
                    <span className="inline-block w-2 h-4 bg-emerald-400 rounded-sm animate-pulse ml-0.5 -mb-0.5" />
                  )}
                </pre>
              ) : (
                <div className="flex flex-col items-center justify-center h-full min-h-[500px] text-center px-8">
                  <div className="text-5xl mb-4 opacity-50">🏗️</div>
                  <p className="text-sm text-gray-400 font-medium mb-2">
                    Your SAIL code will appear here
                  </p>
                  <p className="text-xs text-gray-600 max-w-sm">
                    Describe an interface or upload a sketch, then hit Generate.
                    The code streams in real-time and can be pasted directly into
                    Appian.
                  </p>
                </div>
              )}
            </div>

            {/* Code stats */}
            {generatedCode && !isGenerating && (
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>{generatedCode.split("\n").length} lines</span>
                <span>{generatedCode.length.toLocaleString()} characters</span>
                <span className="text-emerald-500">{codeWarnings.length > 0 ? "Auto-fixed — review warnings below" : "Ready to paste into Appian"}</span>
              </div>
            )}
            {codeWarnings.length > 0 && !isGenerating && (
              <div className="mt-2 space-y-1">
                {codeWarnings.map((w, i) => (
                  <div key={i} className="text-xs text-amber-400 bg-amber-900/20 border border-amber-800/30 rounded px-3 py-1.5">{w}</div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-gray-600">
          <p>
            AI Interface Builder - Part of{" "}
            <a href="/" className="text-blue-500 hover:text-blue-400">
              AppianCheat
            </a>{" "}
            - Generated code is based on SAIL best practices
          </p>
        </div>
      </footer>
    </div>
  );
}
