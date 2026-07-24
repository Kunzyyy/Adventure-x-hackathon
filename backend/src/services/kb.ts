import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface KBEntry {
  id: number;
  category: string;
  question: string;
  answer: string;
}

interface KBMatch {
  entry: KBEntry;
  score: number;
}

let kbEntries: KBEntry[] = [];
let initialized = false;

function loadKB(): KBEntry[] {
  if (initialized) return kbEntries;
  try {
    const filePath = path.join(__dirname, "kb-data.json");
    const raw = fs.readFileSync(filePath, "utf-8");
    kbEntries = JSON.parse(raw);
    initialized = true;
    console.log(`📚 Knowledge base loaded: ${kbEntries.length} entries`);
  } catch (err) {
    console.warn("⚠️ Failed to load knowledge base, using empty set:", (err as Error).message);
    kbEntries = [];
    initialized = true;
  }
  return kbEntries;
}

// Simple Chinese keyword extraction: extract 2-4 char ngrams
function extractKeywords(text: string): Set<string> {
  const cleaned = text.replace(/[，。！？、；：""''（）\(\)\[\]【】\s\?\!\.\,\;\:\"\'\-]+/g, "");
  const keywords = new Set<string>();

  // Bigrams (2-char)
  for (let i = 0; i < cleaned.length - 1; i++) {
    keywords.add(cleaned.slice(i, i + 2));
  }
  // Trigrams (3-char)
  for (let i = 0; i < cleaned.length - 2; i++) {
    keywords.add(cleaned.slice(i, i + 3));
  }
  // Also add significant single words that are 2+ chars after splitting by common stop words
  const segments = text.split(/[，。！？、；：""''（）\(\)\[\]【】\s\?\!\.\,\;\:\"\'\-]+/);
  for (const seg of segments) {
    if (seg.length >= 2) {
      keywords.add(seg);
    }
  }

  return keywords;
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  // Iterate smaller set for efficiency
  const [smaller, larger] = a.size < b.size ? [a, b] : [b, a];
  for (const item of smaller) {
    if (larger.has(item)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// Check if the question contains a substring of a KB question or vice versa
function substringBonus(userQ: string, kbQ: string): number {
  const uq = userQ.toLowerCase();
  const kq = kbQ.toLowerCase();

  // Exact match
  if (uq === kq) return 0.45;

  // User question contains the entire KB question
  if (uq.includes(kq)) return 0.35;
  // KB question contains the entire user question
  if (kq.includes(uq)) return 0.40;

  // Check if any significant phrase (5+ chars) from KB question appears in user question
  let bonus = 0;
  const minLen = 4;
  for (let i = 0; i < kq.length - minLen; i++) {
    const phrase = kq.slice(i, i + minLen);
    if (uq.includes(phrase)) {
      bonus += 0.05;
      i += minLen - 1; // skip ahead
    }
  }
  return Math.min(bonus, 0.3);
}

const MATCH_THRESHOLD = 0.15; // Minimum score to consider a match
const HIGH_CONFIDENCE = 0.35; // Score above which we're confident

export function searchKnowledgeBase(userQuestion: string): KBMatch | null {
  loadKB();
  if (kbEntries.length === 0) return null;

  const userKeywords = extractKeywords(userQuestion);

  let bestMatch: KBMatch | null = null;

  for (const entry of kbEntries) {
    const kbKeywords = extractKeywords(entry.question);
    const keywordScore = jaccardSimilarity(userKeywords, kbKeywords);
    const subScore = substringBonus(userQuestion, entry.question);
    // Weighted combination
    const totalScore = keywordScore * 0.55 + subScore * 0.45;

    if (totalScore > MATCH_THRESHOLD) {
      if (!bestMatch || totalScore > bestMatch.score) {
        bestMatch = { entry, score: totalScore };
      }
    }
  }

  if (bestMatch && bestMatch.score >= MATCH_THRESHOLD) {
    return bestMatch;
  }
  return null;
}

export function isHighConfidence(score: number): boolean {
  return score >= HIGH_CONFIDENCE;
}

export function getKBStats() {
  loadKB();
  return {
    totalEntries: kbEntries.length,
    categories: [...new Set(kbEntries.map((e) => e.category.split("-")[0]))],
  };
}
