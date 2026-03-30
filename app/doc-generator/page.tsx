"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import JSZip from "jszip";
import Navbar from "../components/Navbar";
import { ActionToolbar, saveToHistory } from "../components/ReviewToolbar";
import { parseAppianExport, inventoryToPrompt, type AppianInventory } from "./appian-parser";

interface DocGenerationRequest {
  inventory: string;
  projectName?: string;
  level: "summary" | "standard" | "comprehensive";
}

export default function DocGeneratorPage() {
  const [mode, setMode] = useState<"upload" | "paste">("upload");
  const [xml, setXml] = useState("");
  const [xmlFiles, setXmlFiles] = useState<{ name: string; content: string }[]>([]);
  const [projectName, setProjectName] = useState("");
  const [level, setLevel] = useState<"summary" | "standard" | "comprehensive">("standard");
  const [isGenerating, setIsGenerating] = useState(false);
  const [output, setOutput] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [inventory, setInventory] = useState<AppianInventory | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isExtracting, setIsExtracting] = useState(false);

  const rebuildInventory = useCallback((files: { name: string; content: string }[], pName?: string) => {
    if (files.length === 0) {
      setInventory(null);
      return;
    }
    const inv = parseAppianExport(files, pName);
    setInventory(inv);
    if (inv.projectName && inv.projectName !== "Appian Application") {
      setProjectName(prev => prev || inv.projectName);
    }
  }, []);

  const addXmlContent = useCallback((name: string, content: string) => {
    setXmlFiles(prev => {
      const updated = [...prev, { name, content }];
      // Also set xml for paste mode compatibility
      setXml(updated.map(f => f.content).join("\n"));
      rebuildInventory(updated, projectName);
      return updated;
    });
  }, [projectName, rebuildInventory]);

  const handleFileUpload = useCallback(async (file: File) => {
    const name = file.name.toLowerCase();

    if (name.endsWith('.zip')) {
      setIsExtracting(true);
      try {
        const zip = await JSZip.loadAsync(file);
        let extracted = 0;

        const entries = Object.entries(zip.files).filter(
          ([path, entry]) => !entry.dir && path.toLowerCase().endsWith('.xml')
        );

        if (entries.length === 0) {
          alert("No XML files found inside the ZIP. Make sure this is an Appian exported package.");
          return;
        }

        for (const [path, entry] of entries) {
          const content = await entry.async("string");
          if (content.trim()) {
            const shortName = path.includes('/') ? path.split('/').pop()! : path;
            addXmlContent(shortName, content);
            extracted++;
          }
        }

        if (extracted === 0) {
          alert("ZIP contained XML files but they were all empty.");
        }
      } catch (err) {
        console.error("ZIP extraction error:", err);
        alert("Failed to read the ZIP file. It may be corrupted or in an unsupported format.");
      } finally {
        setIsExtracting(false);
      }
      return;
    }

    if (!name.endsWith('.xml')) {
      alert("Please upload an XML or ZIP file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      addXmlContent(file.name, content);
    };
    reader.readAsText(file);
  }, [addXmlContent]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    for (let i = 0; i < files.length; i++) {
      handleFileUpload(files[i]);
    }
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        handleFileUpload(files[i]);
      }
    }
  }, [handleFileUpload]);

  const removeFile = (index: number) => {
    setXmlFiles(prev => {
      const newFiles = prev.filter((_, i) => i !== index);
      setXml(newFiles.map(f => f.content).join("\n"));
      rebuildInventory(newFiles, projectName);
      return newFiles;
    });
  };

  const generateDocumentation = async () => {
    // Need either parsed inventory or raw XML (paste mode)
    const hasContent = inventory || xml.trim();
    if (!hasContent) return;

    setIsGenerating(true);
    setOutput("");

    try {
      // If we have an inventory, send the compact prompt. Otherwise fall back to raw XML.
      let payload: Record<string, unknown>;
      if (inventory) {
        const prompt = inventoryToPrompt(inventory);
        payload = {
          inventory: prompt,
          projectName: projectName || inventory.projectName,
          level,
        };
      } else {
        // Paste mode - parse on the fly
        const pastedFiles = [{ name: "pasted.xml", content: xml }];
        const inv = parseAppianExport(pastedFiles, projectName);
        const prompt = inventoryToPrompt(inv);
        payload = {
          inventory: prompt,
          projectName: projectName || inv.projectName,
          level,
        };
      }

      const response = await fetch("/api/doc-generator/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

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
              if (parsed.type === "content" && parsed.text) {
                setOutput((prev) => prev + parsed.text);
              } else if (parsed.type === "done") {
                setIsGenerating(false);
                return;
              }
            } catch {
              // Skip unparseable
            }
          }
        }
      }
    } catch (error) {
      console.error("Generation error:", error);
      setOutput("Error generating documentation. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const STORAGE_KEY = "appian-cheat-doc-generator";

  // Save to history when generation completes
  useEffect(() => {
    if (output && !isGenerating) {
      saveToHistory(STORAGE_KEY, {
        label: projectName || xml.slice(0, 60).replace(/\n/g, " ") + "...",
        input: xml,
        output: output,
      });
    }
  }, [isGenerating, output, xml, projectName]);

  const newDocument = () => {
    setXml("");
    setXmlFiles([]);
    setProjectName("");
    setOutput("");
    setInventory(null);
    setMode("upload");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const loadFromHistory = (entry: { input: string; output: string }) => {
    setXml(entry.input);
    setOutput(entry.output);
    setIsGenerating(false);
  };

  // Store mermaid code blocks separately (avoids HTML attribute escaping issues)
  const mermaidCodesRef = useRef<Map<string, string>>(new Map());

  // Render Mermaid diagrams after output updates
  useEffect(() => {
    if (!output || isGenerating) return;
    
    const timer = setTimeout(async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "dark",
          securityLevel: "loose",
          themeVariables: {
            primaryColor: "#f59e0b",
            primaryTextColor: "#f3f4f6",
            primaryBorderColor: "#d97706",
            lineColor: "#9ca3af",
            secondaryColor: "#374151",
            tertiaryColor: "#1f2937",
            background: "#111827",
            mainBkg: "#1f2937",
            nodeBorder: "#d97706",
            clusterBkg: "#1f293780",
            titleColor: "#f3f4f6",
            edgeLabelBackground: "#1f2937",
          },
          flowchart: { curve: "basis" },
        });
        
        const containers = document.querySelectorAll(".mermaid-container");
        for (let i = 0; i < containers.length; i++) {
          const el = containers[i] as HTMLElement;
          if (el.dataset.rendered === "true") continue;
          const id = el.dataset.mermaidId;
          if (!id) continue;
          const code = mermaidCodesRef.current.get(id);
          if (!code) continue;

          // Sanitize common LLM quirks that break mermaid v11
          let sanitized = code
            .replace(/\r\n/g, "\n")
            .replace(/[""]/g, '"')           // curly quotes
            .replace(/['']/g, "'")           // curly apostrophes
            .replace(/—/g, "--")             // em dashes in labels
            .replace(/–/g, "--")             // en dashes
            .replace(/\u00A0/g, " ")         // non-breaking spaces
            .replace(/^\s*\n/, "")           // leading blank line
            .replace(/\n\s*$/, "");          // trailing blank line

          try {
            const { svg } = await mermaid.render(`mermaid-svg-${Date.now()}-${i}`, sanitized);
            el.innerHTML = svg;
            el.dataset.rendered = "true";
          } catch (err) {
            console.warn("Mermaid parse error for block:", id, err);
            el.innerHTML = `<pre class="text-gray-500 text-xs p-3 bg-gray-800 rounded overflow-x-auto"><code>${sanitized.replace(/</g, "&lt;")}</code></pre>`;
            el.dataset.rendered = "true";
          }
        }
      } catch (err) {
        console.warn("Mermaid load failed:", err);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [output, isGenerating]);

  // Markdown to HTML converter with Mermaid support
  const markdownToHtml = (md: string) => {
    // Reset mermaid codes for fresh render
    mermaidCodesRef.current.clear();
    let mermaidIndex = 0;

    // First handle fenced code blocks (mermaid + regular)
    let result = md.replace(/```(\w*)\n([\s\S]*?)```/g, (_match, lang, code) => {
      if (lang === "mermaid") {
        const id = `mmd-${mermaidIndex++}`;
        mermaidCodesRef.current.set(id, code.trim());
        return `<div class="mermaid-container bg-gray-800/50 rounded-lg p-4 my-4 overflow-x-auto" data-mermaid-id="${id}"><div class="flex items-center gap-2 text-gray-400 text-sm"><div class="w-4 h-4 border-2 border-gray-500/30 border-t-gray-400 rounded-full animate-spin"></div>Rendering diagram...</div></div>`;
      }
      const escapedCode = code.replace(/</g, "&lt;").replace(/>/g, "&gt;");
      return `<pre class="bg-gray-800 text-gray-300 p-4 rounded-lg my-3 overflow-x-auto"><code>${escapedCode}</code></pre>`;
    });
    
    // Then handle inline elements and structure
    result = result
      .replace(/^#### (.*$)/gm, '<h4 class="text-base font-semibold text-orange-400 mb-2 mt-3">$1</h4>')
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold text-orange-400 mb-2 mt-5">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold text-orange-300 mb-3 mt-8 pb-2 border-b border-gray-700">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold text-orange-200 mb-4 mt-8">$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-gray-200">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="text-gray-300">$1</em>')
      .replace(/`([^`]+)`/g, '<code class="bg-gray-800 text-orange-300 px-1.5 py-0.5 rounded text-sm">$1</code>')
      // Tables
      .replace(/^\|(.+)\|\s*\n\|[-| :]+\|\s*\n((?:\|.+\|\s*\n?)*)/gm, (_match, header, body) => {
        const headers = header.split('|').map((h: string) => h.trim()).filter(Boolean);
        const rows = body.trim().split('\n').map((row: string) => 
          row.split('|').map((c: string) => c.trim()).filter(Boolean)
        );
        let table = '<div class="overflow-x-auto my-4"><table class="w-full text-sm"><thead><tr>';
        headers.forEach((h: string) => { table += `<th class="text-left px-3 py-2 bg-gray-800 text-orange-300 font-medium border-b border-gray-600">${h}</th>`; });
        table += '</tr></thead><tbody>';
        rows.forEach((row: string[]) => {
          table += '<tr>';
          row.forEach((cell: string) => { table += `<td class="px-3 py-2 border-b border-gray-700/50 text-gray-300">${cell}</td>`; });
          table += '</tr>';
        });
        table += '</tbody></table></div>';
        return table;
      })
      .replace(/^- (.*$)/gm, '<li class="text-gray-300 mb-1 ml-4 list-disc">$1</li>')
      .replace(/^\d+\. (.*$)/gm, '<li class="text-gray-300 mb-1 ml-4 list-decimal">$1</li>')
      .replace(/\n\n/g, '<div class="mb-3"></div>')
      .replace(/\n/g, '<br>');
    
    return result;
  };

  const canGenerate = (inventory || xml.trim()) && !isGenerating;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Navbar />
      
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
            📄 Solution Doc Generator
          </h1>
          <p className="text-gray-400">
            Generate comprehensive documentation from Appian exported project XML
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Input Panel */}
          <div className="space-y-6">
            {/* Mode Toggle */}
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setMode("upload")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    mode === "upload"
                      ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  Upload File
                </button>
                <button
                  onClick={() => setMode("paste")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    mode === "paste"
                      ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  Paste XML
                </button>
              </div>

              {/* Upload Mode */}
              {mode === "upload" && (
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => !isExtracting && fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    isExtracting
                      ? "border-orange-400 bg-orange-400/10 cursor-wait"
                      : isDragging
                        ? "border-orange-400 bg-orange-400/10 cursor-pointer"
                        : "border-gray-600 hover:border-gray-500 cursor-pointer"
                  }`}
                >
                  {isExtracting ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-orange-300/30 border-t-orange-300 rounded-full animate-spin"></div>
                      <p className="text-lg font-medium text-gray-200">Extracting XML from ZIP...</p>
                    </div>
                  ) : (
                    <>
                      <div className="mb-4">
                        <div className="text-4xl mb-2">📁</div>
                        <p className="text-lg font-medium text-gray-200">
                          Drag & drop your exported project
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                          Or click to browse and select a file
                        </p>
                      </div>
                      <p className="text-xs text-gray-500">
                        Supports .zip (Appian package exports) and individual .xml files
                      </p>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xml,.zip"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              )}

              {/* Uploaded files list */}
              {xmlFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-300">
                      {xmlFiles.length} file{xmlFiles.length > 1 ? "s" : ""} loaded
                    </p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-sm text-orange-400 hover:text-orange-300 transition-colors"
                    >
                      + Add another file
                    </button>
                  </div>
                  {xmlFiles.map((file, i) => (
                    <div key={i} className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">📄</span>
                        <span className="text-sm text-gray-300">{file.name}</span>
                        <span className="text-[10px] text-gray-500">
                          ({(file.content.length / 1024).toFixed(1)}KB)
                        </span>
                      </div>
                      <button
                        onClick={() => removeFile(i)}
                        className="text-gray-500 hover:text-red-400 transition-colors text-sm"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Inventory Summary */}
              {inventory && inventory.objectCount > 0 && (
                <div className="mt-4 bg-gray-900 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-orange-300">
                      📊 Parsed: {inventory.objectCount} objects
                    </h4>
                    <span className="text-xs text-gray-500">
                      {(() => {
                        const prompt = inventoryToPrompt(inventory);
                        const approxTokens = Math.round(prompt.length / 4);
                        return `~${approxTokens.toLocaleString()} tokens (${Math.round(prompt.length / 1024)}KB)`;
                      })()}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      ["Process Models", inventory.summary.processModels],
                      ["Expression Rules", inventory.summary.expressionRules],
                      ["Interfaces", inventory.summary.interfaces],
                      ["Record Types", inventory.summary.recordTypes],
                      ["CDTs", inventory.summary.cdts],
                      ["Constants", inventory.summary.constants],
                      ["Integrations", inventory.summary.integrations],
                      ["Connected Systems", inventory.summary.connectedSystems],
                      ["Groups", inventory.summary.groups],
                      ["Web APIs", inventory.summary.webApis],
                      ["Decisions", inventory.summary.decisions],
                      ["Sites", inventory.summary.sites],
                    ].filter(([, count]) => (count as number) > 0).map(([label, count]) => (
                      <div key={label as string} className="flex items-center justify-between bg-gray-800 rounded px-2 py-1.5">
                        <span className="text-xs text-gray-400">{label}</span>
                        <span className="text-xs font-mono text-orange-400">{count as number}</span>
                      </div>
                    ))}
                  </div>
                  {inventory.crossReferences.length > 0 && (
                    <p className="text-xs text-gray-500 mt-2">
                      {inventory.crossReferences.length} cross-references detected
                    </p>
                  )}
                </div>
              )}

              {/* Paste Mode */}
              {mode === "paste" && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Paste XML Content
                  </label>
                  <textarea
                    value={xml}
                    onChange={(e) => setXml(e.target.value)}
                    placeholder="Paste your Appian package XML content here..."
                    className="w-full h-48 bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none font-mono text-sm"
                  />
                </div>
              )}
            </div>

            {/* Project Settings */}
            <div className="bg-gray-800 rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-200 mb-4">Settings</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Project Name (optional)
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Auto-detected from XML or enter manually"
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2.5 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Documentation Level
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value as "summary" | "standard" | "comprehensive")}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="summary">Summary - High-level overview (1-2 pages)</option>
                  <option value="standard">Standard - All sections with moderate detail</option>
                  <option value="comprehensive">Comprehensive - Exhaustive with code snippets</option>
                </select>
              </div>

              <button
                onClick={generateDocumentation}
                disabled={!canGenerate}
                className={`w-full py-3 px-6 rounded-lg font-medium transition-all ${
                  canGenerate
                    ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 shadow-lg hover:shadow-xl"
                    : "bg-gray-700 text-gray-400 cursor-not-allowed"
                }`}
              >
                {isGenerating ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Generating Documentation...
                  </div>
                ) : (
                  "Generate Documentation"
                )}
              </button>
            </div>
          </div>

          {/* Output Panel */}
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-200">Generated Documentation</h3>
            </div>

            {output && !isGenerating && (
              <div className="mb-4">
                <ActionToolbar
                  output={output}
                  onNew={newDocument}
                  downloadFilename={projectName || "solution-doc"}
                  storageKey={STORAGE_KEY}
                  onLoadHistory={loadFromHistory}
                />
              </div>
            )}

            {output ? (
              <div 
                className="bg-gray-900 rounded-lg p-4 max-h-[600px] overflow-y-auto prose prose-invert prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: markdownToHtml(output) }}
              />
            ) : (
              <div className="bg-gray-900 rounded-lg p-8 text-center text-gray-500">
                {isGenerating ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-orange-300/30 border-t-orange-300 rounded-full animate-spin"></div>
                    <p>Analyzing XML and generating documentation...</p>
                  </div>
                ) : (
                  <p>Upload an XML file or paste content to generate documentation</p>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}