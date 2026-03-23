"use client";

import React, { useState, useRef, useEffect } from "react";

type WizardStep = 1 | 2 | 3 | 4;

interface WizardState {
  scenario: string;
  tables: string;
  relationships: string;
  dataVolume: string;
  syncFrequency: string;
}

const templateScenarios = {
  "HR Onboarding": "Employee onboarding system with departments, roles, managers, training programs, certification tracking, and onboarding task checklists",
  "Project Management": "Project management system with projects, tasks, team members, time tracking, milestones, and client billing",
  "Inventory Management": "Inventory management system with products, warehouses, suppliers, purchase orders, stock movements, and reorder thresholds"
};

export default function DataFabricWizard() {
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [formData, setFormData] = useState<WizardState>({
    scenario: "",
    tables: "",
    relationships: "",
    dataVolume: "Small (<10k rows)",
    syncFrequency: "Real-time"
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [output, setOutput] = useState("");
  const outputRef = useRef<HTMLDivElement>(null);

  // Auto-scroll output container during streaming
  useEffect(() => {
    if (outputRef.current && isGenerating) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output, isGenerating]);

  const resetWizard = () => {
    setCurrentStep(1);
    setFormData({
      scenario: "",
      tables: "",
      relationships: "",
      dataVolume: "Small (<10k rows)",
      syncFrequency: "Real-time"
    });
    setOutput("");
    setIsGenerating(false);
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep((prev) => (prev + 1) as WizardStep);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as WizardStep);
    }
  };

  const skipStep2 = () => {
    setFormData(prev => ({ ...prev, tables: "" }));
    setCurrentStep(3);
  };

  const useTemplate = (template: keyof typeof templateScenarios) => {
    setFormData(prev => ({ ...prev, scenario: templateScenarios[template] }));
  };

  const generateRecommendations = async () => {
    setIsGenerating(true);
    setOutput("");
    setCurrentStep(4);

    try {
      const response = await fetch("/api/data-fabric/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario: formData.scenario,
          tables: formData.tables,
          relationships: formData.relationships,
          dataVolume: formData.dataVolume,
          syncFrequency: formData.syncFrequency
        }),
      });

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
              setIsGenerating(false);
              continue;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                setOutput(prev => prev + parsed.text);
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (error) {
      console.error("Error generating recommendations:", error);
      setOutput("Error generating recommendations. Please try again.");
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
  };

  const renderMarkdown = (text: string) => {
    const lines = text.split("\n");
    const elements: React.ReactElement[] = [];
    let i = 0;
    
    while (i < lines.length) {
      const line = lines[i];
      
      // Headers
      if (line.startsWith("## ")) {
        elements.push(
          <div key={i} className="flex items-center gap-3 mt-6 mb-3">
            <div className="w-1 h-6 bg-emerald-500"></div>
            <h3 className="text-lg font-bold text-white">{line.slice(3)}</h3>
          </div>
        );
        i++;
      }
      // Code blocks
      else if (line.startsWith("```")) {
        const language = line.slice(3);
        const codeLines = [];
        i++;
        while (i < lines.length && !lines[i].startsWith("```")) {
          codeLines.push(lines[i]);
          i++;
        }
        elements.push(
          <div key={i} className="my-4 bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm">
              <code className={language === "sql" ? "text-blue-300" : language === "sail" ? "text-orange-300" : "text-gray-300"}>
                {codeLines.join("\n")}
              </code>
            </pre>
          </div>
        );
        i++;
      }
      // Bullet points
      else if (line.startsWith("- ") || line.startsWith("* ")) {
        elements.push(
          <li key={i} className="text-gray-300 ml-4 mb-2">{line.slice(2)}</li>
        );
        i++;
      }
      // Regular text
      else if (line.trim()) {
        elements.push(
          <p key={i} className="text-gray-300 mb-2">{line}</p>
        );
        i++;
      }
      // Empty lines
      else {
        i++;
      }
    }
    
    return elements;
  };

  const isStep1Valid = formData.scenario.length >= 10;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-sm font-bold">⚡</div>
              <span className="text-lg font-bold text-white">AppianCheat</span>
            </a>
            <span className="text-gray-600">|</span>
            <h2 className="text-sm font-medium text-emerald-400">Data Fabric Wizard</h2>
          </div>
          <a href="/" className="text-sm text-gray-400 hover:text-gray-200 transition-colors">← Back to Cheat Sheet</a>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-white">Data Fabric Wizard</h1>
            <span className="text-sm text-gray-400">Step {currentStep} of 4</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-teal-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Step 1: Describe Your Scenario */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">Describe Your Scenario</h2>
              <textarea
                value={formData.scenario}
                onChange={(e) => setFormData(prev => ({ ...prev, scenario: e.target.value }))}
                placeholder="Describe your business scenario... e.g. 'Employee onboarding system with departments, roles, training modules, and certification tracking'"
                className="w-full h-32 p-4 bg-gray-900 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:border-emerald-500 focus:outline-none resize-none"
              />
              <p className="text-sm text-gray-500 mt-2">Minimum 10 characters required</p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-white mb-3">Quick Start Templates</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.keys(templateScenarios).map((template) => (
                  <button
                    key={template}
                    onClick={() => useTemplate(template as keyof typeof templateScenarios)}
                    className="p-4 bg-gray-900 border border-gray-700 rounded-lg hover:border-emerald-500 transition-colors text-left"
                  >
                    <span className="font-medium text-emerald-400">{template}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Existing Tables */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">Existing Tables (Optional)</h2>
              <textarea
                value={formData.tables}
                onChange={(e) => setFormData(prev => ({ ...prev, tables: e.target.value }))}
                placeholder="List any existing tables or entities... e.g. employees, departments, roles"
                className="w-full h-32 p-4 bg-gray-900 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:border-emerald-500 focus:outline-none resize-none"
              />
            </div>

            <button
              onClick={skipStep2}
              className="text-gray-400 hover:text-gray-200 transition-colors underline"
            >
              Skip this step
            </button>
          </div>
        )}

        {/* Step 3: Configuration */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white mb-4">Configuration</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Data Volume</label>
              <select
                value={formData.dataVolume}
                onChange={(e) => setFormData(prev => ({ ...prev, dataVolume: e.target.value }))}
                className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-gray-200 focus:border-emerald-500 focus:outline-none"
              >
                <option value="Small (<10k rows)">Small (&lt;10k rows)</option>
                <option value="Medium (10k-100k)">Medium (10k-100k)</option>
                <option value="Large (100k-1M)">Large (100k-1M)</option>
                <option value="Enterprise (1M+)">Enterprise (1M+)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Sync Frequency</label>
              <select
                value={formData.syncFrequency}
                onChange={(e) => setFormData(prev => ({ ...prev, syncFrequency: e.target.value }))}
                className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-gray-200 focus:border-emerald-500 focus:outline-none"
              >
                <option value="Real-time">Real-time</option>
                <option value="Every 15 minutes">Every 15 minutes</option>
                <option value="Hourly">Hourly</option>
                <option value="Daily">Daily</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Known Relationships (Optional)</label>
              <textarea
                value={formData.relationships}
                onChange={(e) => setFormData(prev => ({ ...prev, relationships: e.target.value }))}
                placeholder="Describe any known relationships... e.g. employees belong to departments, each department has one manager"
                className="w-full h-24 p-4 bg-gray-900 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:border-emerald-500 focus:outline-none resize-none"
              />
            </div>
          </div>
        )}

        {/* Step 4: Generate & Results */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Generated Recommendations</h2>
              {output && (
                <button
                  onClick={copyToClipboard}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors text-sm"
                >
                  Copy Output
                </button>
              )}
            </div>

            <div 
              ref={outputRef}
              className="min-h-[400px] max-h-[600px] overflow-y-auto p-6 bg-gray-900 rounded-lg border border-gray-700"
            >
              {isGenerating && !output && (
                <div className="flex items-center justify-center h-40">
                  <div className="flex items-center gap-2 text-gray-400">
                    <span>Generating recommendations</span>
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              {output && (
                <div className="prose prose-invert max-w-none">
                  {renderMarkdown(output)}
                  {isGenerating && (
                    <span className="inline-block w-2 h-5 bg-emerald-500 animate-pulse"></span>
                  )}
                </div>
              )}
            </div>

            {!isGenerating && output && (
              <button
                onClick={resetWizard}
                className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
              >
                Start Over
              </button>
            )}
          </div>
        )}

        {/* Navigation */}
        {currentStep < 4 && (
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-800">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className="px-6 py-2 text-gray-400 hover:text-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Back
            </button>

            <button
              onClick={currentStep === 3 ? generateRecommendations : nextStep}
              disabled={currentStep === 1 && !isStep1Valid}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentStep === 3 ? 'Generate Recommendations' : 'Next →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}