"use client";

import React, { useState, useRef, useEffect } from "react";
import Navbar from "../components/Navbar";
import { ActionToolbar, GradeBadge, extractGrade, saveToHistory } from "../components/ReviewToolbar";

type InputType = "description" | "xml";

const exampleDescriptions: Record<string, string> = {
  "Employee Onboarding": `Process model for new employee onboarding:
1. Start event triggered by HR submitting new hire form
2. Script task: Create employee record in database
3. Script task: Generate employee ID
4. Parallel gateway:
   - Branch 1: Send welcome email to employee
   - Branch 2: Create Active Directory account (integration)
   - Branch 3: Order laptop from ServiceNow (integration)
5. Converging gateway (wait for all)
6. User task: Manager assigns onboarding buddy (1 day SLA)
7. User task: IT confirms equipment setup
8. Script task: Update employee status to "Active"
9. Send notification to HR
10. End event

Process variables: employeeRecord (CDT), managerId (Number), equipmentStatus (Text), emailSent (Boolean)
No error handling configured. Process runs synchronously.`,

  "Invoice Approval": `Invoice approval workflow:
1. Start: Invoice submitted via portal
2. Script: Look up vendor in database using a!queryEntity
3. XOR gateway: Check invoice amount
   - Under 1000: Auto-approve, skip to step 7
   - 1000-10000: Route to department manager
   - Over 10000: Route to finance director, then VP
4. User task: Reviewer approves/rejects (3 day SLA)
5. XOR gateway: Approved?
   - Yes: Continue
   - No: Send rejection email, end
6. For invoices over 10000: Second approval user task
7. Script: Update invoice status in database
8. Script: Trigger payment in ERP (REST integration)
9. Script: Send confirmation email
10. End

Variables: invoice (CDT with all fields), approver (User), allInvoiceHistory (list of CDT - full history loaded)
forEach loop sends individual emails for line items.`,

  "Case Management": `Customer support case management process:
1. Start: Case created from email or portal
2. Script: Auto-categorize using keyword matching (nested forEach on categories and keywords)
3. Script: Assign to queue based on category
4. User task: Agent reviews and works case (no SLA)
5. Gateway: Need more info?
   - Yes: Send email to customer, wait for reply timer (7 days)
   - No: Continue to resolution
6. User task: Agent documents resolution
7. Script: Close case, update status
8. Script: Send satisfaction survey
9. End

No sub-processes used. All logic in one process model (~45 nodes).
Process variables include: caseRecord, customerRecord, allPreviousCases (full query), agentNotes (Text), attachments (list of Document).
Timer event has no cleanup configured.`
};

