import patternsData from '../patterns-data.json';

export interface PatternItem {
  id: string;
  title: string;
  type: "pattern" | "anti-pattern";
  category: string;
  problem: string;
  solution: string;
  example: string;
  why: string;
  tags: string[];
}

// Pattern categories for filtering
export const patternCategories = [
  "User Interface",
  "Data", 
  "Integrations",
  "Performance",
  "Process",
  "General",
  "AI"
];

export const patterns: PatternItem[] = patternsData as PatternItem[];