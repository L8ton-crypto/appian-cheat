"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Navbar from "../components/Navbar";
import { ActionToolbar, saveToHistory } from "../components/ReviewToolbar";

interface DocGenerationRequest {
  xml: string;
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback((file: File) => {
    if (file.name.toLowerCase().endsWith('.zip')) {
      alert("ZIP file parsing is coming soon. For now, please extract individual XML files and upload them one at a time.");
      return;
    }

    if (!file.name.toLowerCase().endsWith('.xml')) {
      alert("Please upload an XML file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      
      // Add to files list
      setXmlFiles(prev => [...prev, { name: file.name, content }]);
      
      // Combine all XML into the main xml state
      setXml(prev => prev ? prev + "\n\n<!-- ===== " + file.name + " ===== -->\n\n" + content : content);
      
      // Try to extract project name from first file
      if (!projectName) {
        const projectMatch = content.match(/<package[^>]*name="([^"]+)"/i) || 
                             content.match(/<name[^>]*>([^<]+)</i);
        if (projectMatch) {
          setProjectName(projectMatch[1]);
        }
      }
    };
    reader.readAsText(file);
  }, [projectName]);

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
      // Rebuild combined XML
      setXml(newFiles.map(f => "<!-- ===== " + f.name + " ===== -->\n\n" + f.content).join("\n\n"));
      return newFiles;
    });
  };

  const generateDocumentation = async () => {
    if (!xml.trim()) return;

    setIsGenerating(true);
    setOutput("");

    try {
      const response = await fetch("/api/doc-generator/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          xml,
          projectName: projectName || undefined,
          level,
        } as DocGenerationRequest),
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

  // Simple markdown to HTML converter
  const markdownToHtml = (md: string) => {
    return md
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold text-orange-400 mb-2 mt-4">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold text-orange-300 mb-3 mt-6">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold text-orange-200 mb-4 mt-8">$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-gray-200">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="text-gray-300">$1</em>')
      .replace(/`([^`]+)`/g, '<code class="bg-gray-800 text-orange-300 px-1 py-0.5 rounded text-sm">$1</code>')
      .replace(/```[\s\S]*?```/g, (match) => {
        const code = match.replace(/```\w*\n?/, '').replace(/```$/, '');
        return `<pre class="bg-gray-800 text-gray-300 p-4 rounded-lg my-3 overflow-x-auto"><code>${code}</code></pre>`;
      })
      .replace(/^- (.*$)/gm, '<li class="text-gray-300 mb-1">$1</li>')
      .replace(/(<li[\s\S]*<\/li>)/, '<ul class="list-disc list-inside mb-3">$1</ul>')
      .replace(/^\d+\. (.*$)/gm, '<li class="text-gray-300 mb-1">$1</li>')
      .replace(/(<li[\s\S]*<\/li>)/, '<ol class="list-decimal list-inside mb-3">$1</ol>')
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>');
  };

  const canGenerate = xml.trim() && !isGenerating;

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
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragging
                      ? "border-orange-400 bg-orange-400/10"
                      : "border-gray-600 hover:border-gray-500"
                  }`}
                >
                  <div className="mb-4">
                    <div className="text-4xl mb-2">📁</div>
                    <p className="text-lg font-medium text-gray-200">
                      Drag & drop your XML or ZIP file
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      Or click to browse and select a file
                    </p>
                  </div>
                  <p className="text-xs text-gray-500">
                    Supports .xml and .zip files from Appian package exports
                  </p>
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