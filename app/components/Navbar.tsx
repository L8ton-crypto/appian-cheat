"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";

const AI_TOOLS = [
  { href: "/builder", label: "Interface Builder", icon: "🏗️", desc: "Text or sketch to SAIL code" },
  { href: "/sail-reviewer", label: "SAIL Reviewer", icon: "🔍", desc: "Code review against best practices" },
  { href: "/process-optimizer", label: "Process Optimizer", icon: "⚡", desc: "Analyse & optimize process models" },
  { href: "/doc-generator", label: "Doc Generator", icon: "📄", desc: "Generate solution docs from XML" },
  { href: "/data-fabric", label: "Data Fabric Wizard", icon: "🧩", desc: "Generate data architecture from scenarios" },
];

export default function Navbar() {
  const [toolsOpen, setToolsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setToolsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isToolPage = AI_TOOLS.some((t) => t.href === pathname);

  return (
    <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Logo */}
        <a href="/" className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-base font-bold">
            ⚡
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight leading-tight">AppianCheat</h1>
            <p className="text-[10px] text-gray-500 leading-tight">Appian 25.4</p>
          </div>
        </a>

        {/* Links */}
        <div className="flex items-center gap-1">
          <a
            href="/"
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              pathname === "/"
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            📚 Reference
          </a>

          {/* AI Tools dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setToolsOpen(!toolsOpen)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-1 ${
                isToolPage
                  ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              🛠️ AI Tools
              <svg
                className={`w-3.5 h-3.5 transition-transform ${toolsOpen ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {toolsOpen && (
              <div className="absolute top-full left-0 mt-1 w-72 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50">
                {AI_TOOLS.map((tool) => (
                  <a
                    key={tool.href}
                    href={tool.href}
                    onClick={() => setToolsOpen(false)}
                    className={`flex items-start gap-3 px-4 py-3 transition-colors ${
                      pathname === tool.href
                        ? "bg-gray-800 border-l-2 border-orange-500"
                        : "hover:bg-gray-800/60 border-l-2 border-transparent"
                    }`}
                  >
                    <span className="text-lg mt-0.5">{tool.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-200">{tool.label}</p>
                      <p className="text-[11px] text-gray-500">{tool.desc}</p>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>

          <a
            href="/patterns"
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              pathname === "/patterns"
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            📐 Patterns
          </a>


        </div>
      </div>
    </nav>
  );
}
