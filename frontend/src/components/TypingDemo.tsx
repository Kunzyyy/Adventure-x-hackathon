import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useScrollReveal } from "../hooks/useScrollReveal";
import { useParallax } from "../hooks/useParallax";

const DEMO_LINES = [
  "正在分析你的经历...",
  "提取关键技能标签...",
  "匹配最佳简历模板...",
  "生成HR优化版本...",
  "✅ 简历优化完成！HR评分：92/100",
];

export default function TypingDemo() {
  const { ref, isVisible } = useScrollReveal(0.2);
  const parallax = useParallax(0.1);
  const [lines, setLines] = useState<string[]>([]);
  const [lineIndex, setLineIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    if (!isVisible) return;

    if (lineIndex >= DEMO_LINES.length) return;

    const currentLine = DEMO_LINES[lineIndex];
    if (charIndex < currentLine.length) {
      const timer = setTimeout(() => setCharIndex(charIndex + 1), 40 + Math.random() * 40);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setLines((prev) => [...prev, currentLine]);
        setLineIndex(lineIndex + 1);
        setCharIndex(0);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isVisible, lineIndex, charIndex]);

  return (
    <section id="demo" ref={ref} className="relative py-32 overflow-hidden">
      <div
        className="max-w-3xl mx-auto px-6"
        style={{ transform: `translateY(${parallax * 0.5}px)` }}
      >
        <motion.h2
          className={`text-center mb-16 reveal ${isVisible ? "visible" : ""}`}
          style={{ transitionDelay: "0ms" }}
        >
          实时生成演示
        </motion.h2>

        {/* Terminal-like demo window */}
        <div className="glass rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
          {/* Window chrome */}
          <div className="flex items-center gap-2 px-4 py-3 bg-black/30 border-b border-white/5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
            <span className="ml-3 text-xs text-white/30">AI Resume OS — Terminal</span>
          </div>

          {/* Terminal content */}
          <div className="p-6 font-mono text-sm space-y-1 min-h-[200px]">
            {lines.map((line, i) => (
              <div key={i} className="text-green-400/70">
                {line}
              </div>
            ))}
            {lineIndex < DEMO_LINES.length && (
              <div className="flex">
                <span className="text-blue-400 mr-2">$</span>
                <span className="text-white/70">
                  {DEMO_LINES[lineIndex].slice(0, charIndex)}
                </span>
                <span className="typing-cursor text-blue-400" />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