export default function ProcessOptimizer() {
  const [inputType, setInputType] = useState<InputType>("description");
  const [input, setInput] = useState("");
  const [context, setContext] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [output, setOutput] = useState("");
  const [showExamples, setShowExamples] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (outputRef.current && isAnalyzing) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output, isAnalyzing]);

  const useExample = (name: string) => {
    setInput(exampleDescriptions[name]);
    setInputType("description");
    setShowExamples(false);
  };

  const analyzeProcess = async () => {
    setIsAnalyzing(true);
    setOutput("");

    try {
      const response = await fetch("/api/process-optimizer/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, inputType, context }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Analysis failed");
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
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
            if (data === "[DONE]") {
              setIsAnalyzing(false);
              continue;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                setOutput((prev) => prev + parsed.text);
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (error) {
      console.error("Analysis error:", error);
      setOutput(
        `Error: ${error instanceof Error ? error.message : "Analysis failed. Please try again."}`
      );
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setInput("");
    setContext("");
    setOutput("");
    setIsAnalyzing(false);
  };

  const STORAGE_KEY = "appian-cheat-process-optimizer";

  // Save to history when analysis completes
  useEffect(() => {
    if (output && !isAnalyzing) {
      const gradeInfo = extractGrade(output);
      saveToHistory(STORAGE_KEY, {
        label: input.slice(0, 60).replace(/\n/g, " ") + "...",
        input: input,
        output: output,
        score: gradeInfo?.score,
        grade: gradeInfo?.grade,
      });
    }
  }, [isAnalyzing, output, input]);

  const loadFromHistory = (entry: { input: string; output: string }) => {
    setInput(entry.input);
    setOutput(entry.output);
    setIsAnalyzing(false);
  };

  const isValid = input.trim().length >= 20;

  const renderMarkdown = (text: string) => {
    const lines = text.split("\n");
    const elements: React.ReactElement[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      if (line.startsWith("## ")) {
        elements.push(
          <div key={i} className="flex items-center gap-3 mt-6 mb-3">
            <div className="w-1 h-6 bg-orange-500"></div>
            <h3 className="text-lg font-bold text-white">{line.slice(3)}</h3>
          </div>
        );
        i++;
      } else if (line.startsWith("### ")) {
        elements.push(
          <h4 key={i} className="text-base font-semibold text-gray-200 mt-4 mb-2">
            {line.slice(4)}
          </h4>
        );
        i++;
      } else if (line.startsWith("```")) {
        const language = line.slice(3).trim();
        const codeLines: string[] = [];
        i++;
        while (i < lines.length && !lines[i].startsWith("```")) {
          codeLines.push(lines[i]);
          i++;
        }
        const colorClass =
          language === "sql"
            ? "text-blue-300"
            : language === "sail"
            ? "text-orange-300"
            : language === "xml"
            ? "text-cyan-300"
            : "text-gray-300";
        elements.push(
          <div key={i} className="my-4 bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm">
              <code className={colorClass}>{codeLines.join("\n")}</code>
            </pre>
          </div>
        );
        i++;
      } else if (line.startsWith("- ") || line.startsWith("* ")) {
        elements.push(
          <li key={i} className="text-gray-300 ml-4 mb-2">
            {renderInline(line.slice(2))}
          </li>
        );
        i++;
      } else if (/^\d+\.\s/.test(line)) {
        elements.push(
          <li key={i} className="text-gray-300 ml-4 mb-2 list-decimal">
            {renderInline(line.replace(/^\d+\.\s/, ""))}
          </li>
        );
        i++;
      } else if (line.trim()) {
        elements.push(
          <p key={i} className="text-gray-300 mb-2">
            {renderInline(line)}
          </p>
        );
        i++;
      } else {
        i++;
      }
    }

    return elements;
  };

  const renderInline = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return parts.map((part, idx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={idx} className="text-white font-semibold">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code key={idx} className="text-orange-400 bg-gray-800 px-1 py-0.5 rounded text-sm">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  const severityColors: Record<string, string> = {
    critical: "bg-red-500/20 text-red-400 border-red-500/30",
    warning: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    info: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Hero */}
        {!output && !isAnalyzing && (
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-3">
              Process Model Optimizer
            </h1>
            <p className="text-gray-400 text-lg">
              Paste your process model XML or describe your flow - get instant performance analysis, best practice checks, and optimization recommendations.
            </p>
          </div>
        )}

        {/* Input Section */}
        {!output && !isAnalyzing && (
          <div className="space-y-6">
            {/* Input Type Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setInputType("description")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  inputType === "description"
                    ? "bg-orange-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:text-white"
                }`}
              >
                📝 Describe Your Process
              </button>
              <button
                onClick={() => setInputType("xml")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  inputType === "xml"
                    ? "bg-orange-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:text-white"
                }`}
              >
                📄 Paste XML
              </button>
            </div>

            {/* Main Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {inputType === "xml"
                  ? "Process Model XML"
                  : "Process Description"}
              </label>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  inputType === "xml"
                    ? "Paste your process model XML export here..."
                    : "Describe your process model step by step...\n\nExample:\n1. Start event: User submits request form\n2. Script task: Validate input data\n3. Gateway: Is amount > $1000?\n   - Yes: Route to manager approval\n   - No: Auto-approve\n4. User task: Manager reviews (2 day SLA)\n..."
                }
                className="w-full h-64 p-4 bg-gray-900 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-600 focus:border-orange-500 focus:outline-none resize-none font-mono text-sm"
              />
              <div className="flex items-center justify-between mt-2">
                <p className="text-sm text-gray-500">
                  {input.length < 20
                    ? `Minimum 20 characters (${20 - input.length} more needed)`
                    : `${input.length} characters`}
                </p>
                {input.length > 0 && (
                  <button
                    onClick={() => setInput("")}
                    className="text-xs text-gray-500 hover:text-gray-300"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Additional Context */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Additional Context{" "}
                <span className="text-gray-500 font-normal">(optional)</span>
              </label>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Any additional context... e.g. 'This process runs 500 times per day' or 'We're experiencing 10-second delays at step 4' or 'Migrating from 23.4 to 25.4'"
                className="w-full h-20 p-4 bg-gray-900 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-600 focus:border-orange-500 focus:outline-none resize-none text-sm"
              />
            </div>

            {/* Example Scenarios */}
            <div>
              <button
                onClick={() => setShowExamples(!showExamples)}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
              >
                <span className={`transition-transform ${showExamples ? "rotate-90" : ""}`}>
                  ▶
                </span>
                Try an example scenario
              </button>

              {showExamples && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                  {Object.keys(exampleDescriptions).map((name) => (
                    <button
                      key={name}
                      onClick={() => useExample(name)}
                      className="p-4 bg-gray-900 border border-gray-700 rounded-lg hover:border-orange-500 transition-colors text-left"
                    >
                      <span className="font-medium text-orange-400 text-sm">{name}</span>
                      <p className="text-xs text-gray-500 mt-1">
                        {exampleDescriptions[name].split("\n")[0].slice(0, 60)}...
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Analyze Button */}
            <div className="pt-4">
              <button
                onClick={analyzeProcess}
                disabled={!isValid}
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed text-lg"
              >
                🔍 Analyze Process Model
              </button>
            </div>
          </div>
        )}

        {/* Output Section */}
        {(isAnalyzing || output) && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                Analysis Results
              </h2>
              <div className="flex items-center gap-2">
                {output && !isAnalyzing && (() => {
                  const gradeInfo = extractGrade(output);
                  return gradeInfo ? <GradeBadge grade={gradeInfo.grade} score={gradeInfo.score} /> : null;
                })()}
              </div>
            </div>

            {output && !isAnalyzing && (
              <ActionToolbar
                output={output}
                onNew={reset}
                downloadFilename="process-optimization"
                storageKey={STORAGE_KEY}
                onLoadHistory={loadFromHistory}
              />
            )}

            <div
              ref={outputRef}
              className="min-h-[400px] max-h-[700px] overflow-y-auto p-6 bg-gray-900 rounded-lg border border-gray-700"
            >
              {isAnalyzing && !output && (
                <div className="flex items-center justify-center h-40">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-400 mb-3">
                      <span>Analyzing your process model</span>
                      <div className="flex gap-1">
                        <div
                          className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        ></div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600">
                      Checking performance, best practices, security...
                    </p>
                  </div>
                </div>
              )}

              {output && (
                <div className="prose prose-invert max-w-none">
                  {renderMarkdown(output)}
                  {isAnalyzing && (
                    <span className="inline-block w-2 h-5 bg-orange-500 animate-pulse"></span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
